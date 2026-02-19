import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { readFile, writeFile, readdir, stat } from 'node:fs/promises';
import { Command } from 'commander';
import * as p from '@clack/prompts';
import { load as yamlLoad, dump as yamlDump } from 'js-yaml';
import fsExtra from 'fs-extra';

import { loadConfig, parseConfig } from '../../core/config/loader.js';
import { createProjectContext } from '../../core/context.js';
import { ModuleRegistry } from '../../modules/registry.js';
import { ModuleResolver } from '../../modules/resolver.js';
import { pickNewerVersion } from '../../modules/composer.js';
import { TemplateRenderer } from '../../scaffold/renderer.js';
import { FileWriter } from '../../scaffold/file-writer.js';
import { runClaudeSetup } from '../../claude-setup/index.js';
import {
  buildTemplateContext,
  collectAndRenderTemplates,
  processPubspecPartial,
} from '../../scaffold/template-helpers.js';
import { createSpinner } from '../ui/spinner.js';
import type { MaxsimConfig } from '../../types/config.js';
import type { ModuleManifest } from '../../types/module.js';
import type { GeneratedFile } from '../../types/project.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const { pathExists } = fsExtra;

/** All module IDs that can be added via this command. */
const ADDABLE_MODULE_IDS = [
  'auth',
  'api',
  'theme',
  'database',
  'i18n',
  'push',
  'analytics',
  'cicd',
  'deep-linking',
] as const;

const MODULE_LABELS: Record<string, string> = {
  auth: 'Authentication',
  api: 'API Client',
  theme: 'Theme',
  database: 'Database',
  i18n: 'Internationalization',
  push: 'Push Notifications',
  analytics: 'Analytics',
  cicd: 'CI/CD',
  'deep-linking': 'Deep Linking',
};

export function createAddCommand(): Command {
  const cmd = new Command('add');

  cmd
    .description('Add a module to an existing maxsim-flutter project')
    .argument('[module]', 'Module to add: auth|api|theme|database|i18n|push|analytics|cicd|deep-linking')
    .option('--project-dir <path>', 'Path to the project directory (default: current directory)')
    .option('--dry-run', 'Preview changes without writing files')
    .action(async (moduleArg: string | undefined, options: Record<string, unknown>) => {
      try {
        await runAdd(moduleArg, options);
      } catch (err) {
        p.log.error(err instanceof Error ? err.message : String(err));
        process.exit(1);
      }
    });

  return cmd;
}

async function runAdd(
  moduleArg: string | undefined,
  options: Record<string, unknown>,
): Promise<void> {
  const dryRun = options.dryRun === true;

  p.intro(`maxsim-flutter — Add a module${dryRun ? ' (dry run)' : ''}`);

  // 1. Detect project root
  const searchDir = options.projectDir
    ? String(options.projectDir)
    : process.cwd();

  const projectRoot = await findProjectRoot(searchDir);
  if (!projectRoot) {
    throw new Error(
      `No maxsim.config.yaml found in ${searchDir} or its parent directories.\n` +
        'Run this command from inside a maxsim-flutter project, or use --project-dir.',
    );
  }

  const configPath = join(projectRoot, 'maxsim.config.yaml');
  p.log.info(`Found project at: ${projectRoot}`);

  // 2. Load existing config
  const config = await loadConfig(configPath);
  const enabledIds = getEnabledModuleIds(config);

  // 3. Load module registry to get manifests and optional modules list
  const registry = new ModuleRegistry();
  await registry.loadAll();

  // 4. Determine target module(s) — from arg or interactive prompt
  let selectedId: string;

  if (moduleArg) {
    selectedId = moduleArg.trim();
    if (!ADDABLE_MODULE_IDS.includes(selectedId as (typeof ADDABLE_MODULE_IDS)[number])) {
      throw new Error(
        `Unknown module '${selectedId}'. Valid modules: ${ADDABLE_MODULE_IDS.join(', ')}`,
      );
    }
    if (enabledIds.has(selectedId)) {
      throw new Error(
        `Module '${selectedId}' is already enabled in this project.`,
      );
    }
  } else {
    const available = ADDABLE_MODULE_IDS.filter((id) => !enabledIds.has(id));
    if (available.length === 0) {
      throw new Error('All available modules are already enabled in this project.');
    }

    const selected = await p.select({
      message: 'Which module would you like to add?',
      options: available.map((id) => ({
        value: id,
        label: MODULE_LABELS[id] ?? id,
      })),
    });

    if (p.isCancel(selected)) {
      p.cancel('Add cancelled.');
      process.exit(0);
    }

    selectedId = selected as string;
  }

  // 5. Load the manifest for the selected module
  let manifest: ModuleManifest | undefined;
  if (registry.has(selectedId)) {
    manifest = registry.get(selectedId);
  }

  // 6. Ask module-specific questions
  const moduleAnswers: Record<string, string | boolean> = {};

  if (manifest?.questions && manifest.questions.length > 0) {
    for (const question of manifest.questions) {
      let answer: string | boolean | symbol;

      if (question.type === 'text') {
        answer = await p.text({
          message: question.message,
          initialValue: typeof question.defaultValue === 'string' ? question.defaultValue : '',
          placeholder: typeof question.defaultValue === 'string' ? question.defaultValue : '',
        });
      } else if (question.type === 'select' && question.options) {
        answer = await p.select({
          message: question.message,
          options: question.options.map((o) => ({ value: o.value, label: o.label })),
          initialValue: typeof question.defaultValue === 'string' ? question.defaultValue : undefined,
        });
      } else if (question.type === 'confirm') {
        answer = await p.confirm({
          message: question.message,
          initialValue: typeof question.defaultValue === 'boolean' ? question.defaultValue : true,
        });
      } else {
        continue;
      }

      if (p.isCancel(answer)) {
        p.cancel('Add cancelled.');
        process.exit(0);
      }

      moduleAnswers[question.id] = answer as string | boolean;
    }
  }

  // 7. Resolve dependencies (auto-add required modules)
  let resolvedModuleIds: string[] = [selectedId];
  let autoDependencies: string[] = [];

  if (registry.has(selectedId)) {
    try {
      const resolver = new ModuleResolver(registry);
      const resolved = resolver.resolve([selectedId, ...Array.from(enabledIds)]);
      const allNewIds = resolved.ordered
        .map((m) => m.id)
        .filter((id) => !enabledIds.has(id) && id !== selectedId && !m_alwaysIncluded(resolved.ordered, id));
      autoDependencies = allNewIds;
      resolvedModuleIds = [selectedId, ...allNewIds];
    } catch {
      // If registry doesn't have all modules, just proceed with the selected module
    }
  }

  if (autoDependencies.length > 0) {
    p.log.info(`Auto-adding required dependencies: ${autoDependencies.join(', ')}`);
  }

  // 8. Build updated raw config
  const rawConfigText = await readFile(configPath, 'utf-8');
  const rawConfig = yamlLoad(rawConfigText) as Record<string, unknown>;

  const rawModules = (rawConfig['modules'] ?? {}) as Record<string, unknown>;

  // Add the primary module with question answers
  rawModules[selectedId] = { enabled: true, ...moduleAnswers };

  // Add any auto-dependencies with defaults
  for (const depId of autoDependencies) {
    if (!enabledIds.has(depId)) {
      rawModules[depId] = { enabled: true };
    }
  }

  rawConfig['modules'] = rawModules;

  // Re-parse to validate
  const updatedConfig = parseConfig(rawConfig);
  const updatedContext = createProjectContext(updatedConfig, projectRoot);

  // 9. Show preview in dry-run mode
  if (dryRun) {
    p.log.info('Dry run — no files will be written.');
    p.log.info(`Module to add: ${selectedId}`);
    if (autoDependencies.length > 0) {
      p.log.info(`Auto-added dependencies: ${autoDependencies.join(', ')}`);
    }

    const modulesTemplatesDir = getModulesTemplatesDir();
    for (const id of resolvedModuleIds) {
      const moduleTemplateDir = join(modulesTemplatesDir, id);
      if (await pathExists(moduleTemplateDir)) {
        const files = await listTemplateFiles(moduleTemplateDir);
        p.log.info(`Files that would be generated for '${id}': ${files.length} file(s)`);
        for (const f of files) {
          p.log.step(`  + ${f.replace(/\.hbs$/, '')}`);
        }
      }
    }

    p.log.info('pubspec.yaml would be updated with new dependencies');
    p.log.info('maxsim.config.yaml would be updated');
    p.log.info('CLAUDE.md would be regenerated');

    p.outro('Dry run complete — no changes made.');
    return;
  }

  // 10. Generate module template files
  const spinner = createSpinner(`Adding module '${selectedId}'...`);
  spinner.start();

  const renderer = new TemplateRenderer();
  const templateContext = buildTemplateContext(updatedContext);
  const modulesTemplatesDir = getModulesTemplatesDir();

  const generatedFiles: GeneratedFile[] = [];
  const extraDeps = new Map<string, string | Record<string, unknown>>();
  const extraDevDeps = new Map<string, string | Record<string, unknown>>();
  const extraFlutter: Record<string, unknown> = {};

  for (const id of resolvedModuleIds) {
    const moduleTemplateDir = join(modulesTemplatesDir, id);
    if (!(await pathExists(moduleTemplateDir))) continue;

    // Render module templates (exclude pubspec.partial.yaml)
    const moduleFiles = await collectAndRenderTemplates(
      moduleTemplateDir,
      templateContext,
      renderer,
      ['pubspec.partial.yaml'],
    );
    generatedFiles.push(...moduleFiles);

    // Process pubspec.partial.yaml
    const partialPath = join(moduleTemplateDir, 'pubspec.partial.yaml');
    const partial = await processPubspecPartial(partialPath, renderer, templateContext);
    for (const [name, version] of partial.deps) {
      if (typeof version === 'object') {
        extraDeps.set(name, version);
      } else {
        const existing = extraDeps.get(name);
        extraDeps.set(
          name,
          existing !== undefined && typeof existing === 'string'
            ? pickNewerVersion(existing, version)
            : version,
        );
      }
    }
    for (const [name, version] of partial.devDeps) {
      if (typeof version === 'object') {
        extraDevDeps.set(name, version);
      } else {
        const existing = extraDevDeps.get(name);
        extraDevDeps.set(
          name,
          existing !== undefined && typeof existing === 'string'
            ? pickNewerVersion(existing, version)
            : version,
        );
      }
    }
    Object.assign(extraFlutter, partial.flutter);
  }

  // 11. Write module files
  const writer = new FileWriter({
    outputDir: projectRoot,
    dryRun: false,
    overwriteMode: 'never', // don't overwrite existing files for add command
  });

  const fileMap = new Map(generatedFiles.map((f) => [f.relativePath, f.content]));
  const writeResult = await writer.writeAll(fileMap);

  // 12. Merge pubspec.yaml
  if (extraDeps.size > 0 || extraDevDeps.size > 0 || Object.keys(extraFlutter).length > 0) {
    await mergePubspecYaml(projectRoot, extraDeps, extraDevDeps, extraFlutter);
  }

  // 13. Update maxsim.config.yaml
  const updatedYaml = yamlDump(updatedConfig, { indent: 2, lineWidth: 120 });
  await writeFile(configPath, updatedYaml, 'utf-8');

  // 14. Regenerate Claude setup if enabled
  if (updatedContext.claude.enabled) {
    await runClaudeSetup(updatedContext, projectRoot);
  }

  spinner.succeed(`Added module '${selectedId}'`);

  if (writeResult.written.length > 0) {
    p.log.success(`Generated ${writeResult.written.length} file(s)`);
  }
  if (writeResult.skipped.length > 0) {
    p.log.warn(`Skipped ${writeResult.skipped.length} existing file(s)`);
  }
  if (extraDeps.size > 0) {
    p.log.success(`Updated pubspec.yaml with ${extraDeps.size + extraDevDeps.size} dependency(ies)`);
  }

  p.log.info('Run `flutter pub get` to install new dependencies.');
  p.outro(`Module '${selectedId}' added successfully!`);
}

/**
 * Search for maxsim.config.yaml starting from startDir, checking up to 5 parent levels.
 */
export async function findProjectRoot(startDir: string): Promise<string | null> {
  let current = startDir;
  for (let i = 0; i < 5; i++) {
    const candidate = join(current, 'maxsim.config.yaml');
    if (await pathExists(candidate)) {
      return current;
    }
    const parent = dirname(current);
    if (parent === current) break; // reached filesystem root
    current = parent;
  }
  return null;
}

/**
 * Derive the set of enabled module IDs from a parsed MaxsimConfig.
 */
export function getEnabledModuleIds(config: MaxsimConfig): Set<string> {
  const enabled = new Set<string>();
  const m = config.modules;

  if (m.auth !== undefined && m.auth !== false && m.auth.enabled !== false) {
    enabled.add('auth');
  }
  if (m.api !== undefined && m.api !== false && m.api.enabled !== false) {
    enabled.add('api');
  }
  if (m.database !== undefined && m.database !== false && m.database.enabled !== false) {
    enabled.add('database');
  }
  if (m.i18n !== undefined && m.i18n !== false && m.i18n.enabled !== false) {
    enabled.add('i18n');
  }
  if (m.theme !== undefined && m.theme !== false && m.theme.enabled !== false) {
    enabled.add('theme');
  }
  if (m.push !== undefined && m.push !== false && m.push.enabled !== false) {
    enabled.add('push');
  }
  if (m.analytics !== undefined && m.analytics !== false && m.analytics.enabled !== false) {
    enabled.add('analytics');
  }
  if (m.cicd !== undefined && m.cicd !== false && m.cicd.enabled !== false) {
    enabled.add('cicd');
  }
  const dl = m['deep-linking'];
  if (dl !== undefined && dl !== false && dl.enabled !== false) {
    enabled.add('deep-linking');
  }

  return enabled;
}

/**
 * List template files in a directory (for dry-run preview).
 */
async function listTemplateFiles(baseDir: string): Promise<string[]> {
  const exists = await pathExists(baseDir);
  if (!exists) return [];

  const entries = await readdir(baseDir, { recursive: true });
  const files: string[] = [];

  for (const entry of entries) {
    const entryStr = String(entry);
    const absolutePath = join(baseDir, entryStr);
    const fileStat = await stat(absolutePath);
    if (!fileStat.isDirectory()) {
      files.push(entryStr);
    }
  }

  return files;
}

/**
 * Merge additional dependencies into the project's existing pubspec.yaml.
 */
export async function mergePubspecYaml(
  projectDir: string,
  extraDeps: Map<string, string | Record<string, unknown>>,
  extraDevDeps: Map<string, string | Record<string, unknown>>,
  extraFlutter: Record<string, unknown> = {},
): Promise<void> {
  const pubspecPath = join(projectDir, 'pubspec.yaml');
  if (!(await pathExists(pubspecPath))) return;

  const content = await readFile(pubspecPath, 'utf-8');
  const pubspec = yamlLoad(content) as Record<string, unknown>;

  const deps = (pubspec['dependencies'] ?? {}) as Record<string, unknown>;
  for (const [name, version] of extraDeps) {
    if (typeof version === 'object') {
      deps[name] = version;
    } else if (typeof deps[name] === 'string') {
      deps[name] = pickNewerVersion(deps[name] as string, version);
    } else if (deps[name] === undefined) {
      deps[name] = version;
    }
  }
  pubspec['dependencies'] = deps;

  const devDeps = (pubspec['dev_dependencies'] ?? {}) as Record<string, unknown>;
  for (const [name, version] of extraDevDeps) {
    if (typeof version === 'object') {
      devDeps[name] = version;
    } else if (typeof devDeps[name] === 'string') {
      devDeps[name] = pickNewerVersion(devDeps[name] as string, version);
    } else if (devDeps[name] === undefined) {
      devDeps[name] = version;
    }
  }
  pubspec['dev_dependencies'] = devDeps;

  if (Object.keys(extraFlutter).length > 0) {
    const flutterSection = (pubspec['flutter'] ?? {}) as Record<string, unknown>;
    Object.assign(flutterSection, extraFlutter);
    pubspec['flutter'] = flutterSection;
  }

  await writeFile(pubspecPath, yamlDump(pubspec, { indent: 2, lineWidth: 120, noRefs: true }), 'utf-8');
}

/**
 * Resolve the modules templates directory relative to this file.
 * In dist: dist/cli/commands/add.js → dist/../../templates/modules → templates/modules
 */
function getModulesTemplatesDir(): string {
  return join(__dirname, '../../../templates/modules');
}

/**
 * Helper to check if a module ID is in the always-included set.
 */
function m_alwaysIncluded(ordered: readonly ModuleManifest[], id: string): boolean {
  return ordered.some((m) => m.id === id && m.alwaysIncluded === true);
}
