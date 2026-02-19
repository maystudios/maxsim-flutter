import { join } from 'node:path';
import { Command } from 'commander';
import * as p from '@clack/prompts';
import chalk from 'chalk';

import { loadConfig } from '../../core/config/loader.js';
import { findProjectRoot, getEnabledModuleIds } from './add.js';
import type { MaxsimConfig } from '../../types/config.js';

/** All optional module IDs in display order. */
const ALL_MODULE_IDS = [
  'auth',
  'api',
  'database',
  'i18n',
  'theme',
  'push',
  'analytics',
  'cicd',
  'deep-linking',
] as const;


export function createListCommand(): Command {
  const cmd = new Command('list');

  cmd
    .description('List all modules and their enabled/disabled status in a maxsim-flutter project')
    .option('--project-dir <path>', 'Path to the project directory (default: current directory)')
    .action(async (options: Record<string, unknown>) => {
      try {
        await runList(options);
      } catch (err) {
        p.log.error(err instanceof Error ? err.message : String(err));
        process.exit(1);
      }
    });

  return cmd;
}

async function runList(options: Record<string, unknown>): Promise<void> {
  const searchDir = options.projectDir ? String(options.projectDir) : process.cwd();

  const projectRoot = await findProjectRoot(searchDir);
  if (!projectRoot) {
    throw new Error(
      `No maxsim.config.yaml found in ${searchDir} or its parent directories.\n` +
        'Run this command from inside a maxsim-flutter project, or use --project-dir.',
    );
  }

  const configPath = join(projectRoot, 'maxsim.config.yaml');
  const config = await loadConfig(configPath);
  const enabledIds = getEnabledModuleIds(config);

  p.intro('maxsim-flutter — Module Status');
  p.log.info(`Project: ${chalk.cyan(projectRoot)}`);

  printModuleTable(config, enabledIds);

  const enabledCount = enabledIds.size;
  const totalCount = ALL_MODULE_IDS.length;
  p.outro(`${enabledCount}/${totalCount} modules enabled`);
}

/**
 * Extract key config details for a module as a human-readable string.
 */
export function getModuleConfigDetails(config: MaxsimConfig, moduleId: string): string {
  const m = config.modules;
  const parts: string[] = [];

  switch (moduleId) {
    case 'auth': {
      const mod = m.auth;
      if (mod) {
        parts.push(`provider: ${mod.provider}`);
      }
      break;
    }
    case 'database': {
      const mod = m.database;
      if (mod) {
        parts.push(`engine: ${mod.engine}`);
      }
      break;
    }
    case 'push': {
      const mod = m.push;
      if (mod) {
        parts.push(`provider: ${mod.provider}`);
      }
      break;
    }
    case 'cicd': {
      const mod = m.cicd;
      if (mod) {
        parts.push(`provider: ${mod.provider}`);
      }
      break;
    }
    case 'i18n': {
      const mod = m.i18n;
      if (mod) {
        parts.push(`locale: ${mod.defaultLocale}`);
      }
      break;
    }
    case 'theme': {
      const mod = m.theme;
      if (mod) {
        if (mod.seedColor) parts.push(`seed: ${mod.seedColor}`);
      }
      break;
    }
    case 'deep-linking': {
      const mod = m['deep-linking'];
      if (mod) {
        if (mod.scheme) parts.push(`scheme: ${mod.scheme}`);
        if (mod.host) parts.push(`host: ${mod.host}`);
      }
      break;
    }
    case 'api': {
      const mod = m.api;
      if (mod) {
        if (mod.baseUrl) parts.push(`baseUrl: ${mod.baseUrl}`);
      }
      break;
    }
    default:
      break;
  }

  return parts.join(', ');
}

/**
 * Print a formatted table of all modules with their status.
 */
export function printModuleTable(config: MaxsimConfig, enabledIds: Set<string>): void {
  const COL_MODULE = 16;
  const COL_STATUS = 12;

  const header =
    chalk.bold('Module'.padEnd(COL_MODULE)) +
    chalk.bold('Status'.padEnd(COL_STATUS)) +
    chalk.bold('Config');

  const separator = chalk.dim('─'.repeat(60));

  console.log('');
  console.log(header);
  console.log(separator);

  for (const id of ALL_MODULE_IDS) {
    const isEnabled = enabledIds.has(id);
    const details = isEnabled ? chalk.dim(getModuleConfigDetails(config, id)) : '';

    const moduleCol = id.padEnd(COL_MODULE);
    const statusCol = (isEnabled ? 'enabled' : 'disabled').padEnd(COL_STATUS);

    console.log(
      `${chalk.white(moduleCol)}${isEnabled ? chalk.green(statusCol) : chalk.dim(statusCol)}${details}`,
    );
  }

  console.log(separator);
  console.log('');
}
