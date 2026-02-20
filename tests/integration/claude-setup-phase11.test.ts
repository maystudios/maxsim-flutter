import { readFile, readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { runClaudeSetup } from '../../src/claude-setup/setup-orchestrator.js';
import { makeTestContext } from '../helpers/context-factory.js';
import { useTempDir } from '../helpers/temp-dir.js';

// ─── Helpers ─────────────────────────────────────────────────────────────

async function setupStandard(tmpPath: string) {
  const ctx = makeTestContext({
    claude: { enabled: true, agentTeams: true, preset: 'standard' },
  });
  await runClaudeSetup(ctx, tmpPath);
  return ctx;
}

async function setupFull(tmpPath: string) {
  const ctx = makeTestContext({
    claude: { enabled: true, agentTeams: true, preset: 'full' },
    modules: {
      auth: { provider: 'firebase' },
      api: { baseUrl: 'https://api.example.com' },
      database: { engine: 'drift' },
      i18n: { defaultLocale: 'en', supportedLocales: ['en', 'de'] },
      theme: false,
      push: false,
      analytics: false,
      cicd: false,
      deepLinking: false,
    },
  });
  await runClaudeSetup(ctx, tmpPath);
  return ctx;
}

async function setupMinimal(tmpPath: string) {
  const ctx = makeTestContext({
    claude: { enabled: true, agentTeams: false, preset: 'minimal' },
  });
  await runClaudeSetup(ctx, tmpPath);
  return ctx;
}

// ─── Agent definitions with Phase 11 frontmatter ────────────────────────

describe('P11-009: agent definitions have Phase 11 frontmatter', () => {
  const tmp = useTempDir('p11-agents-integration-');

  it('generates exactly 4 agent definition files', async () => {
    await setupStandard(tmp.path);
    const agents = await readdir(join(tmp.path, '.claude', 'agents'));
    expect(agents).toHaveLength(4);
    expect(agents.sort()).toEqual([
      'flutter-architect.md',
      'flutter-builder.md',
      'flutter-reviewer.md',
      'flutter-tester.md',
    ]);
  });

  it('flutter-architect.md has model: opus and maxTurns in frontmatter', async () => {
    await setupStandard(tmp.path);
    const content = await readFile(join(tmp.path, '.claude', 'agents', 'flutter-architect.md'), 'utf-8');
    expect(content).toContain('model: opus');
    expect(content).toContain('maxTurns:');
  });

  it('flutter-builder.md has isolation: worktree in frontmatter', async () => {
    await setupStandard(tmp.path);
    const content = await readFile(join(tmp.path, '.claude', 'agents', 'flutter-builder.md'), 'utf-8');
    expect(content).toContain('isolation: worktree');
    expect(content).toContain('model: opus');
  });

  it('flutter-tester.md has isolation: worktree in frontmatter', async () => {
    await setupStandard(tmp.path);
    const content = await readFile(join(tmp.path, '.claude', 'agents', 'flutter-tester.md'), 'utf-8');
    expect(content).toContain('isolation: worktree');
    expect(content).toContain('model: sonnet');
  });

  it('flutter-reviewer.md has memory: user in frontmatter', async () => {
    await setupStandard(tmp.path);
    const content = await readFile(join(tmp.path, '.claude', 'agents', 'flutter-reviewer.md'), 'utf-8');
    expect(content).toContain('memory: user');
    expect(content).toContain('model: haiku');
  });

  it('all agent files contain Model Selection Rationale section', async () => {
    await setupStandard(tmp.path);
    const agentsDir = join(tmp.path, '.claude', 'agents');
    for (const file of ['flutter-architect.md', 'flutter-builder.md', 'flutter-tester.md', 'flutter-reviewer.md']) {
      const content = await readFile(join(agentsDir, file), 'utf-8');
      expect(content).toContain('Model Selection Rationale');
    }
  });
});

// ─── Hook scripts including Phase 11 additions ──────────────────────────

describe('P11-009: all 5 hook scripts generated correctly', () => {
  const tmp = useTempDir('p11-hooks-integration-');

  it('hooks directory contains exactly 5 scripts', async () => {
    await setupStandard(tmp.path);
    const entries = await readdir(join(tmp.path, '.claude', 'hooks'));
    expect(entries.sort()).toEqual([
      'block-dangerous.sh',
      'format-dart.sh',
      'notify-waiting.sh',
      'protect-secrets.sh',
      'quality-gate-task.sh',
    ]);
  });

  it('all hook scripts start with shebang and are executable', async () => {
    await setupStandard(tmp.path);
    const hooksDir = join(tmp.path, '.claude', 'hooks');
    for (const script of ['block-dangerous.sh', 'format-dart.sh', 'protect-secrets.sh', 'notify-waiting.sh', 'quality-gate-task.sh']) {
      const content = await readFile(join(hooksDir, script), 'utf-8');
      expect(content.startsWith('#!/')).toBe(true);
      const fileStat = await stat(join(hooksDir, script));
      expect(fileStat.mode & 0o111).toBeTruthy();
    }
  });

  it('protect-secrets.sh uses JSON deny decision format (not exit 2)', async () => {
    await setupStandard(tmp.path);
    const content = await readFile(join(tmp.path, '.claude', 'hooks', 'protect-secrets.sh'), 'utf-8');
    expect(content).toContain('permissionDecision');
    expect(content).not.toContain('exit 2');
  });

  it('notify-waiting.sh supports macOS, Linux, and WSL notifications', async () => {
    await setupStandard(tmp.path);
    const content = await readFile(join(tmp.path, '.claude', 'hooks', 'notify-waiting.sh'), 'utf-8');
    expect(content).toContain('osascript');
    expect(content).toContain('notify-send');
    expect(content).toContain('powershell');
  });

  it('quality-gate-task.sh reads from stdin and outputs quality reminder', async () => {
    await setupStandard(tmp.path);
    const content = await readFile(join(tmp.path, '.claude', 'hooks', 'quality-gate-task.sh'), 'utf-8');
    expect(content).toContain('cat');
    expect(content).toContain('flutter');
  });
});

// ─── settings.json with Phase 11 deny permissions and hooks ─────────────

describe('P11-009: settings.json has deny permissions and hook registration', () => {
  const tmp = useTempDir('p11-settings-integration-');

  it('settings.json has $schema field', async () => {
    await setupStandard(tmp.path);
    const content = JSON.parse(await readFile(join(tmp.path, '.claude', 'settings.json'), 'utf-8'));
    expect(content.$schema).toContain('schemastore.org');
  });

  it('settings.json has deny permissions list with 10 rules', async () => {
    await setupStandard(tmp.path);
    const content = JSON.parse(await readFile(join(tmp.path, '.claude', 'settings.json'), 'utf-8'));
    expect(content.permissions.deny).toHaveLength(10);
    expect(content.permissions.deny).toContain('Read(./.env)');
    expect(content.permissions.deny).toContain('Bash(rm -rf *)');
    expect(content.permissions.deny).toContain('Bash(sudo *)');
  });

  it('settings.json has hooks from writeHooks registered', async () => {
    await setupStandard(tmp.path);
    const content = JSON.parse(await readFile(join(tmp.path, '.claude', 'settings.json'), 'utf-8'));
    expect(content.hooks).toBeDefined();
    expect(content.hooks.PreToolUse).toBeDefined();
    expect(content.hooks.PostToolUse).toBeDefined();
    expect(content.hooks.TaskCompleted).toBeDefined();
  });

  it('settings.json has env with CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS when agentTeams is true', async () => {
    await setupStandard(tmp.path);
    const content = JSON.parse(await readFile(join(tmp.path, '.claude', 'settings.json'), 'utf-8'));
    expect(content.env?.CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS).toBe('1');
  });

  it('settings.local.json has allow permissions list with 9 rules', async () => {
    await setupStandard(tmp.path);
    const content = JSON.parse(await readFile(join(tmp.path, '.claude', 'settings.local.json'), 'utf-8'));
    expect(content.permissions.allow).toHaveLength(9);
    expect(content.permissions.allow).toContain('Bash(flutter *)');
    expect(content.permissions.allow).toContain('Read(./lib/**)');
  });
});

// ─── Rule files with path-scoped frontmatter ────────────────────────────

describe('P11-009: rule files have narrowed paths in frontmatter', () => {
  const tmp = useTempDir('p11-rules-integration-');

  it('riverpod.md has narrowed paths (providers, presentation)', async () => {
    await setupStandard(tmp.path);
    const content = await readFile(join(tmp.path, '.claude', 'rules', 'riverpod.md'), 'utf-8');
    expect(content).toContain('providers/**');
    expect(content).toContain('presentation/**');
  });

  it('go-router.md has narrowed paths (router, routes)', async () => {
    await setupStandard(tmp.path);
    const content = await readFile(join(tmp.path, '.claude', 'rules', 'go-router.md'), 'utf-8');
    expect(content).toContain('router/**');
    expect(content).toContain('routes/**');
  });

  it('git-workflow.md rule file exists with paths frontmatter', async () => {
    await setupStandard(tmp.path);
    const content = await readFile(join(tmp.path, '.claude', 'rules', 'git-workflow.md'), 'utf-8');
    expect(content.startsWith('---')).toBe(true);
    expect(content).toContain('paths:');
  });

  it('code-quality.md rule file exists with paths frontmatter', async () => {
    await setupStandard(tmp.path);
    const content = await readFile(join(tmp.path, '.claude', 'rules', 'code-quality.md'), 'utf-8');
    expect(content.startsWith('---')).toBe(true);
    expect(content).toContain('paths:');
  });

  it('full module set generates at least 11 rule files (7 core + 4 module)', async () => {
    await setupFull(tmp.path);
    const files = await readdir(join(tmp.path, '.claude', 'rules'));
    expect(files.length).toBeGreaterThanOrEqual(11);
  });
});

// ─── Skills with proactive activation ───────────────────────────────────

describe('P11-009: proactive skills have user-invocable frontmatter', () => {
  const tmp = useTempDir('p11-skills-integration-');

  it('generates exactly 8 skill files', async () => {
    await setupStandard(tmp.path);
    const skills = await readdir(join(tmp.path, '.claude', 'skills'));
    expect(skills).toHaveLength(8);
  });

  it('security-review.md has user-invocable: true and trigger description', async () => {
    await setupStandard(tmp.path);
    const content = await readFile(join(tmp.path, '.claude', 'skills', 'security-review.md'), 'utf-8');
    expect(content).toContain('user-invocable: true');
    expect(content).toContain('description:');
    expect(content).toContain('security');
  });

  it('performance-check.md has user-invocable: true and trigger description', async () => {
    await setupStandard(tmp.path);
    const content = await readFile(join(tmp.path, '.claude', 'skills', 'performance-check.md'), 'utf-8');
    expect(content).toContain('user-invocable: true');
    expect(content).toContain('description:');
    expect(content).toContain('performance');
  });

  it('quality-gate.md skill exists with user-invocable: true', async () => {
    await setupStandard(tmp.path);
    const content = await readFile(join(tmp.path, '.claude', 'skills', 'quality-gate.md'), 'utf-8');
    expect(content).toContain('user-invocable: true');
    expect(content).toContain('flutter analyze');
    expect(content).toContain('flutter test');
  });
});

// ─── start-team command ─────────────────────────────────────────────────

describe('P11-009: start-team command with team composition', () => {
  const tmp = useTempDir('p11-commands-integration-');

  it('generates exactly 3 command files', async () => {
    await setupStandard(tmp.path);
    const commands = await readdir(join(tmp.path, '.claude', 'commands'));
    expect(commands.sort()).toEqual(['add-feature.md', 'analyze.md', 'start-team.md']);
  });

  it('start-team.md contains 4-agent team composition (architect, builder, tester, reviewer)', async () => {
    await setupStandard(tmp.path);
    const content = await readFile(join(tmp.path, '.claude', 'commands', 'start-team.md'), 'utf-8');
    expect(content).toContain('architect');
    expect(content).toContain('builder');
    expect(content).toContain('tester');
    expect(content).toContain('reviewer');
  });

  it('start-team.md specifies model tiers (opus, sonnet, haiku)', async () => {
    await setupStandard(tmp.path);
    const content = await readFile(join(tmp.path, '.claude', 'commands', 'start-team.md'), 'utf-8');
    expect(content).toContain('opus');
    expect(content).toContain('sonnet');
    expect(content).toContain('haiku');
  });

  it('start-team.md includes TDD flow and commit+push protocol', async () => {
    await setupStandard(tmp.path);
    const content = await readFile(join(tmp.path, '.claude', 'commands', 'start-team.md'), 'utf-8');
    expect(content).toContain('TDD');
    expect(content).toContain('git push');
  });
});

// ─── CLAUDE.md optimization ─────────────────────────────────────────────

describe('P11-009: CLAUDE.md under 120 lines with @-imports', () => {
  const tmp = useTempDir('p11-claudemd-integration-');

  it('CLAUDE.md is under 120 lines with all modules and agentTeams', async () => {
    await setupFull(tmp.path);
    const content = await readFile(join(tmp.path, 'CLAUDE.md'), 'utf-8');
    const lineCount = content.split('\n').length;
    expect(lineCount).toBeLessThanOrEqual(120);
  });

  it('CLAUDE.md contains @-imports for git-workflow.md and code-quality.md', async () => {
    await setupStandard(tmp.path);
    const content = await readFile(join(tmp.path, 'CLAUDE.md'), 'utf-8');
    expect(content).toContain('@.claude/rules/git-workflow.md');
    expect(content).toContain('@.claude/rules/code-quality.md');
  });

  it('CLAUDE.md contains model policy section', async () => {
    await setupStandard(tmp.path);
    const content = await readFile(join(tmp.path, 'CLAUDE.md'), 'utf-8');
    expect(content).toContain('Model');
    expect(content).toContain('Opus');
    expect(content).toContain('Sonnet');
    expect(content).toContain('Haiku');
  });

  it('CLAUDE.md contains emphasis markers on quality gates', async () => {
    await setupStandard(tmp.path);
    const content = await readFile(join(tmp.path, 'CLAUDE.md'), 'utf-8');
    expect(content).toContain('**IMPORTANT:**');
  });
});

// ─── Preset behavior ────────────────────────────────────────────────────

describe('P11-009: minimal preset skips agents, hooks, skills, commands', () => {
  const tmp = useTempDir('p11-minimal-preset-');

  it('minimal preset has CLAUDE.md and rules but no agents/hooks/skills/commands', async () => {
    await setupMinimal(tmp.path);

    const claudeMd = await readFile(join(tmp.path, 'CLAUDE.md'), 'utf-8');
    expect(claudeMd.length).toBeGreaterThan(0);
    const rules = await readdir(join(tmp.path, '.claude', 'rules'));
    expect(rules.length).toBeGreaterThanOrEqual(7);

    await expect(readdir(join(tmp.path, '.claude', 'agents'))).rejects.toThrow();
    await expect(readdir(join(tmp.path, '.claude', 'hooks'))).rejects.toThrow();
    await expect(readdir(join(tmp.path, '.claude', 'skills'))).rejects.toThrow();
    await expect(readdir(join(tmp.path, '.claude', 'commands'))).rejects.toThrow();
  });
});

describe('P11-009: standard preset has agents, hooks, skills, commands', () => {
  const tmp = useTempDir('p11-standard-preset-');

  it('standard preset generates 4 agents, 5 hooks, 8 skills, 3 commands — no .mcp.json', async () => {
    await setupStandard(tmp.path);

    const agents = await readdir(join(tmp.path, '.claude', 'agents'));
    expect(agents).toHaveLength(4);
    const hooks = await readdir(join(tmp.path, '.claude', 'hooks'));
    expect(hooks).toHaveLength(5);
    const skills = await readdir(join(tmp.path, '.claude', 'skills'));
    expect(skills).toHaveLength(8);
    const commands = await readdir(join(tmp.path, '.claude', 'commands'));
    expect(commands).toHaveLength(3);

    await expect(stat(join(tmp.path, '.mcp.json'))).rejects.toThrow();
  });
});

describe('P11-009: full preset includes .mcp.json alongside all outputs', () => {
  const tmp = useTempDir('p11-full-preset-');

  it('full preset generates 4 agents, 5 hooks, 8 skills, 3 commands, and .mcp.json', async () => {
    await setupFull(tmp.path);

    const agents = await readdir(join(tmp.path, '.claude', 'agents'));
    expect(agents).toHaveLength(4);
    const hooks = await readdir(join(tmp.path, '.claude', 'hooks'));
    expect(hooks).toHaveLength(5);
    const skills = await readdir(join(tmp.path, '.claude', 'skills'));
    expect(skills).toHaveLength(8);
    const commands = await readdir(join(tmp.path, '.claude', 'commands'));
    expect(commands).toHaveLength(3);

    const mcp = JSON.parse(await readFile(join(tmp.path, '.mcp.json'), 'utf-8'));
    expect(mcp.mcpServers).toBeDefined();
  });
});
