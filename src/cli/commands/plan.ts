import { Command } from 'commander';
import { join } from 'node:path';
import * as p from '@clack/prompts';
import { runPlan } from '../../plan/plan-orchestrator.js';
import { isValidSnakeCase } from '../../plan/types.js';

export function createPlanCommand(): Command {
  const cmd = new Command('plan');

  cmd
    .description('Bootstrap a planning workspace for a new Flutter app with AI-guided setup')
    .argument('[app-name]', 'Name of the Flutter application (snake_case)')
    .option('--description <text>', 'Short description of your app (1-2 sentences)')
    .action(async (appName: string | undefined, options: Record<string, unknown>) => {
      try {
        await runPlanCommand(appName, options);
      } catch (err) {
        p.log.error(err instanceof Error ? err.message : String(err));
        process.exit(1);
      }
    });

  return cmd;
}

async function runPlanCommand(
  appName: string | undefined,
  options: Record<string, unknown>,
): Promise<void> {
  p.intro('maxsim-flutter — Bootstrap a planning workspace');

  // Prompt for project name if not provided
  let name = appName;
  if (!name) {
    const nameResult = await p.text({
      message: 'What is your project name? (snake_case)',
      placeholder: 'my_flutter_app',
      validate: (value) => {
        if (!isValidSnakeCase(value)) {
          return 'Project name must be snake_case (lowercase letters, digits, and underscores only)';
        }
        return undefined;
      },
    });

    if (p.isCancel(nameResult)) {
      p.cancel('Planning cancelled.');
      process.exit(0);
    }
    name = nameResult;
  } else if (!isValidSnakeCase(name)) {
    p.log.error(`Invalid project name "${name}". Must be snake_case (e.g., my_app).`);
    process.exit(1);
  }

  // Prompt for description if not provided
  let description = options.description as string | undefined;
  if (!description) {
    const descResult = await p.text({
      message: 'Briefly describe your app (1-2 sentences):',
      placeholder: 'A productivity app that helps teams collaborate on daily tasks.',
      validate: (value) => {
        if (!value.trim()) return 'Description cannot be empty';
        return undefined;
      },
    });

    if (p.isCancel(descResult)) {
      p.cancel('Planning cancelled.');
      process.exit(0);
    }
    description = descResult;
  }

  const outputDir = join(process.cwd(), name);

  p.log.info(`Creating planning workspace in ./${name}/`);

  const result = await runPlan({ name, description, outputDir });

  p.log.success(`Created ${result.filesCreated.length} files`);

  p.outro(
    `Planning workspace ready! Next steps:\n\n` +
    `  1. cd ${name}\n` +
    `  2. Fill in docs/project-brief-template.md\n` +
    `  3. Open Claude Code: claude\n` +
    `  4. Run the planning skill: /plan-app\n`,
  );
}
