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
    expect(content).toContain('haiku');
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

  it('generates exactly 3 command files', async () => {
    await writeCommands(makeContext(), tmp.path);
    const entries = await readdir(join(tmp.path, '.claude', 'commands'));
    expect(entries.sort()).toEqual([
      'add-feature.md',
      'analyze.md',
      'start-team.md',
    ]);
  });
});
