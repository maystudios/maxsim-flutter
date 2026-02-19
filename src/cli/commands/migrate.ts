import { Command } from 'commander';
import * as p from '@clack/prompts';
import { dump as yamlDump } from 'js-yaml';
import fs from 'fs-extra';
import path from 'node:path';
import { writeFile } from 'node:fs/promises';
import { ProjectDetector } from '../../core/detector.js';
import type { AnalysisReport } from '../../core/detector.js';
import { parseConfig } from '../../core/config/loader.js';
import { createProjectContext } from '../../core/context.js';
import { runClaudeSetup } from '../../claude-setup/setup-orchestrator.js';
import { createSpinner } from '../ui/spinner.js';

interface MigrateOptions {
  analysisOnly: boolean;
  yes: boolean;
}

export function createMigrateCommand(): Command {
  const cmd = new Command('migrate');

  cmd
    .description('Analyze and migrate an existing Flutter project to maxsim conventions')
    .argument('[path]', 'Path to the Flutter project (default: current directory)')
    .option('--analysis-only', 'Output analysis report without making changes')
    .option('--yes', 'Skip confirmation prompts')
    .action(async (projectPath: string | undefined, options: Record<string, unknown>) => {
      try {
        await runMigrate(projectPath, {
          analysisOnly: options.analysisOnly === true,
          yes: options.yes === true,
        });
      } catch (err) {
        p.log.error(err instanceof Error ? err.message : String(err));
        process.exit(1);
      }
    });

  return cmd;
}

async function runMigrate(
  projectArg: string | undefined,
  options: MigrateOptions,
): Promise<void> {
  const targetPath = path.resolve(projectArg ?? '.');

  p.intro('maxsim-flutter — Migrate Flutter project');

  if (!(await fs.pathExists(path.join(targetPath, 'pubspec.yaml')))) {
    throw new Error(`Not a Flutter project: pubspec.yaml not found at ${targetPath}`);
  }

  const spinner = createSpinner('Analyzing project...');
  spinner.start();

  const detector = new ProjectDetector();
  const report = await detector.analyzeProject(targetPath);

  spinner.succeed(`Analysis complete for project: ${report.projectName}`);

  displayReport(report);

  if (options.analysisOnly) {
    p.outro('Analysis complete. Run without --analysis-only to apply migration.');
    return;
  }

  if (!options.yes) {
    const confirmed = await p.confirm({
      message: `Apply maxsim conventions to '${report.projectName}'?`,
    });
    if (p.isCancel(confirmed) || !confirmed) {
      p.cancel('Migration cancelled.');
      return;
    }
  }

  await applyMigration(targetPath, report);

  p.outro('Migration complete! Review the generated files and update maxsim.config.yaml as needed.');
}

function displayReport(report: AnalysisReport): void {
  const difficultyIcon: Record<string, string> = {
    simple: 'OK',
    moderate: 'WARN',
    complex: 'HIGH',
  };

  p.log.info(
    [
      'Analysis Report',
      `  Project:          ${report.projectName}`,
      `  Architecture:     ${report.architecture}`,
      `  State Mgmt:       ${report.stateManagement}`,
      `  Routing:          ${report.routing}`,
      `  Modules detected: ${report.detectedModules.length > 0 ? report.detectedModules.join(', ') : 'none'}`,
      `  Migration:        [${difficultyIcon[report.migrationDifficulty] ?? report.migrationDifficulty}] ${report.migrationDifficulty}`,
    ].join('\n'),
  );

  if (report.cleanArchitectureGaps.length > 0) {
    p.log.warn('Clean Architecture gaps:');
    for (const gap of report.cleanArchitectureGaps) {
      p.log.warn(`  - ${gap}`);
    }
  }

  if (report.recommendations.length > 0) {
    p.log.info('Recommendations:');
    for (const rec of report.recommendations) {
      p.log.info(`  -> ${rec}`);
    }
  }
}

async function applyMigration(projectPath: string, report: AnalysisReport): Promise<void> {
  const spinner = createSpinner('Applying migration...');
  spinner.start();

  const moduleConfig = buildModuleConfig(report);
  const orgId = await detectOrgId(projectPath, report.projectName);

  const config = parseConfig({
    project: {
      name: report.projectName,
      orgId,
    },
    modules: moduleConfig,
    claude: {
      enabled: true,
      agentTeams: true,
    },
    scaffold: {
      dryRun: false,
    },
  });

  const context = createProjectContext(config, projectPath);

  // Write maxsim.config.yaml (non-destructive)
  const configPath = path.join(projectPath, 'maxsim.config.yaml');
  if (!(await fs.pathExists(configPath))) {
    const configYaml = yamlDump(config, { indent: 2, lineWidth: 120 });
    await fs.writeFile(configPath, configYaml, 'utf-8');
    p.log.success('Created maxsim.config.yaml');
  } else {
    p.log.warn('maxsim.config.yaml already exists — skipping');
  }

  // Run Claude setup only if CLAUDE.md does not exist (non-destructive)
  const claudeMdPath = path.join(projectPath, 'CLAUDE.md');
  if (!(await fs.pathExists(claudeMdPath))) {
    await runClaudeSetup(context, projectPath);
    p.log.success('Created CLAUDE.md and .claude/ directory');
  } else {
    p.log.warn('CLAUDE.md already exists — skipping Claude setup');
  }

  // Write migration prd.json (non-destructive)
  const prdPath = path.join(projectPath, 'prd.json');
  if (!(await fs.pathExists(prdPath))) {
    const prdContent = generateMigrationPrd(report);
    await writeFile(prdPath, prdContent, 'utf-8');
    p.log.success('Created prd.json with migration stories');
  } else {
    p.log.warn('prd.json already exists — skipping');
  }

  spinner.succeed('Migration applied');
}

function buildModuleConfig(report: AnalysisReport): Record<string, unknown> {
  const modules: Record<string, unknown> = {};
  const detected = report.detectedModules;

  if (detected.includes('auth')) {
    const isFirebase = report.rawDependencies.includes('firebase_auth');
    const isSupabase = report.rawDependencies.includes('supabase_flutter');
    modules.auth = {
      enabled: true,
      provider: isFirebase ? 'firebase' : isSupabase ? 'supabase' : 'custom',
    };
  }
  if (detected.includes('api')) {
    modules.api = { enabled: true };
  }
  if (detected.includes('database')) {
    const isDrift = report.rawDependencies.includes('drift');
    const isIsar = report.rawDependencies.some((d) => d.startsWith('isar'));
    modules.database = {
      enabled: true,
      engine: isDrift ? 'drift' : isIsar ? 'isar' : 'hive',
    };
  }
  if (detected.includes('i18n')) {
    modules.i18n = { enabled: true };
  }
  if (detected.includes('theme')) {
    modules.theme = { enabled: true };
  }
  if (detected.includes('push')) {
    const isFcm = report.rawDependencies.includes('firebase_messaging');
    modules.push = {
      enabled: true,
      provider: isFcm ? 'firebase' : 'onesignal',
    };
  }
  if (detected.includes('analytics')) {
    modules.analytics = { enabled: true };
  }
  if (detected.includes('cicd')) {
    modules.cicd = { enabled: true };
  }
  if (detected.includes('deep-linking')) {
    modules['deep-linking'] = { enabled: true };
  }

  return modules;
}

async function detectOrgId(projectPath: string, projectName: string): Promise<string> {
  const gradlePath = path.join(projectPath, 'android', 'app', 'build.gradle');
  try {
    const content = await fs.readFile(gradlePath, 'utf-8');
    const match = /applicationId\s+["']([^"']+)["']/.exec(content);
    if (match?.[1]) return match[1];
  } catch {
    // ignore
  }

  const gradleKtsPath = path.join(projectPath, 'android', 'app', 'build.gradle.kts');
  try {
    const content = await fs.readFile(gradleKtsPath, 'utf-8');
    const match = /applicationId\s*=\s*["']([^"']+)["']/.exec(content);
    if (match?.[1]) return match[1];
  } catch {
    // ignore
  }

  return `com.example.${projectName}`;
}

interface MigrationStory {
  id: string;
  phase: 1 | 2 | 3;
  priority: 'P0' | 'P1' | 'P2' | 'P3';
  title: string;
  description: string;
  acceptanceCriteria: string[];
  passes: false;
}

function generateMigrationPrd(report: AnalysisReport): string {
  const rawStories = buildMigrationStories(report);
  const stories: MigrationStory[] = rawStories.map((s, i) => ({
    ...s,
    id: `M-${String(i + 1).padStart(3, '0')}`,
  }));

  const prd = {
    version: '1.0.0',
    project: report.projectName,
    type: 'migration',
    stories,
  };

  return JSON.stringify(prd, null, 2) + '\n';
}

function buildMigrationStories(
  report: AnalysisReport,
): Omit<MigrationStory, 'id'>[] {
  const stories: Omit<MigrationStory, 'id'>[] = [];

  stories.push({
    phase: 1,
    priority: 'P0',
    title: 'Review maxsim.config.yaml and verify project compiles',
    description: `Review the generated maxsim.config.yaml for ${report.projectName}. Verify detected modules match the actual project. Confirm the project compiles and existing tests pass.`,
    acceptanceCriteria: [
      'maxsim.config.yaml is reviewed and accurate',
      'flutter analyze reports zero errors',
      'flutter test passes all existing tests',
    ],
    passes: false,
  });

  if (report.stateManagement !== 'riverpod') {
    const from =
      report.stateManagement === 'unknown' ? 'current state management' : report.stateManagement;
    stories.push({
      phase: 1,
      priority: 'P0',
      title: `Migrate state management from ${from} to Riverpod`,
      description: `Add flutter_riverpod to pubspec.yaml. Wrap the app in ProviderScope in main.dart. Incrementally migrate ${from} state to Riverpod providers, starting with core providers and working outward to features.`,
      acceptanceCriteria: [
        'flutter_riverpod is added to pubspec.yaml',
        'App is wrapped in ProviderScope in main.dart',
        'Core app state is managed via Riverpod providers',
        'flutter analyze reports zero errors',
        'flutter test passes all tests',
      ],
      passes: false,
    });
  }

  if (report.routing !== 'go_router') {
    const from =
      report.routing === 'navigator' ? 'Flutter Navigator' : report.routing;
    stories.push({
      phase: 1,
      priority: 'P0',
      title: `Migrate routing from ${from} to go_router`,
      description: `Add go_router to pubspec.yaml. Create lib/core/router/app_router.dart with GoRouter configuration. Migrate existing routes to GoRoute definitions with TypedGoRoute annotations. Expose the router as a Riverpod provider. Run build_runner to generate route helpers.`,
      acceptanceCriteria: [
        'go_router is added to pubspec.yaml',
        'lib/core/router/app_router.dart exists with GoRouter configuration',
        'All existing routes are migrated to GoRoute definitions',
        'Router is exposed as a Riverpod provider (routerProvider)',
        'app_router.g.dart is generated by build_runner',
        'flutter analyze reports zero errors',
      ],
      passes: false,
    });
  }

  if (report.architecture !== 'clean') {
    stories.push({
      phase: 2,
      priority: 'P0',
      title: 'Refactor to Clean Architecture',
      description: `Reorganize lib/ into lib/features/<name>/ with domain, data, and presentation layers. Move entities and repository interfaces to domain/. Move models and data sources to data/. Move UI components and Riverpod providers to presentation/. Keep lib/core/ for shared router, theme, and providers.`,
      acceptanceCriteria: [
        'lib/features/ directory exists with feature-based organization',
        'Each feature has domain/, data/, and presentation/ subdirectories',
        'Domain layer imports no external packages',
        'Data layer implements domain repository interfaces',
        'Presentation layer accesses data only through Riverpod providers',
        'flutter analyze reports zero errors',
      ],
      passes: false,
    });
  }

  if (report.cleanArchitectureGaps.length > 0) {
    stories.push({
      phase: 2,
      priority: 'P1',
      title: `Fix ${report.cleanArchitectureGaps.length} Clean Architecture layer gap(s)`,
      description: `Address identified Clean Architecture gaps:\n${report.cleanArchitectureGaps.map((g) => `- ${g}`).join('\n')}\n\nFor each missing layer, create it following Clean Architecture conventions.`,
      acceptanceCriteria: [
        ...report.cleanArchitectureGaps.map((g) => `Fixed: ${g}`),
        'All features have domain, data, and presentation layers',
        'flutter analyze reports zero errors',
      ],
      passes: false,
    });
  }

  stories.push({
    phase: 3,
    priority: 'P1',
    title: 'Update and expand test suite for migrated code',
    description: `Write unit and integration tests for migrated code. Ensure all Riverpod providers have unit tests. Ensure core routes can be navigated. Aim for >70% test coverage on the domain layer.`,
    acceptanceCriteria: [
      'flutter test passes all tests',
      'Unit tests exist for all public Riverpod providers',
      'Route navigation tests exist for core routes',
      'flutter analyze reports zero errors',
    ],
    passes: false,
  });

  stories.push({
    phase: 3,
    priority: 'P2',
    title: 'Final migration quality audit',
    description: `Perform a final quality review of the migrated project. Fix remaining analyzer warnings. Update README.md to document the Clean Architecture structure and maxsim tooling.`,
    acceptanceCriteria: [
      'flutter analyze reports zero errors AND zero warnings',
      'flutter test passes all tests',
      'dart format --set-exit-if-changed . passes',
      'README.md documents the project structure and how to run the app',
      'All Riverpod providers follow naming conventions (xxxProvider suffix)',
    ],
    passes: false,
  });

  return stories;
}
