import { access } from 'node:fs/promises';
import { join } from 'node:path';
import { makeTestContext } from '../helpers/context-factory.js';
import { useTempDir } from '../helpers/temp-dir.js';
import { runClaudeSetup } from '../../src/claude-setup/setup-orchestrator.js';

async function exists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

describe('runClaudeSetup (v2 — preset-gated output)', () => {
  const tmp = useTempDir('setup-orchestrator-v2-');

  it('minimal preset generates CLAUDE.md and rules but not agents, hooks, skills, commands, or mcp', async () => {
    const context = makeTestContext({
      claude: { enabled: true, preset: 'minimal', agentTeams: false },
    });

    await runClaudeSetup(context, tmp.path);

    expect(await exists(join(tmp.path, 'CLAUDE.md'))).toBe(true);
    expect(await exists(join(tmp.path, '.claude', 'rules', 'architecture.md'))).toBe(true);
    expect(await exists(join(tmp.path, '.claude', 'agents', 'flutter-builder.md'))).toBe(false);
    expect(await exists(join(tmp.path, '.claude', 'settings.local.json'))).toBe(false);
    expect(await exists(join(tmp.path, '.claude', 'skills', 'flutter-patterns', 'SKILL.md'))).toBe(false);
    expect(await exists(join(tmp.path, '.claude', 'commands', 'add-feature.md'))).toBe(false);
    expect(await exists(join(tmp.path, '.mcp.json'))).toBe(false);
  });

  it('standard preset generates CLAUDE.md, rules, agents, hooks, skills, and commands but not mcp', async () => {
    const context = makeTestContext({
      claude: { enabled: true, preset: 'standard', agentTeams: false },
    });

    await runClaudeSetup(context, tmp.path);

    expect(await exists(join(tmp.path, 'CLAUDE.md'))).toBe(true);
    expect(await exists(join(tmp.path, '.claude', 'rules', 'architecture.md'))).toBe(true);
    expect(await exists(join(tmp.path, '.claude', 'agents', 'flutter-builder.md'))).toBe(true);
    expect(await exists(join(tmp.path, '.claude', 'hooks', 'block-dangerous.sh'))).toBe(true);
    expect(await exists(join(tmp.path, '.claude', 'settings.local.json'))).toBe(true);
    expect(await exists(join(tmp.path, '.claude', 'skills', 'flutter-patterns', 'SKILL.md'))).toBe(true);
    expect(await exists(join(tmp.path, '.claude', 'commands', 'add-feature.md'))).toBe(true);
    expect(await exists(join(tmp.path, '.mcp.json'))).toBe(false);
  });

  it('full preset generates everything including mcp config', async () => {
    const context = makeTestContext({
      claude: { enabled: true, preset: 'full', agentTeams: false },
    });

    await runClaudeSetup(context, tmp.path);

    expect(await exists(join(tmp.path, 'CLAUDE.md'))).toBe(true);
    expect(await exists(join(tmp.path, '.claude', 'rules', 'architecture.md'))).toBe(true);
    expect(await exists(join(tmp.path, '.claude', 'agents', 'flutter-builder.md'))).toBe(true);
    expect(await exists(join(tmp.path, '.claude', 'hooks', 'block-dangerous.sh'))).toBe(true);
    expect(await exists(join(tmp.path, '.claude', 'skills', 'flutter-patterns', 'SKILL.md'))).toBe(true);
    expect(await exists(join(tmp.path, '.claude', 'commands', 'add-feature.md'))).toBe(true);
    expect(await exists(join(tmp.path, '.mcp.json'))).toBe(true);
  });

  it('filesWritten includes all generated file paths for standard preset', async () => {
    const context = makeTestContext({
      claude: { enabled: true, preset: 'standard', agentTeams: false },
    });

    const result = await runClaudeSetup(context, tmp.path);

    expect(result.filesWritten).toContain(join(tmp.path, 'CLAUDE.md'));
    expect(result.filesWritten).toContain(join(tmp.path, '.claude', 'rules', 'architecture.md'));
    expect(result.filesWritten).toContain(
      join(tmp.path, '.claude', 'agents', 'flutter-builder.md'),
    );
    expect(result.filesWritten).toContain(
      join(tmp.path, '.claude', 'skills', 'flutter-patterns', 'SKILL.md'),
    );
    expect(result.filesWritten).toContain(join(tmp.path, '.claude', 'commands', 'add-feature.md'));
    expect(result.filesWritten).toContain(join(tmp.path, 'prd.json'));
  });

  it('skipPrd option skips prd.json generation', async () => {
    const context = makeTestContext({
      claude: { enabled: true, preset: 'standard', agentTeams: false },
    });

    const result = await runClaudeSetup(context, tmp.path, { skipPrd: true });

    expect(await exists(join(tmp.path, 'prd.json'))).toBe(false);
    expect(result.filesWritten).not.toContain(join(tmp.path, 'prd.json'));
  });

  it('rules directory is created with core rule files when rules are enabled', async () => {
    const context = makeTestContext({
      claude: { enabled: true, preset: 'minimal', agentTeams: false },
    });

    await runClaudeSetup(context, tmp.path);

    const rulesDir = join(tmp.path, '.claude', 'rules');
    expect(await exists(join(rulesDir, 'architecture.md'))).toBe(true);
    expect(await exists(join(rulesDir, 'riverpod.md'))).toBe(true);
    expect(await exists(join(rulesDir, 'go-router.md'))).toBe(true);
    expect(await exists(join(rulesDir, 'testing.md'))).toBe(true);
    expect(await exists(join(rulesDir, 'security.md'))).toBe(true);
  });
});
