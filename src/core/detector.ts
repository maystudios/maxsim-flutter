import { load as yamlLoad } from 'js-yaml';
import fs from 'fs-extra';
import path from 'node:path';

export type StateManagement = 'riverpod' | 'bloc' | 'provider' | 'getx' | 'none' | 'unknown';
export type RoutingPattern = 'go_router' | 'auto_route' | 'navigator' | 'unknown';
export type ArchitecturePattern = 'clean' | 'mvc' | 'mvvm' | 'unknown';
export type MigrationDifficulty = 'simple' | 'moderate' | 'complex';

export interface AnalysisReport {
  projectName: string;
  architecture: ArchitecturePattern;
  stateManagement: StateManagement;
  routing: RoutingPattern;
  detectedModules: string[];
  cleanArchitectureGaps: string[];
  recommendations: string[];
  migrationDifficulty: MigrationDifficulty;
  rawDependencies: string[];
}

interface PubspecYaml {
  name?: string;
  dependencies?: Record<string, unknown>;
  dev_dependencies?: Record<string, unknown>;
}

export class ProjectDetector {
  async analyzeProject(projectPath: string): Promise<AnalysisReport> {
    const pubspec = await this.readPubspec(projectPath);
    const projectName = typeof pubspec.name === 'string' ? pubspec.name : 'unknown';
    const allDeps = this.extractAllDeps(pubspec);

    const stateManagement = this.detectStateManagement(allDeps);
    const routing = this.detectRouting(allDeps);
    const architecture = await this.detectArchitecture(projectPath);
    const detectedModules = await this.detectModules(projectPath, allDeps);
    const cleanArchitectureGaps = await this.findCleanArchitectureGaps(projectPath, architecture);
    const recommendations = this.buildRecommendations(
      stateManagement,
      routing,
      architecture,
      cleanArchitectureGaps,
      detectedModules,
    );
    const migrationDifficulty = this.assessDifficulty(
      architecture,
      stateManagement,
      routing,
      cleanArchitectureGaps,
    );

    return {
      projectName,
      architecture,
      stateManagement,
      routing,
      detectedModules,
      cleanArchitectureGaps,
      recommendations,
      migrationDifficulty,
      rawDependencies: allDeps,
    };
  }

  private async readPubspec(projectPath: string): Promise<PubspecYaml> {
    const pubspecPath = path.join(projectPath, 'pubspec.yaml');
    try {
      const content = await fs.readFile(pubspecPath, 'utf-8');
      const parsed = yamlLoad(content);
      if (typeof parsed !== 'object' || parsed === null) return {};
      return parsed as PubspecYaml;
    } catch {
      return {};
    }
  }

  private extractAllDeps(pubspec: PubspecYaml): string[] {
    const deps = Object.keys(pubspec.dependencies ?? {});
    const devDeps = Object.keys(pubspec.dev_dependencies ?? {});
    return [...new Set([...deps, ...devDeps])];
  }

  private detectStateManagement(deps: string[]): StateManagement {
    if (deps.some((d) => ['flutter_riverpod', 'riverpod', 'hooks_riverpod'].includes(d))) {
      return 'riverpod';
    }
    if (deps.some((d) => ['flutter_bloc', 'bloc'].includes(d))) return 'bloc';
    if (deps.includes('provider')) return 'provider';
    if (deps.includes('get')) return 'getx';
    return 'unknown';
  }

  private detectRouting(deps: string[]): RoutingPattern {
    if (deps.includes('go_router')) return 'go_router';
    if (deps.includes('auto_route')) return 'auto_route';
    return 'navigator';
  }

  private async detectArchitecture(projectPath: string): Promise<ArchitecturePattern> {
    const libPath = path.join(projectPath, 'lib');
    const featuresPath = path.join(libPath, 'features');

    if (await fs.pathExists(featuresPath)) {
      const features = await fs.readdir(featuresPath).catch(() => [] as string[]);
      let cleanCount = 0;
      for (const feature of features.slice(0, 5)) {
        const featurePath = path.join(featuresPath, feature);
        const hasDomain = await fs.pathExists(path.join(featurePath, 'domain'));
        const hasData = await fs.pathExists(path.join(featurePath, 'data'));
        const hasPresentation = await fs.pathExists(path.join(featurePath, 'presentation'));
        if (hasDomain && hasData && hasPresentation) cleanCount++;
      }
      if (features.length > 0 && cleanCount > 0) return 'clean';
    }

    const hasControllers = await fs.pathExists(path.join(libPath, 'controllers'));
    const hasModels = await fs.pathExists(path.join(libPath, 'models'));
    const hasViews = await fs.pathExists(path.join(libPath, 'views'));
    if (hasControllers && (hasModels || hasViews)) return 'mvc';

    const hasViewModels = await fs.pathExists(path.join(libPath, 'viewmodels'));
    if (hasViewModels) return 'mvvm';

    return 'unknown';
  }

  private async detectModules(projectPath: string, deps: string[]): Promise<string[]> {
    const modules: string[] = [];
    const libPath = path.join(projectPath, 'lib');

    if (
      deps.some((d) => ['firebase_auth', 'supabase_flutter'].includes(d)) ||
      (await fs.pathExists(path.join(libPath, 'features', 'auth')))
    ) {
      modules.push('auth');
    }

    if (
      deps.some((d) => ['dio', 'http', 'retrofit'].includes(d)) ||
      (await fs.pathExists(path.join(libPath, 'features', 'api')))
    ) {
      modules.push('api');
    }

    if (
      deps.some((d) =>
        ['drift', 'hive', 'hive_flutter', 'isar', 'isar_flutter_libs'].includes(d),
      ) ||
      (await fs.pathExists(path.join(libPath, 'features', 'database')))
    ) {
      modules.push('database');
    }

    const l10nPath = path.join(libPath, 'l10n');
    const l10nFiles = await fs.readdir(l10nPath).catch(() => [] as string[]);
    if (l10nFiles.some((f) => f.endsWith('.arb')) || deps.includes('intl')) {
      modules.push('i18n');
    }

    if (
      deps.includes('google_fonts') ||
      (await fs.pathExists(path.join(libPath, 'core', 'theme')))
    ) {
      modules.push('theme');
    }

    if (
      deps.some((d) => ['firebase_messaging', 'onesignal_flutter'].includes(d)) ||
      (await fs.pathExists(path.join(libPath, 'features', 'push')))
    ) {
      modules.push('push');
    }

    if (
      deps.some((d) =>
        ['firebase_analytics', 'amplitude_flutter', 'mixpanel_flutter'].includes(d),
      ) ||
      (await fs.pathExists(path.join(libPath, 'features', 'analytics')))
    ) {
      modules.push('analytics');
    }

    const hasGithubActions = await fs.pathExists(
      path.join(projectPath, '.github', 'workflows'),
    );
    const hasGitlabCi = await fs.pathExists(path.join(projectPath, '.gitlab-ci.yml'));
    const hasBitbucket = await fs.pathExists(
      path.join(projectPath, 'bitbucket-pipelines.yml'),
    );
    if (hasGithubActions || hasGitlabCi || hasBitbucket) {
      modules.push('cicd');
    }

    if (
      deps.some((d) => ['app_links', 'uni_links'].includes(d)) ||
      (await fs.pathExists(path.join(libPath, 'features', 'deep-linking')))
    ) {
      modules.push('deep-linking');
    }

    return modules;
  }

  private async findCleanArchitectureGaps(
    projectPath: string,
    architecture: ArchitecturePattern,
  ): Promise<string[]> {
    const gaps: string[] = [];
    const featuresPath = path.join(projectPath, 'lib', 'features');

    if (!(await fs.pathExists(featuresPath))) {
      if (architecture !== 'clean') {
        gaps.push('No lib/features/ directory — project is not organized by feature');
      }
      return gaps;
    }

    const features = await fs.readdir(featuresPath).catch(() => [] as string[]);
    for (const feature of features) {
      const featurePath = path.join(featuresPath, feature);
      const stat = await fs.stat(featurePath).catch(() => null);
      if (!stat?.isDirectory()) continue;

      const hasDomain = await fs.pathExists(path.join(featurePath, 'domain'));
      const hasData = await fs.pathExists(path.join(featurePath, 'data'));
      const hasPresentation = await fs.pathExists(path.join(featurePath, 'presentation'));

      if (!hasDomain) gaps.push(`Feature '${feature}': missing domain layer`);
      if (!hasData) gaps.push(`Feature '${feature}': missing data layer`);
      if (!hasPresentation) gaps.push(`Feature '${feature}': missing presentation layer`);
    }

    return gaps;
  }

  private buildRecommendations(
    stateManagement: StateManagement,
    routing: RoutingPattern,
    architecture: ArchitecturePattern,
    gaps: string[],
    modules: string[],
  ): string[] {
    const recs: string[] = [];

    if (stateManagement !== 'riverpod') {
      const from =
        stateManagement === 'unknown' ? 'current state management' : stateManagement;
      recs.push(`Migrate from ${from} to flutter_riverpod`);
    }
    if (routing !== 'go_router') {
      const from = routing === 'navigator' ? 'Flutter Navigator' : routing;
      recs.push(`Migrate from ${from} to go_router for type-safe declarative routing`);
    }
    if (architecture !== 'clean') {
      recs.push(
        'Organize code into lib/features/ with domain, data, and presentation layers per feature',
      );
    }
    if (gaps.length > 0) {
      recs.push(`Fix ${gaps.length} Clean Architecture layer gap(s) in existing features`);
    }
    if (!modules.includes('theme')) {
      recs.push('Add Material 3 theme module (google_fonts + ColorScheme.fromSeed)');
    }

    return recs;
  }

  private assessDifficulty(
    architecture: ArchitecturePattern,
    stateManagement: StateManagement,
    routing: RoutingPattern,
    gaps: string[],
  ): MigrationDifficulty {
    let score = 0;
    if (architecture !== 'clean') score += 2;
    if (stateManagement !== 'riverpod') score += 2;
    if (routing !== 'go_router') score += 1;
    score += Math.min(gaps.length, 3);

    if (score <= 1) return 'simple';
    if (score <= 4) return 'moderate';
    return 'complex';
  }
}
