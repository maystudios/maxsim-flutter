#!/usr/bin/env node
import chalk from 'chalk';
import { Command } from 'commander';
import { createCreateCommand } from './commands/create.js';
import { createAddCommand } from './commands/add.js';
import { createMigrateCommand } from './commands/migrate.js';
import { createListCommand } from './commands/list.js';
import { createUpgradeCommand } from './commands/upgrade.js';
import { createPlanCommand } from './commands/plan.js';
import { checkForUpdate } from './version-check.js';

const program = new Command();

program
  .name('maxsim-flutter')
  .version('0.1.0')
  .description('AI-powered Flutter app scaffolding with Clean Architecture, Riverpod, and autonomous development via Ralph')
  .option('--no-update-check', 'Skip the npm update check');

program.addCommand(createCreateCommand());
program.addCommand(createAddCommand());
program.addCommand(createMigrateCommand());
program.addCommand(createListCommand());
program.addCommand(createUpgradeCommand());
program.addCommand(createPlanCommand());

program.parse();

// Non-blocking update nudge (fires after the command completes)
const opts = program.opts<{ updateCheck: boolean }>();
if (opts.updateCheck !== false) {
  checkForUpdate()
    .then((latestVersion) => {
      if (latestVersion) {
        const current = program.version() ?? '0.1.0';
        console.log(
          chalk.yellow(
            `\nUpdate available: ${current} → ${latestVersion}. Run npm install -g maxsim-flutter to update.`,
          ),
        );
      }
    })
    .catch(() => {
      // Silently ignore
    });
}
