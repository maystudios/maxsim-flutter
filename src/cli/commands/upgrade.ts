import { copyFile, readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { Command } from 'commander';
import * as p from '@clack/prompts';
import { loadConfig } from '../../core/config/loader.js';
import { parseConfig } from '../../core/config/loader.js';
import { createProjectContext } from '../../core/context.js';
import { runClaudeSetup } from '../../claude-setup/setup-orchestrator.js';
import { findProjectRoot } from './add.js';

/**
 * Back up existing agent markdown files in a .claude/agents/ directory.
 * Each *.md file is copied to *.md.bak (overwriting any previous backup).
 * Only .md files are backed up — subdirectories and non-.md files are ignored.
 * If the agents directory does not exist, returns an empty array (no-op).
 *
 * @param agentsDir - Absolute path to the .claude/agents/ directory
 * @returns Absolute paths of the .bak files created
 */
export async function backupAgentFiles(agentsDir: string): Promise<string[]> {
  let entries: string[];
  try {
    entries = await readdir(agentsDir);
  } catch {
    // Directory doesn't exist — nothing to backup
    return [];
  }

  const bakPaths: string[] = [];

  for (const entry of entries) {
    if (!entry.endsWith('.md')) continue;

    const filePath = join(agentsDir, entry);
    const fileStat = await stat(filePath);
    if (!fileStat.isFile()) continue;

    const bakPath = `${filePath}.bak`;
    await copyFile(filePath, bakPath);
    bakPaths.push(bakPath);
  }

  return bakPaths;
}

/**
 * Commander command factory for the upgrade command.
 * Usage: maxsim-flutter upgrade [path] [--yes] [--dry-run] [--regenerate-prd]
 */
export function createUpgradeCommand(): Command {
  const cmd = new Command('upgrade');

  cmd
    .description('Upgrade and refresh the .claude/ directory with latest templates')
    .argument('[path]', 'Path to the project root (default: current directory)')
    .option('--yes', 'Skip confirmation prompt')
    .option('--dry-run', 'Show what would change without writing files')
    .option('--regenerate-prd', 'Also regenerate prd.json (default: preserve existing)')
    .action(async (pathArg: string | undefined, options: Record<string, unknown>) => {
      try {
        await runUpgrade(pathArg, options);
      } catch (err) {
        p.log.error(err instanceof Error ? err.message : String(err));
        process.exit(1);
      }
    });

  return cmd;
}

async function runUpgrade(
  pathArg: string | undefined,
  options: Record<string, unknown>,
): Promise<void> {
  const dryRun = options.dryRun === true;
  const yes = options.yes === true;
  const regeneratePrd = options.regeneratePrd === true;

  p.intro(`maxsim-flutter — Upgrade .claude/ directory${dryRun ? ' (dry run)' : ''}`);

  // 1. Resolve project root
  const searchDir = pathArg ?? process.cwd();
  const projectRoot = await findProjectRoot(searchDir);
  if (!projectRoot) {
    throw new Error(
      `No maxsim.config.yaml found in ${searchDir} or its parent directories.\n` +
        'Run this command from inside a maxsim-flutter project, or pass the path as an argument.',
    );
  }

  const configPath = join(projectRoot, 'maxsim.config.yaml');
  p.log.info(`Found project at: ${projectRoot}`);

  // 2. Load config
  const rawConfig = await loadConfig(configPath);
  const config = parseConfig(rawConfig);
  const context = createProjectContext(config, projectRoot);

  const agentsDir = join(projectRoot, '.claude', 'agents');

  // 3. Dry-run mode — show what would change, write nothing
  if (dryRun) {
    p.log.info('Files that would be regenerated:');
    p.log.step('  CLAUDE.md');
    p.log.step('  .claude/agents/*.md (5 agent files)');
    p.log.step('  .claude/skills/*.md');
    p.log.step('  .claude/settings.local.json');
    p.log.step('  .mcp.json');
    p.log.step('  .claude/commands/*.md');
    if (regeneratePrd) {
      p.log.step('  prd.json');
    }
    p.log.info('Agent files that would be backed up (→ .bak):');
    let bakEntries: string[] = [];
    try {
      const entries = await readdir(agentsDir);
      bakEntries = entries.filter((e) => e.endsWith('.md'));
    } catch {
      // agents dir doesn't exist — nothing to backup
    }
    if (bakEntries.length > 0) {
      for (const e of bakEntries) {
        p.log.step(`  ${e} → ${e}.bak`);
      }
    } else {
      p.log.step('  (no existing agent files found)');
    }
    p.outro('Dry run complete — no changes made.');
    return;
  }

  // 4. Confirm prompt (unless --yes)
  if (!yes) {
    const confirmed = await p.confirm({
      message: 'This will regenerate .claude/ files and back up existing agents. Continue?',
      initialValue: true,
    });
    if (p.isCancel(confirmed) || !confirmed) {
      p.cancel('Upgrade cancelled.');
      process.exit(0);
    }
  }

  // 5. Back up existing agent files BEFORE regenerating
  const backedUp = await backupAgentFiles(agentsDir);
  if (backedUp.length > 0) {
    p.log.info(`Backed up ${backedUp.length} agent file(s) to .bak`);
  }

  // 6. Re-run Claude setup (skipPrd unless --regenerate-prd)
  const result = await runClaudeSetup(context, projectRoot, { skipPrd: !regeneratePrd });

  p.log.success(`Regenerated ${result.filesWritten.length} file(s)`);
  p.outro('Upgrade complete!');
}
