import { readFile, readdir, stat, access, constants } from 'node:fs/promises';
import { join } from 'node:path';
import { runClaudeSetup } from '../../src/claude-setup/setup-orchestrator.js';
import { makeTestContext } from '../helpers/context-factory.js';
import { useTempDir } from '../helpers/temp-dir.js';

async function fileExists(p: string): Promise<boolean> {
  try {
    const s = await stat(p);
    return s.isFile();
  } catch {
    return false;
  }
}

// ─── P11-001: Agent definitions with best-practice frontmatter ──────────

describe('Phase 11: agent definitions (P11-001)', () => {
  const tmp = useTempDir('p11-agents-');

  it('standard preset generates exactly 4 agent definition files', async () => {
    await runClaudeSetup(makeTestContext({ claude: { enabled: true, agentTeams: false, preset: 'standard' } }), tmp.path);
    const agents = await readdir(join(tmp.path, '.claude', 'agents'));
    expect(agents.sort()).toEqual([
      'flutter-architect.md',
      'flutter-builder.md',
      'flutter-reviewer.md',
      'flutter-tester.md',
    ]);
  });

  it('flutter-architect has isolation omitted and maxTurns in frontmatter', async () => {
    await runClaudeSetup(makeTestContext({ claude: { enabled: true, agentTeams: false, preset: 'standard' } }), tmp.path);
    const content = await readFile(join(tmp.path, '.claude', 'agents', 'flutter-architect.md'), 'utf-8');
    expect(content).toContain('model: opus');
    expect(content).toContain('maxTurns:');
    expect(content).not.toContain('isolation:');
  });

  it('flutter-builder has isolation: worktree in frontmatter', async () => {
    await runClaudeSetup(makeTestContext({ claude: { enabled: true, agentTeams: false, preset: 'standard' } }), tmp.path);
    const content = await readFile(join(tmp.path, '.claude', 'agents', 'flutter-builder.md'), 'utf-8');
    expect(content).toContain('isolation: worktree');
    expect(content).toContain('model: opus');
  });

  it('flutter-tester has isolation: worktree in frontmatter', async () => {
    await runClaudeSetup(makeTestContext({ claude: { enabled: true, agentTeams: false, preset: 'standard' } }), tmp.path);
    const content = await readFile(join(tmp.path, '.claude', 'agents', 'flutter-tester.md'), 'utf-8');
    expect(content).toContain('isolation: worktree');
    expect(content).toContain('model: sonnet');
  });

  it('flutter-reviewer has memory: user in frontmatter', async () => {
    await runClaudeSetup(makeTestContext({ claude: { enabled: true, agentTeams: false, preset: 'standard' } }), tmp.path);
    const content = await readFile(join(tmp.path, '.claude', 'agents', 'flutter-reviewer.md'), 'utf-8');
    expect(content).toContain('memory: user');
    expect(content).toContain('model: sonnet');
  });

  it('all agents have Scope Boundaries section', async () => {
    await runClaudeSetup(makeTestContext({ claude: { enabled: true, agentTeams: false, preset: 'standard' } }), tmp.path);
    const agentsDir = join(tmp.path, '.claude', 'agents');
    for (const file of await readdir(agentsDir)) {
      const content = await readFile(join(agentsDir, file), 'utf-8');
      expect(content).toContain('Scope Boundaries');
    }
  });

  it('minimal preset does not generate agents directory', async () => {
    await runClaudeSetup(makeTestContext({ claude: { enabled: true, agentTeams: false, preset: 'minimal' } }), tmp.path);
    let exists = true;
    try {
      await stat(join(tmp.path, '.claude', 'agents'));
    } catch {
      exists = false;
    }
    expect(exists).toBe(false);
  });
});

// ─── P11-002: protect-secrets and notification hooks ────────────────────

describe('Phase 11: hook scripts (P11-002)', () => {
  const tmp = useTempDir('p11-hooks-');

  it('standard preset generates 7 hook scripts', async () => {
    await runClaudeSetup(makeTestContext({ claude: { enabled: true, agentTeams: false, preset: 'standard' } }), tmp.path);
    const hooks = await readdir(join(tmp.path, '.claude', 'hooks'));
    expect(hooks.sort()).toEqual([
      'block-dangerous.sh',
      'context-monitor.sh',
      'format-dart.sh',
      'notify-waiting.sh',
      'precompact-preserve.sh',
      'protect-secrets.sh',
      'quality-gate-task.sh',
    ]);
  });

  it('protect-secrets.sh uses JSON decision format (not exit 2)', async () => {
    await runClaudeSetup(makeTestContext({ claude: { enabled: true, agentTeams: false, preset: 'standard' } }), tmp.path);
    const content = await readFile(join(tmp.path, '.claude', 'hooks', 'protect-secrets.sh'), 'utf-8');
    expect(content).toContain('hookSpecificOutput');
    expect(content).toContain('permissionDecision');
    expect(content).not.toContain('exit 2');
  });

  it('notify-waiting.sh supports cross-platform notifications', async () => {
    await runClaudeSetup(makeTestContext({ claude: { enabled: true, agentTeams: false, preset: 'standard' } }), tmp.path);
    const content = await readFile(join(tmp.path, '.claude', 'hooks', 'notify-waiting.sh'), 'utf-8');
    expect(content).toContain('osascript');
    expect(content).toContain('notify-send');
    expect(content).toContain('Claude Code');
  });

  it('all hook scripts start with shebang', async () => {
    await runClaudeSetup(makeTestContext({ claude: { enabled: true, agentTeams: false, preset: 'standard' } }), tmp.path);
    const hooksDir = join(tmp.path, '.claude', 'hooks');
    for (const file of await readdir(hooksDir)) {
      const content = await readFile(join(hooksDir, file), 'utf-8');
      expect(content.startsWith('#!/bin/bash')).toBe(true);
    }
  });

  it('all hook scripts are executable', async () => {
    await runClaudeSetup(makeTestContext({ claude: { enabled: true, agentTeams: false, preset: 'standard' } }), tmp.path);
    const hooksDir = join(tmp.path, '.claude', 'hooks');
    for (const file of await readdir(hooksDir)) {
      await expect(access(join(hooksDir, file), constants.X_OK)).resolves.toBeUndefined();
    }
  });
});

// ─── P11-003: settings.json with deny permissions ───────────────────────

describe('Phase 11: settings files (P11-003)', () => {
  const tmp = useTempDir('p11-settings-');

  it('standard preset generates settings.json with deny permissions', async () => {
    await runClaudeSetup(makeTestContext({ claude: { enabled: true, agentTeams: false, preset: 'standard' } }), tmp.path);
    const content = JSON.parse(await readFile(join(tmp.path, '.claude', 'settings.json'), 'utf-8'));
    expect(content.permissions.deny).toContain('Read(./.env)');
    expect(content.permissions.deny).toContain('Bash(rm -rf *)');
    expect(content.permissions.deny).toContain('Bash(sudo *)');
    expect(content.permissions.allow).toBeUndefined();
  });

  it('settings.local.json has allow-only permissions', async () => {
    await runClaudeSetup(makeTestContext({ claude: { enabled: true, agentTeams: false, preset: 'standard' } }), tmp.path);
    const content = JSON.parse(await readFile(join(tmp.path, '.claude', 'settings.local.json'), 'utf-8'));
    expect(content.permissions.allow).toContain('Bash(flutter *)');
    expect(content.permissions.allow).toContain('Read(./lib/**)');
    expect(content.permissions.deny).toBeUndefined();
  });

  it('settings.json includes hooks from writeHooks', async () => {
    await runClaudeSetup(makeTestContext({ claude: { enabled: true, agentTeams: false, preset: 'standard' } }), tmp.path);
    const content = JSON.parse(await readFile(join(tmp.path, '.claude', 'settings.json'), 'utf-8'));
    expect(content.hooks).toBeDefined();
    expect(content.hooks.PreToolUse).toBeDefined();
    expect(content.hooks.PostToolUse).toBeDefined();
    expect(content.hooks.TaskCompleted).toBeDefined();
  });

  it('settings.json has agentTeams env when enabled', async () => {
    await runClaudeSetup(makeTestContext({ claude: { enabled: true, agentTeams: true, preset: 'standard' } }), tmp.path);
    const content = JSON.parse(await readFile(join(tmp.path, '.claude', 'settings.json'), 'utf-8'));
    expect(content.env?.CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS).toBe('1');
  });

  it('minimal preset does not generate settings files', async () => {
    await runClaudeSetup(makeTestContext({ claude: { enabled: true, agentTeams: false, preset: 'minimal' } }), tmp.path);
    expect(await fileExists(join(tmp.path, '.claude', 'settings.json'))).toBe(false);
  });
});

// ─── P11-004: rules with path-scoped frontmatter ────────────────────────

describe('Phase 11: path-scoped rule files (P11-004)', () => {
  const tmp = useTempDir('p11-rules-');

  it('all 7 core rules have YAML frontmatter with paths:', async () => {
    await runClaudeSetup(makeTestContext({ claude: { enabled: true, agentTeams: false, preset: 'standard' } }), tmp.path);
    const rulesDir = join(tmp.path, '.claude', 'rules');
    const coreFiles = ['architecture.md', 'riverpod.md', 'go-router.md', 'testing.md', 'security.md', 'git-workflow.md', 'code-quality.md'];
    for (const file of coreFiles) {
      const content = await readFile(join(rulesDir, file), 'utf-8');
      expect(content.startsWith('---')).toBe(true);
      expect(content).toContain('paths:');
    }
  });

  it('riverpod rule paths scope to providers and presentation', async () => {
    await runClaudeSetup(makeTestContext({ claude: { enabled: true, agentTeams: false, preset: 'standard' } }), tmp.path);
    const content = await readFile(join(tmp.path, '.claude', 'rules', 'riverpod.md'), 'utf-8');
    expect(content).toContain('providers');
    expect(content).toContain('presentation');
  });

  it('go-router rule paths scope to router/routes', async () => {
    await runClaudeSetup(makeTestContext({ claude: { enabled: true, agentTeams: false, preset: 'standard' } }), tmp.path);
    const content = await readFile(join(tmp.path, '.claude', 'rules', 'go-router.md'), 'utf-8');
    expect(content).toContain('router');
    expect(content).toContain('routes');
  });

  it('git-workflow.md and code-quality.md exist as core rules', async () => {
    await runClaudeSetup(makeTestContext({ claude: { enabled: true, agentTeams: false, preset: 'standard' } }), tmp.path);
    const rulesDir = join(tmp.path, '.claude', 'rules');
    expect(await fileExists(join(rulesDir, 'git-workflow.md'))).toBe(true);
    expect(await fileExists(join(rulesDir, 'code-quality.md'))).toBe(true);
  });

  it('minimal preset generates core rules with frontmatter', async () => {
    await runClaudeSetup(makeTestContext({ claude: { enabled: true, agentTeams: false, preset: 'minimal' } }), tmp.path);
    const rulesDir = join(tmp.path, '.claude', 'rules');
    const files = await readdir(rulesDir);
    expect(files.length).toBe(9);
    const content = await readFile(join(rulesDir, 'architecture.md'), 'utf-8');
    expect(content.startsWith('---')).toBe(true);
  });
});

// ─── P11-005: proactive skills ──────────────────────────────────────────

describe('Phase 11: proactive skills (P11-005)', () => {
  const tmp = useTempDir('p11-skills-');

  it('standard preset generates 13 skill files', async () => {
    await runClaudeSetup(makeTestContext({ claude: { enabled: true, agentTeams: false, preset: 'standard' } }), tmp.path);
    const skills = await readdir(join(tmp.path, '.claude', 'skills'));
    expect(skills.length).toBe(13);
    expect(skills).toContain('quality-gate');
    expect(skills).toContain('security-review');
    expect(skills).toContain('performance-check');
  });

  it('security-review skill has user-invocable: true frontmatter', async () => {
    await runClaudeSetup(makeTestContext({ claude: { enabled: true, agentTeams: false, preset: 'standard' } }), tmp.path);
    const content = await readFile(join(tmp.path, '.claude', 'skills', 'security-review', 'SKILL.md'), 'utf-8');
    expect(content).toContain('user-invocable: true');
    expect(content).toContain('description:');
  });

  it('performance-check skill has user-invocable: true frontmatter', async () => {
    await runClaudeSetup(makeTestContext({ claude: { enabled: true, agentTeams: false, preset: 'standard' } }), tmp.path);
    const content = await readFile(join(tmp.path, '.claude', 'skills', 'performance-check', 'SKILL.md'), 'utf-8');
    expect(content).toContain('user-invocable: true');
    expect(content).toContain('description:');
  });

  it('quality-gate skill has user-invocable: true and model: sonnet', async () => {
    await runClaudeSetup(makeTestContext({ claude: { enabled: true, agentTeams: false, preset: 'standard' } }), tmp.path);
    const content = await readFile(join(tmp.path, '.claude', 'skills', 'quality-gate', 'SKILL.md'), 'utf-8');
    expect(content).toContain('user-invocable: true');
    expect(content).toContain('model: sonnet');
  });

  it('minimal preset does not generate skills directory', async () => {
    await runClaudeSetup(makeTestContext({ claude: { enabled: true, agentTeams: false, preset: 'minimal' } }), tmp.path);
    let exists = true;
    try {
      await stat(join(tmp.path, '.claude', 'skills'));
    } catch {
      exists = false;
    }
    expect(exists).toBe(false);
  });
});

// ─── P11-006: start-team command ────────────────────────────────────────

describe('Phase 11: start-team command (P11-006)', () => {
  const tmp = useTempDir('p11-commands-');

  it('standard preset generates start-team.md command', async () => {
    await runClaudeSetup(makeTestContext({ claude: { enabled: true, agentTeams: false, preset: 'standard' } }), tmp.path);
    expect(await fileExists(join(tmp.path, '.claude', 'commands', 'start-team.md'))).toBe(true);
  });

  it('start-team command includes 4-agent team composition', async () => {
    await runClaudeSetup(makeTestContext({ claude: { enabled: true, agentTeams: false, preset: 'standard' } }), tmp.path);
    const content = await readFile(join(tmp.path, '.claude', 'commands', 'start-team.md'), 'utf-8');
    expect(content).toContain('architect');
    expect(content).toContain('builder');
    expect(content).toContain('tester');
    expect(content).toContain('reviewer');
    expect(content).toContain('opus');
    expect(content).toContain('sonnet');
  });

  it('start-team command includes TDD flow steps', async () => {
    await runClaudeSetup(makeTestContext({ claude: { enabled: true, agentTeams: false, preset: 'standard' } }), tmp.path);
    const content = await readFile(join(tmp.path, '.claude', 'commands', 'start-team.md'), 'utf-8');
    expect(content).toContain('RED');
    expect(content).toContain('GREEN');
  });

  it('commands directory has exactly 3 files', async () => {
    await runClaudeSetup(makeTestContext({ claude: { enabled: true, agentTeams: false, preset: 'standard' } }), tmp.path);
    const commands = await readdir(join(tmp.path, '.claude', 'commands'));
    expect(commands.sort()).toEqual(['add-feature.md', 'analyze.md', 'start-team.md']);
  });
});

// ─── P11-007: CLAUDE.md @-imports and model policy ──────────────────────

describe('Phase 11: CLAUDE.md @-imports (P11-007)', () => {
  const tmp = useTempDir('p11-claude-md-');

  it('CLAUDE.md is under 120 lines', async () => {
    await runClaudeSetup(makeTestContext({ claude: { enabled: true, agentTeams: true, preset: 'standard' } }), tmp.path);
    const content = await readFile(join(tmp.path, 'CLAUDE.md'), 'utf-8');
    const lineCount = content.split('\n').length;
    expect(lineCount).toBeLessThanOrEqual(120);
  });

  it('CLAUDE.md uses @-imports for git-workflow and code-quality rules', async () => {
    await runClaudeSetup(makeTestContext({ claude: { enabled: true, agentTeams: false, preset: 'standard' } }), tmp.path);
    const content = await readFile(join(tmp.path, 'CLAUDE.md'), 'utf-8');
    expect(content).toContain('@.claude/rules/git-workflow.md');
    expect(content).toContain('@.claude/rules/code-quality.md');
  });

  it('CLAUDE.md includes Model Usage Policy section', async () => {
    await runClaudeSetup(makeTestContext({ claude: { enabled: true, agentTeams: false, preset: 'standard' } }), tmp.path);
    const content = await readFile(join(tmp.path, 'CLAUDE.md'), 'utf-8');
    expect(content).toContain('Model Usage Policy');
    expect(content).toContain('Opus');
    expect(content).toContain('Sonnet');
    expect(content).toContain('Haiku');
  });

  it('CLAUDE.md includes IMPORTANT/NEVER emphasis markers in quality gates', async () => {
    await runClaudeSetup(makeTestContext({ claude: { enabled: true, agentTeams: false, preset: 'standard' } }), tmp.path);
    const content = await readFile(join(tmp.path, 'CLAUDE.md'), 'utf-8');
    expect(content).toMatch(/IMPORTANT|NEVER|MUST/);
  });

  it('CLAUDE.md includes agent teams section when agentTeams is true', async () => {
    await runClaudeSetup(makeTestContext({ claude: { enabled: true, agentTeams: true, preset: 'standard' } }), tmp.path);
    const content = await readFile(join(tmp.path, 'CLAUDE.md'), 'utf-8');
    expect(content).toContain('Agent Teams');
  });

  it('CLAUDE.md omits agent teams section when agentTeams is false', async () => {
    await runClaudeSetup(makeTestContext({ claude: { enabled: true, agentTeams: false, preset: 'standard' } }), tmp.path);
    const content = await readFile(join(tmp.path, 'CLAUDE.md'), 'utf-8');
    expect(content).not.toContain('Agent Teams');
  });
});

// ─── P11-008: quality-gate-task hook ────────────────────────────────────

describe('Phase 11: quality-gate-task hook (P11-008)', () => {
  const tmp = useTempDir('p11-quality-gate-hook-');

  it('quality-gate-task.sh exists as a hook script', async () => {
    await runClaudeSetup(makeTestContext({ claude: { enabled: true, agentTeams: false, preset: 'standard' } }), tmp.path);
    expect(await fileExists(join(tmp.path, '.claude', 'hooks', 'quality-gate-task.sh'))).toBe(true);
  });

  it('quality-gate-task.sh includes flutter quality reminders', async () => {
    await runClaudeSetup(makeTestContext({ claude: { enabled: true, agentTeams: false, preset: 'standard' } }), tmp.path);
    const content = await readFile(join(tmp.path, '.claude', 'hooks', 'quality-gate-task.sh'), 'utf-8');
    expect(content).toContain('flutter analyze');
    expect(content).toContain('flutter test');
  });

  it('settings.json registers quality-gate-task in TaskCompleted', async () => {
    await runClaudeSetup(makeTestContext({ claude: { enabled: true, agentTeams: false, preset: 'standard' } }), tmp.path);
    const content = JSON.parse(await readFile(join(tmp.path, '.claude', 'settings.json'), 'utf-8'));
    expect(content.hooks.TaskCompleted).toBeDefined();
    expect(content.hooks.TaskCompleted[0].hooks[0].command).toContain('quality-gate-task.sh');
    expect(content.hooks.TaskCompleted[0].hooks[0].timeout).toBe(120);
  });
});

// ─── Cross-preset verification ──────────────────────────────────────────

describe('Phase 11: cross-preset verification', () => {
  const tmp = useTempDir('p11-presets-');

  it('minimal preset generates only CLAUDE.md + rules (no agents, hooks, skills, commands, settings)', async () => {
    await runClaudeSetup(makeTestContext({ claude: { enabled: true, agentTeams: false, preset: 'minimal' } }), tmp.path);

    expect(await fileExists(join(tmp.path, 'CLAUDE.md'))).toBe(true);
    const rules = await readdir(join(tmp.path, '.claude', 'rules'));
    expect(rules.length).toBe(9);

    // These should NOT exist for minimal
    let agentsExist = true;
    try { await stat(join(tmp.path, '.claude', 'agents')); } catch { agentsExist = false; }
    expect(agentsExist).toBe(false);

    let hooksExist = true;
    try { await stat(join(tmp.path, '.claude', 'hooks')); } catch { hooksExist = false; }
    expect(hooksExist).toBe(false);

    expect(await fileExists(join(tmp.path, '.claude', 'settings.json'))).toBe(false);
  });

  it('standard preset generates agents, hooks, skills, commands, settings but not .mcp.json', async () => {
    await runClaudeSetup(makeTestContext({ claude: { enabled: true, agentTeams: false, preset: 'standard' } }), tmp.path);

    expect(await fileExists(join(tmp.path, 'CLAUDE.md'))).toBe(true);
    expect((await readdir(join(tmp.path, '.claude', 'agents'))).length).toBe(4);
    expect((await readdir(join(tmp.path, '.claude', 'hooks'))).length).toBe(7);
    expect((await readdir(join(tmp.path, '.claude', 'skills'))).length).toBe(13);
    expect((await readdir(join(tmp.path, '.claude', 'commands'))).length).toBe(3);
    expect(await fileExists(join(tmp.path, '.claude', 'settings.json'))).toBe(true);
    expect(await fileExists(join(tmp.path, '.claude', 'settings.local.json'))).toBe(true);
    expect(await fileExists(join(tmp.path, '.mcp.json'))).toBe(false);
  });

  it('full preset generates everything including .mcp.json', async () => {
    await runClaudeSetup(makeTestContext({ claude: { enabled: true, agentTeams: false, preset: 'full' } }), tmp.path);

    expect(await fileExists(join(tmp.path, 'CLAUDE.md'))).toBe(true);
    expect((await readdir(join(tmp.path, '.claude', 'agents'))).length).toBe(4);
    expect((await readdir(join(tmp.path, '.claude', 'hooks'))).length).toBe(7);
    expect((await readdir(join(tmp.path, '.claude', 'skills'))).length).toBe(13);
    expect((await readdir(join(tmp.path, '.claude', 'commands'))).length).toBe(3);
    expect(await fileExists(join(tmp.path, '.claude', 'settings.json'))).toBe(true);
    expect(await fileExists(join(tmp.path, '.claude', 'settings.local.json'))).toBe(true);
    expect(await fileExists(join(tmp.path, '.mcp.json'))).toBe(true);
  });

  it('filesWritten includes settings.json and settings.local.json for standard preset', async () => {
    const result = await runClaudeSetup(
      makeTestContext({ claude: { enabled: true, agentTeams: false, preset: 'standard' } }),
      tmp.path,
    );
    const relative = result.filesWritten.map((f) => f.replace(tmp.path + '/', '').replace(tmp.path + '\\', ''));
    expect(relative).toContain('.claude/settings.json');
    expect(relative).toContain('.claude/settings.local.json');
  });
});
