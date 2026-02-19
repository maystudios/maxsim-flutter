import { Command } from 'commander';
import { join } from 'node:path';
import * as p from '@clack/prompts';
import { dump as yamlDump } from 'js-yaml';
import fsExtra from 'fs-extra';
import { loadConfig, parseConfig } from '../../core/config/loader.js';
import { createProjectContext } from '../../core/context.js';
import { validateEnvironment } from '../../core/validator.js';
import { ScaffoldEngine } from '../../scaffold/engine.js';
import { createSpinner } from '../ui/spinner.js';
import { promptForProjectCreation } from '../ui/prompts.js';
import type { MaxsimConfig } from '../../types/config.js';

const { writeFile, ensureDir } = fsExtra;

export function createCreateCommand(): Command {
  const cmd = new Command('create');

  cmd
    .description('Create a new Flutter app with Clean Architecture, Riverpod, and AI tooling')
    .argument('[app-name]', 'Name of the Flutter application')
    .option('--org <id>', 'Organization identifier (e.g., com.example)')
    .option('--modules <list>', 'Comma-separated list of modules: auth,api,theme,...')
    .option('--platforms <list>', 'Comma-separated platforms: ios,android,web,macos,windows,linux')
    .option('--auth-provider <provider>', 'Auth provider: firebase|supabase|custom')
    .option('--no-claude', 'Skip .claude/ setup generation')
    .option('--dry-run', 'Preview generated files without writing')
    .option('--config <file>', 'Path to preset config file (maxsim.config.yaml)')
    .option('--yes', 'Accept all defaults without prompting')
    .action(async (appName: string | undefined, options: Record<string, unknown>) => {
      try {
        await runCreate(appName, options);
      } catch (err) {
        p.log.error(err instanceof Error ? err.message : String(err));
        process.exit(1);
      }
    });

  return cmd;
}

/**
 * Build module configuration from a comma-separated list of module IDs.
 * Uses Zod schema defaults for all module-specific settings.
 */
function buildModulesConfig(
  modulesList: string[],
  options: Record<string, unknown>,
): Record<string, unknown> {
  const modules: Record<string, unknown> = {};

  for (const mod of modulesList) {
    const id = mod.trim();
    switch (id) {
      case 'auth':
        modules.auth = {
          enabled: true,
          provider: (options.authProvider as string) ?? undefined,
        };
        break;
      case 'api':
        modules.api = { enabled: true };
        break;
      case 'theme':
        modules.theme = { enabled: true };
        break;
      case 'database':
        modules.database = { enabled: true };
        break;
      case 'i18n':
        modules.i18n = { enabled: true };
        break;
      case 'push':
        modules.push = { enabled: true };
        break;
      case 'analytics':
        modules.analytics = { enabled: true };
        break;
      case 'cicd':
        modules.cicd = { enabled: true };
        break;
      case 'deep-linking':
        modules['deep-linking'] = { enabled: true };
        break;
    }
  }

  return modules;
}

async function runCreate(
  appName: string | undefined,
  options: Record<string, unknown>,
): Promise<void> {
  p.intro('maxsim-flutter — Create a new Flutter app');

  let config: MaxsimConfig;

  if (options.config) {
    // Load from config file
    config = await loadConfig(options.config as string);
    p.log.info(`Loaded config from ${options.config as string}`);
  } else if (options.yes) {
    // Non-interactive: use defaults
    const name = appName ?? 'my_app';
    const modulesList = options.modules
      ? (options.modules as string).split(',')
      : [];
    const modules = buildModulesConfig(modulesList, options);

    config = parseConfig({
      project: {
        name,
        orgId: (options.org as string) ?? 'com.example',
      },
      platforms: options.platforms
        ? (options.platforms as string).split(',')
        : undefined,
      modules,
      scaffold: {
        dryRun: options.dryRun === true,
      },
    });
  } else {
    // Interactive prompts
    const answers = await promptForProjectCreation({
      projectName: appName,
    });

    const modules = buildModulesConfig(answers.modules, options);

    config = parseConfig({
      project: {
        name: answers.projectName,
        orgId: answers.orgId,
        description: answers.description,
      },
      platforms: answers.platforms,
      modules,
      scaffold: {
        dryRun: options.dryRun === true,
      },
    });
  }

  const outputDir = join(process.cwd(), config.project.name);
  const context = createProjectContext(config, outputDir);

  // Validate environment (non-blocking)
  const validation = await validateEnvironment();
  if (!validation.valid) {
    p.log.warn('Some tools may be missing: ' + validation.errors.join(', '));
    p.log.info('Continuing with scaffold (post-processors may be skipped)');
  }

  const spinner = createSpinner('Generating Flutter project...');
  spinner.start();

  const engine = new ScaffoldEngine();
  const result = await engine.run(context);

  spinner.succeed(`Generated ${result.filesWritten.length} files`);

  // Write maxsim.config.yaml to output directory
  if (!context.scaffold.dryRun) {
    await ensureDir(outputDir);
    const configYaml = yamlDump(config, { indent: 2, lineWidth: 120 });
    await writeFile(join(outputDir, 'maxsim.config.yaml'), configYaml, 'utf-8');
    p.log.success('Wrote maxsim.config.yaml');
  }

  if (result.filesSkipped.length > 0) {
    p.log.warn(`Skipped ${result.filesSkipped.length} existing files`);
  }

  if (result.postProcessorsRun.length > 0) {
    p.log.info(`Ran: ${result.postProcessorsRun.join(', ')}`);
  }

  p.outro(`Project created! Run:\n  cd ${config.project.name}\n  flutter run`);
}
