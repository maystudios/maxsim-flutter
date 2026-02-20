import { writeSkills } from '../../src/claude-setup/skill-writer.js';
import { makeTestContext } from '../helpers/context-factory.js';
import { useTempDir } from '../helpers/temp-dir.js';
import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';

function makeContext(overrides: Partial<Parameters<typeof makeTestContext>[0]> = {}) {
  return makeTestContext({
    claude: { enabled: true, agentTeams: false },
    ...overrides,
  });
}

// ─── P11-005: proactive security-review skill ───────────────────────────────

describe('P11-005: security-review proactive activation', () => {
  const tmp = useTempDir('skill-security-proactive-');

  it('security-review.md contains description with trigger phrases', async () => {
    await writeSkills(makeContext(), tmp.path);
    const content = await readFile(join(tmp.path, '.claude', 'skills', 'security-review.md'), 'utf-8');
    expect(content.toLowerCase()).toContain('trigger');
  });

  it('security-review.md frontmatter contains user-invocable field', async () => {
    await writeSkills(makeContext(), tmp.path);
    const content = await readFile(join(tmp.path, '.claude', 'skills', 'security-review.md'), 'utf-8');
    expect(content).toContain('user-invocable');
  });
});

// ─── P11-005: proactive performance-check skill ─────────────────────────────

describe('P11-005: performance-check proactive activation', () => {
  const tmp = useTempDir('skill-perf-proactive-');

  it('performance-check.md contains description with trigger phrases', async () => {
    await writeSkills(makeContext(), tmp.path);
    const content = await readFile(join(tmp.path, '.claude', 'skills', 'performance-check.md'), 'utf-8');
    expect(content.toLowerCase()).toContain('trigger');
  });

  it('performance-check.md frontmatter contains user-invocable field', async () => {
    await writeSkills(makeContext(), tmp.path);
    const content = await readFile(join(tmp.path, '.claude', 'skills', 'performance-check.md'), 'utf-8');
    expect(content).toContain('user-invocable');
  });
});

// ─── P11-005: new quality-gate skill ────────────────────────────────────────

describe('P11-005: quality-gate skill', () => {
  const tmp = useTempDir('skill-quality-gate-');

  it('generates quality-gate.md in .claude/skills/', async () => {
    await writeSkills(makeContext(), tmp.path);
    const entries = await readdir(join(tmp.path, '.claude', 'skills'));
    expect(entries).toContain('quality-gate.md');
  });

  it('quality-gate.md mentions flutter analyze', async () => {
    await writeSkills(makeContext(), tmp.path);
    const content = await readFile(join(tmp.path, '.claude', 'skills', 'quality-gate.md'), 'utf-8');
    expect(content).toContain('flutter analyze');
  });

  it('quality-gate.md mentions flutter test', async () => {
    await writeSkills(makeContext(), tmp.path);
    const content = await readFile(join(tmp.path, '.claude', 'skills', 'quality-gate.md'), 'utf-8');
    expect(content).toContain('flutter test');
  });

  it('quality-gate.md mentions coverage', async () => {
    await writeSkills(makeContext(), tmp.path);
    const content = await readFile(join(tmp.path, '.claude', 'skills', 'quality-gate.md'), 'utf-8');
    expect(content.toLowerCase()).toContain('coverage');
  });

  it('quality-gate.md has user-invocable frontmatter', async () => {
    await writeSkills(makeContext(), tmp.path);
    const content = await readFile(join(tmp.path, '.claude', 'skills', 'quality-gate.md'), 'utf-8');
    expect(content).toContain('user-invocable');
  });

  it('quality-gate.md has description with trigger phrases', async () => {
    await writeSkills(makeContext(), tmp.path);
    const content = await readFile(join(tmp.path, '.claude', 'skills', 'quality-gate.md'), 'utf-8');
    expect(content.toLowerCase()).toContain('trigger');
  });
});

// ─── P11-005: updated skill file count ──────────────────────────────────────

describe('P11-005: updated skill file count', () => {
  const tmp = useTempDir('skill-count-');

  it('generates exactly 8 skill files', async () => {
    await writeSkills(makeContext(), tmp.path);
    const entries = await readdir(join(tmp.path, '.claude', 'skills'));
    expect(entries.sort()).toEqual([
      'add-feature.md',
      'flutter-patterns.md',
      'go-router-patterns.md',
      'module-conventions.md',
      'performance-check.md',
      'prd.md',
      'quality-gate.md',
      'security-review.md',
    ]);
  });
});
