import { writeCommands } from '../../src/claude-setup/commands-writer.js';
import { makeTestContext } from '../helpers/context-factory.js';
import { useTempDir } from '../helpers/temp-dir.js';
import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';

function makeContext(overrides: Partial<Parameters<typeof makeTestContext>[0]> = {}) {
  return makeTestContext({
    claude: { enabled: true, agentTeams: true },
    ...overrides,
  });
}

// ─── P11-006: start-team.md command generation ─────────────────────────────

describe('P11-006: start-team command', () => {
  const tmp = useTempDir('commands-start-team-');

  it('generates start-team.md in .claude/commands/', async () => {
    await writeCommands(makeContext(), tmp.path);
    const entries = await readdir(join(tmp.path, '.claude', 'commands'));
    expect(entries).toContain('start-team.md');
  });

  it('start-team.md reads prd.json for sprint planning', async () => {
    await writeCommands(makeContext(), tmp.path);
    const content = await readFile(join(tmp.path, '.claude', 'commands', 'start-team.md'), 'utf-8');
    expect(content).toContain('prd.json');
  });

  it('start-team.md includes pre-flight checks', async () => {
    await writeCommands(makeContext(), tmp.path);
    const content = await readFile(join(tmp.path, '.claude', 'commands', 'start-team.md'), 'utf-8');
    expect(content).toContain('git');
    expect(content).toContain('flutter analyze');
    expect(content).toContain('flutter test');
  });

  it('start-team.md spawns 4 agents with models', async () => {
    await writeCommands(makeContext(), tmp.path);
    const content = await readFile(join(tmp.path, '.claude', 'commands', 'start-team.md'), 'utf-8');
    expect(content.toLowerCase()).toContain('architect');
    expect(content.toLowerCase()).toContain('builder');
    expect(content.toLowerCase()).toContain('tester');
    expect(content.toLowerCase()).toContain('reviewer');
    expect(content).toContain('opus');
    expect(content).toContain('sonnet');
  });

  it('start-team.md describes TDD flow orchestration', async () => {
    await writeCommands(makeContext(), tmp.path);
    const content = await readFile(join(tmp.path, '.claude', 'commands', 'start-team.md'), 'utf-8');
    expect(content).toContain('TDD');
  });

  it('start-team.md includes commit and push protocol', async () => {
    await writeCommands(makeContext(), tmp.path);
    const content = await readFile(join(tmp.path, '.claude', 'commands', 'start-team.md'), 'utf-8');
    expect(content.toLowerCase()).toContain('commit');
    expect(content.toLowerCase()).toContain('push');
  });

  it('start-team.md uses TeamCreate for team orchestration', async () => {
    await writeCommands(makeContext(), tmp.path);
    const content = await readFile(join(tmp.path, '.claude', 'commands', 'start-team.md'), 'utf-8');
    expect(content).toContain('flutter-sprint');
  });
});

// ─── P11-006: updated command file count ────────────────────────────────────

describe('P11-006: updated command file count', () => {
  const tmp = useTempDir('commands-count-');

  it('generates 6 command files when agentTeams is true', async () => {
    await writeCommands(makeContext(), tmp.path);
    const entries = await readdir(join(tmp.path, '.claude', 'commands'));
    expect(entries.sort()).toEqual([
      'add-feature.md',
      'analyze.md',
      'plan.md',
      'specify.md',
      'start-team.md',
      'tasks.md',
    ]);
  });
});

// ─── P12-013: SDD commands when agentTeams=true ─────────────────────────────

describe('P12-013: SDD commands when agentTeams=true', () => {
  const tmp = useTempDir('commands-sdd-');

  it('specify.md has model: opus frontmatter', async () => {
    await writeCommands(makeContext(), tmp.path);
    const content = await readFile(join(tmp.path, '.claude', 'commands', 'specify.md'), 'utf-8');
    expect(content).toMatch(/^---\s*\nmodel:\s*opus\s*\n---/);
  });

  it('plan.md has model: opus frontmatter and references specs/', async () => {
    await writeCommands(makeContext(), tmp.path);
    const content = await readFile(join(tmp.path, '.claude', 'commands', 'plan.md'), 'utf-8');
    expect(content).toMatch(/^---\s*\nmodel:\s*opus\s*\n---/);
    expect(content).toContain('specs/');
  });

  it('tasks.md has model: sonnet frontmatter and references prd.json', async () => {
    await writeCommands(makeContext(), tmp.path);
    const content = await readFile(join(tmp.path, '.claude', 'commands', 'tasks.md'), 'utf-8');
    expect(content).toMatch(/^---\s*\nmodel:\s*sonnet\s*\n---/);
    expect(content).toContain('prd.json');
  });

  it('specify.md contains interview steps', async () => {
    await writeCommands(makeContext(), tmp.path);
    const content = await readFile(join(tmp.path, '.claude', 'commands', 'specify.md'), 'utf-8');
    expect(content).toContain('Interview');
    expect(content).toContain('Problem Statement');
    expect(content).toContain('Scope Definition');
    expect(content).toContain('Edge Cases');
  });

  it('plan.md contains Clean Architecture phases', async () => {
    await writeCommands(makeContext(), tmp.path);
    const content = await readFile(join(tmp.path, '.claude', 'commands', 'plan.md'), 'utf-8');
    expect(content).toContain('Domain Layer');
    expect(content).toContain('Data Layer');
    expect(content).toContain('Presentation Layer');
    expect(content).toContain('Clean Architecture');
  });
});

// ─── P12-013: commands without agentTeams ────────────────────────────────────

describe('P12-013: commands without agentTeams', () => {
  const tmp = useTempDir('commands-no-agents-');

  it('generates only 3 commands when agentTeams is false', async () => {
    const ctx = makeContext({ claude: { enabled: true, agentTeams: false } });
    await writeCommands(ctx, tmp.path);
    const entries = await readdir(join(tmp.path, '.claude', 'commands'));
    expect(entries.sort()).toEqual([
      'add-feature.md',
      'analyze.md',
      'start-team.md',
    ]);
  });

  it('does not generate specify, plan, or tasks commands when agentTeams is false', async () => {
    const ctx = makeContext({ claude: { enabled: true, agentTeams: false } });
    await writeCommands(ctx, tmp.path);
    const entries = await readdir(join(tmp.path, '.claude', 'commands'));
    expect(entries).not.toContain('specify.md');
    expect(entries).not.toContain('plan.md');
    expect(entries).not.toContain('tasks.md');
  });
});

// ─── P12-013: enhanced start-team command ────────────────────────────────────

describe('P12-013: enhanced start-team command', () => {
  const tmp = useTempDir('commands-start-team-enhanced-');

  it('start-team.md has File Ownership column in agent table', async () => {
    await writeCommands(makeContext(), tmp.path);
    const content = await readFile(join(tmp.path, '.claude', 'commands', 'start-team.md'), 'utf-8');
    expect(content).toContain('File Ownership');
  });

  it('start-team.md has Error Recovery Protocol with 4-tier escalation', async () => {
    await writeCommands(makeContext(), tmp.path);
    const content = await readFile(join(tmp.path, '.claude', 'commands', 'start-team.md'), 'utf-8');
    expect(content).toContain('Error Recovery Protocol');
    expect(content).toContain('Self-Correction');
    expect(content).toContain('AI-to-AI');
    expect(content).toContain('Human-Augmented');
    expect(content).toContain('Full Handoff');
  });

  it('start-team.md has SDD Pipeline section when agentTeams is true', async () => {
    await writeCommands(makeContext(), tmp.path);
    const content = await readFile(join(tmp.path, '.claude', 'commands', 'start-team.md'), 'utf-8');
    expect(content).toContain('SDD Pipeline');
    expect(content).toContain('/specify');
    expect(content).toContain('/plan');
    expect(content).toContain('/tasks');
  });
});
