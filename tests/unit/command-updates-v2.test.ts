/**
 * Tests for add and upgrade command integrations with the new preset-gated setup flow.
 *
 * The add command calls runClaudeSetup(updatedContext, projectRoot) after adding a module.
 * The upgrade command backs up .claude/rules/ files before regenerating.
 */
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { access } from 'node:fs/promises';
import { makeTestContext } from '../helpers/context-factory.js';
import { useTempDir } from '../helpers/temp-dir.js';
import { runClaudeSetup } from '../../src/claude-setup/setup-orchestrator.js';
import { backupRulesFiles } from '../../src/cli/commands/upgrade.js';

async function exists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

// ── Add command integration: runClaudeSetup reflects newly-added module ────────

describe('add command — runClaudeSetup after adding a module', () => {
  const tmp = useTempDir('add-cmd-claude-v2-');

  it('CLAUDE.md contains @-import for auth rule when auth module is enabled', async () => {
    const context = makeTestContext({
      claude: { enabled: true, preset: 'standard', agentTeams: false },
      modules: {
        ...makeTestContext().modules,
        auth: { provider: 'firebase' },
      },
    });

    await runClaudeSetup(context, tmp.path);

    const claudeMd = await readFile(join(tmp.path, 'CLAUDE.md'), 'utf-8');
    expect(claudeMd).toContain('@.claude/rules/auth.md');
  });

  it('.claude/rules/auth.md is created when auth module is added', async () => {
    const context = makeTestContext({
      claude: { enabled: true, preset: 'standard', agentTeams: false },
      modules: {
        ...makeTestContext().modules,
        auth: { provider: 'firebase' },
      },
    });

    await runClaudeSetup(context, tmp.path);

    expect(await exists(join(tmp.path, '.claude', 'rules', 'auth.md'))).toBe(true);
  });

  it('preset from config is respected — minimal preset skips agents', async () => {
    const context = makeTestContext({
      claude: { enabled: true, preset: 'minimal', agentTeams: false },
    });

    await runClaudeSetup(context, tmp.path);

    expect(await exists(join(tmp.path, '.claude', 'rules', 'architecture.md'))).toBe(true);
    expect(await exists(join(tmp.path, '.claude', 'agents', 'flutter-builder.md'))).toBe(false);
  });
});

// ── Upgrade command: backupRulesFiles ─────────────────────────────────────────

describe('backupRulesFiles', () => {
  const tmp = useTempDir('backup-rules-test-');

  it('returns empty array when rules directory does not exist', async () => {
    const nonexistent = join(tmp.path, '.claude', 'rules');
    const result = await backupRulesFiles(nonexistent);
    expect(result).toEqual([]);
  });

  it('backs up .md files as .bak in the rules directory', async () => {
    const rulesDir = join(tmp.path, '.claude', 'rules');
    await mkdir(rulesDir, { recursive: true });
    await writeFile(join(rulesDir, 'architecture.md'), '# Architecture', 'utf-8');
    await writeFile(join(rulesDir, 'riverpod.md'), '# Riverpod', 'utf-8');

    const result = await backupRulesFiles(rulesDir);

    expect(result).toHaveLength(2);
    expect(result).toContain(join(rulesDir, 'architecture.md.bak'));
    expect(result).toContain(join(rulesDir, 'riverpod.md.bak'));
    expect(await exists(join(rulesDir, 'architecture.md.bak'))).toBe(true);
    expect(await exists(join(rulesDir, 'riverpod.md.bak'))).toBe(true);
  });

  it('preserves the content of backed-up rule files', async () => {
    const rulesDir = join(tmp.path, '.claude', 'rules');
    await mkdir(rulesDir, { recursive: true });
    const originalContent = '# Architecture\n\nSome content here.';
    await writeFile(join(rulesDir, 'architecture.md'), originalContent, 'utf-8');

    await backupRulesFiles(rulesDir);

    const bakContent = await readFile(join(rulesDir, 'architecture.md.bak'), 'utf-8');
    expect(bakContent).toBe(originalContent);
  });

  it('does not back up non-.md files', async () => {
    const rulesDir = join(tmp.path, '.claude', 'rules');
    await mkdir(rulesDir, { recursive: true });
    await writeFile(join(rulesDir, 'architecture.md'), '# Architecture', 'utf-8');
    await writeFile(join(rulesDir, '.gitkeep'), '', 'utf-8');

    const result = await backupRulesFiles(rulesDir);

    expect(result).toHaveLength(1);
    expect(await exists(join(rulesDir, '.gitkeep.bak'))).toBe(false);
  });
});
