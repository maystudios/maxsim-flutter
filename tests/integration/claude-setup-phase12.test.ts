import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { runClaudeSetup } from '../../src/claude-setup/setup-orchestrator.js';
import { makeTestContext } from '../helpers/context-factory.js';
import { useTempDir } from '../helpers/temp-dir.js';

// --- Helpers ----------------------------------------------------------------

async function setupStandard(tmpPath: string) {
  const ctx = makeTestContext({
    claude: { enabled: true, agentTeams: true, preset: 'standard' },
  });
  await runClaudeSetup(ctx, tmpPath);
  return ctx;
}

async function setupWithoutTeams(tmpPath: string) {
  const ctx = makeTestContext({
    claude: { enabled: true, agentTeams: false, preset: 'standard' },
  });
  await runClaudeSetup(ctx, tmpPath);
  return ctx;
}

// --- Agent definitions with SDD agents and Phase 12 sections ----------------

describe('Phase 12: agent count varies by agentTeams flag', () => {
  const tmp = useTempDir('p12-agent-count-');

  it('generates 6 agent files when agentTeams is true', async () => {
    await setupStandard(tmp.path);
    const agents = await readdir(join(tmp.path, '.claude', 'agents'));
    expect(agents).toHaveLength(6);
  });

  it('generates 4 agent files when agentTeams is false', async () => {
    await setupWithoutTeams(tmp.path);
    const agents = await readdir(join(tmp.path, '.claude', 'agents'));
    expect(agents).toHaveLength(4);
  });
});

describe('Phase 12: SDD agents present only with agentTeams', () => {
  const tmp = useTempDir('p12-sdd-agents-');

  it('specifier and planner agents exist when agentTeams is true', async () => {
    await setupStandard(tmp.path);
    const agents = await readdir(join(tmp.path, '.claude', 'agents'));
    expect(agents).toContain('flutter-specifier.md');
    expect(agents).toContain('flutter-planner.md');
  });

  it('specifier and planner agents are absent when agentTeams is false', async () => {
    await setupWithoutTeams(tmp.path);
    const agents = await readdir(join(tmp.path, '.claude', 'agents'));
    expect(agents).not.toContain('flutter-specifier.md');
    expect(agents).not.toContain('flutter-planner.md');
  });
});

describe('Phase 12: agents contain Error Recovery Protocol section', () => {
  const tmp = useTempDir('p12-agent-error-recovery-');

  it('all agent files contain Error Recovery Protocol', async () => {
    await setupStandard(tmp.path);
    const agentsDir = join(tmp.path, '.claude', 'agents');
    const agents = await readdir(agentsDir);
    for (const file of agents) {
      const content = await readFile(join(agentsDir, file), 'utf-8');
      expect(content).toContain('Error Recovery Protocol');
    }
  });
});

describe('Phase 12: agents contain Context Management section', () => {
  const tmp = useTempDir('p12-agent-context-mgmt-');

  it('all agent files contain Context Management', async () => {
    await setupStandard(tmp.path);
    const agentsDir = join(tmp.path, '.claude', 'agents');
    const agents = await readdir(agentsDir);
    for (const file of agents) {
      const content = await readFile(join(agentsDir, file), 'utf-8');
      expect(content).toContain('Context Management');
    }
  });
});

describe('Phase 12: reviewer uses sonnet model', () => {
  const tmp = useTempDir('p12-reviewer-model-');

  it('flutter-reviewer.md uses model: sonnet', async () => {
    await setupStandard(tmp.path);
    const content = await readFile(
      join(tmp.path, '.claude', 'agents', 'flutter-reviewer.md'),
      'utf-8',
    );
    expect(content).toContain('model: sonnet');
    expect(content).not.toContain('model: haiku');
  });
});

// --- Rules include Phase 12 additions ---------------------------------------

describe('Phase 12: rules include error-recovery and context-management', () => {
  const tmp = useTempDir('p12-rules-');

  it('error-recovery.md rule file exists with paths frontmatter', async () => {
    await setupStandard(tmp.path);
    const content = await readFile(
      join(tmp.path, '.claude', 'rules', 'error-recovery.md'),
      'utf-8',
    );
    expect(content.startsWith('---')).toBe(true);
    expect(content).toContain('paths:');
  });

  it('context-management.md rule file exists with paths frontmatter', async () => {
    await setupStandard(tmp.path);
    const content = await readFile(
      join(tmp.path, '.claude', 'rules', 'context-management.md'),
      'utf-8',
    );
    expect(content.startsWith('---')).toBe(true);
    expect(content).toContain('paths:');
  });

  it('generates 9 core rule files with standard preset', async () => {
    await setupStandard(tmp.path);
    const rules = await readdir(join(tmp.path, '.claude', 'rules'));
    expect(rules).toHaveLength(9);
  });
});

// --- Skills always 13 and SDD skill frontmatter ----------------------------

describe('Phase 12: skills count and SDD skill frontmatter', () => {
  const tmp = useTempDir('p12-skills-');

  it('generates 13 skill files regardless of agentTeams flag', async () => {
    await setupStandard(tmp.path);
    const skills = await readdir(join(tmp.path, '.claude', 'skills'));
    expect(skills).toHaveLength(13);
  });

  it('generates 13 skill files when agentTeams is false', async () => {
    await setupWithoutTeams(tmp.path);
    const skills = await readdir(join(tmp.path, '.claude', 'skills'));
    expect(skills).toHaveLength(13);
  });

  it('sdd-workflow has user-invocable: true', async () => {
    await setupStandard(tmp.path);
    const content = await readFile(
      join(tmp.path, '.claude', 'skills', 'sdd-workflow', 'SKILL.md'),
      'utf-8',
    );
    expect(content).toContain('user-invocable: true');
  });

  it('spec-template has user-invocable: false', async () => {
    await setupStandard(tmp.path);
    const content = await readFile(
      join(tmp.path, '.claude', 'skills', 'spec-template', 'SKILL.md'),
      'utf-8',
    );
    expect(content).toContain('user-invocable: false');
  });

  it('plan-template has user-invocable: false', async () => {
    await setupStandard(tmp.path);
    const content = await readFile(
      join(tmp.path, '.claude', 'skills', 'plan-template', 'SKILL.md'),
      'utf-8',
    );
    expect(content).toContain('user-invocable: false');
  });
});

// --- Commands vary by agentTeams and SDD commands have model ----------------

describe('Phase 12: command count varies by agentTeams flag', () => {
  const tmp = useTempDir('p12-commands-');

  it('generates 6 command files when agentTeams is true', async () => {
    await setupStandard(tmp.path);
    const commands = await readdir(join(tmp.path, '.claude', 'commands'));
    expect(commands).toHaveLength(6);
  });

  it('generates 3 command files when agentTeams is false', async () => {
    await setupWithoutTeams(tmp.path);
    const commands = await readdir(join(tmp.path, '.claude', 'commands'));
    expect(commands).toHaveLength(3);
  });

  it('SDD commands (specify.md, plan.md, tasks.md) have model frontmatter', async () => {
    await setupStandard(tmp.path);
    const commandsDir = join(tmp.path, '.claude', 'commands');
    for (const file of ['specify.md', 'plan.md', 'tasks.md']) {
      const content = await readFile(join(commandsDir, file), 'utf-8');
      expect(content).toContain('model:');
    }
  });
});

// --- start-team.md has File Ownership and Error Recovery --------------------

describe('Phase 12: start-team.md has File Ownership and Error Recovery', () => {
  const tmp = useTempDir('p12-start-team-');

  it('start-team.md contains File Ownership column', async () => {
    await setupStandard(tmp.path);
    const content = await readFile(
      join(tmp.path, '.claude', 'commands', 'start-team.md'),
      'utf-8',
    );
    expect(content).toContain('File Ownership');
  });

  it('start-team.md contains Error Recovery Protocol section', async () => {
    await setupStandard(tmp.path);
    const content = await readFile(
      join(tmp.path, '.claude', 'commands', 'start-team.md'),
      'utf-8',
    );
    expect(content).toContain('Error Recovery Protocol');
  });
});

// --- CLAUDE.md has SDD Pipeline and security sections -----------------------

describe('Phase 12: CLAUDE.md has SDD Pipeline and security sections', () => {
  const tmp = useTempDir('p12-claudemd-');

  it('CLAUDE.md has SDD Pipeline section when agentTeams is true', async () => {
    await setupStandard(tmp.path);
    const content = await readFile(join(tmp.path, 'CLAUDE.md'), 'utf-8');
    expect(content).toContain('SDD');
  });

  it('CLAUDE.md has security section', async () => {
    await setupStandard(tmp.path);
    const content = await readFile(join(tmp.path, 'CLAUDE.md'), 'utf-8');
    expect(content).toMatch(/[Ss]ecurity/);
  });

  it('CLAUDE.md has @-imports for error-recovery and context-management rules', async () => {
    await setupStandard(tmp.path);
    const content = await readFile(join(tmp.path, 'CLAUDE.md'), 'utf-8');
    expect(content).toContain('@.claude/rules/error-recovery.md');
    expect(content).toContain('@.claude/rules/context-management.md');
  });
});

// --- Settings env has CLAUDE_AUTOCOMPACT_PCT_OVERRIDE -----------------------

describe('Phase 12: settings env has CLAUDE_AUTOCOMPACT_PCT_OVERRIDE', () => {
  const tmp = useTempDir('p12-settings-autocompact-');

  it('settings.json env includes CLAUDE_AUTOCOMPACT_PCT_OVERRIDE set to 70', async () => {
    await setupStandard(tmp.path);
    const content = JSON.parse(
      await readFile(join(tmp.path, '.claude', 'settings.json'), 'utf-8'),
    );
    expect(content.env?.CLAUDE_AUTOCOMPACT_PCT_OVERRIDE).toBe('70');
  });
});

// --- Hook scripts with Phase 12 specifics -----------------------------------

describe('Phase 12: hook scripts with Phase 12 specifics', () => {
  const tmp = useTempDir('p12-hooks-');

  it('hooks directory contains exactly 7 scripts', async () => {
    await setupStandard(tmp.path);
    const entries = await readdir(join(tmp.path, '.claude', 'hooks'));
    expect(entries).toHaveLength(7);
  });

  it('quality-gate-task.sh has exit 2 (blocking) and timeout 120', async () => {
    await setupStandard(tmp.path);
    const content = await readFile(
      join(tmp.path, '.claude', 'hooks', 'quality-gate-task.sh'),
      'utf-8',
    );
    expect(content).toContain('exit 2');
    // Timeout is in settings.json hook registration, check script references blocking
    const settings = JSON.parse(
      await readFile(join(tmp.path, '.claude', 'settings.json'), 'utf-8'),
    );
    const taskCompleted = settings.hooks?.TaskCompleted;
    const qualityHook = taskCompleted?.flatMap(
      (e: { hooks: Array<{ command: string; timeout?: number }> }) => e.hooks,
    ).find((h: { command: string }) => h.command.includes('quality-gate-task'));
    expect(qualityHook?.timeout).toBe(120);
  });

  it('precompact-preserve.sh preserves git state via git diff', async () => {
    await setupStandard(tmp.path);
    const content = await readFile(
      join(tmp.path, '.claude', 'hooks', 'precompact-preserve.sh'),
      'utf-8',
    );
    expect(content).toContain('git diff');
  });

  it('context-monitor.sh is advisory (exit 0) and runs on Stop event', async () => {
    await setupStandard(tmp.path);
    const content = await readFile(
      join(tmp.path, '.claude', 'hooks', 'context-monitor.sh'),
      'utf-8',
    );
    expect(content).toContain('exit 0');
    // Verify registered on Stop in settings.json
    const settings = JSON.parse(
      await readFile(join(tmp.path, '.claude', 'settings.json'), 'utf-8'),
    );
    expect(settings.hooks?.Stop).toBeDefined();
  });
});
