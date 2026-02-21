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

  it('security-review contains description with trigger phrases', async () => {
    await writeSkills(makeContext(), tmp.path);
    const content = await readFile(join(tmp.path, '.claude', 'skills', 'security-review', 'SKILL.md'), 'utf-8');
    expect(content.toLowerCase()).toContain('trigger');
  });

  it('security-review frontmatter contains user-invocable field', async () => {
    await writeSkills(makeContext(), tmp.path);
    const content = await readFile(join(tmp.path, '.claude', 'skills', 'security-review', 'SKILL.md'), 'utf-8');
    expect(content).toContain('user-invocable');
  });
});

// ─── P11-005: proactive performance-check skill ─────────────────────────────

describe('P11-005: performance-check proactive activation', () => {
  const tmp = useTempDir('skill-perf-proactive-');

  it('performance-check contains description with trigger phrases', async () => {
    await writeSkills(makeContext(), tmp.path);
    const content = await readFile(join(tmp.path, '.claude', 'skills', 'performance-check', 'SKILL.md'), 'utf-8');
    expect(content.toLowerCase()).toContain('trigger');
  });

  it('performance-check frontmatter contains user-invocable field', async () => {
    await writeSkills(makeContext(), tmp.path);
    const content = await readFile(join(tmp.path, '.claude', 'skills', 'performance-check', 'SKILL.md'), 'utf-8');
    expect(content).toContain('user-invocable');
  });
});

// ─── P11-005: new quality-gate skill ────────────────────────────────────────

describe('P11-005: quality-gate skill', () => {
  const tmp = useTempDir('skill-quality-gate-');

  it('generates quality-gate in .claude/skills/', async () => {
    await writeSkills(makeContext(), tmp.path);
    const entries = await readdir(join(tmp.path, '.claude', 'skills'));
    expect(entries).toContain('quality-gate');
  });

  it('quality-gate mentions flutter analyze', async () => {
    await writeSkills(makeContext(), tmp.path);
    const content = await readFile(join(tmp.path, '.claude', 'skills', 'quality-gate', 'SKILL.md'), 'utf-8');
    expect(content).toContain('flutter analyze');
  });

  it('quality-gate mentions flutter test', async () => {
    await writeSkills(makeContext(), tmp.path);
    const content = await readFile(join(tmp.path, '.claude', 'skills', 'quality-gate', 'SKILL.md'), 'utf-8');
    expect(content).toContain('flutter test');
  });

  it('quality-gate mentions coverage', async () => {
    await writeSkills(makeContext(), tmp.path);
    const content = await readFile(join(tmp.path, '.claude', 'skills', 'quality-gate', 'SKILL.md'), 'utf-8');
    expect(content.toLowerCase()).toContain('coverage');
  });

  it('quality-gate has user-invocable frontmatter', async () => {
    await writeSkills(makeContext(), tmp.path);
    const content = await readFile(join(tmp.path, '.claude', 'skills', 'quality-gate', 'SKILL.md'), 'utf-8');
    expect(content).toContain('user-invocable');
  });

  it('quality-gate has description with trigger phrases', async () => {
    await writeSkills(makeContext(), tmp.path);
    const content = await readFile(join(tmp.path, '.claude', 'skills', 'quality-gate', 'SKILL.md'), 'utf-8');
    expect(content.toLowerCase()).toContain('trigger');
  });
});

// ─── P12-012: error-recovery skill ───────────────────────────────────────────

describe('P12-012: error-recovery skill', () => {
  const tmp = useTempDir('skill-error-recovery-');

  it('generates error-recovery in .claude/skills/', async () => {
    await writeSkills(makeContext(), tmp.path);
    const entries = await readdir(join(tmp.path, '.claude', 'skills'));
    expect(entries).toContain('error-recovery');
  });

  it('error-recovery has user-invocable: true in frontmatter', async () => {
    await writeSkills(makeContext(), tmp.path);
    const content = await readFile(join(tmp.path, '.claude', 'skills', 'error-recovery', 'SKILL.md'), 'utf-8');
    expect(content).toContain('user-invocable: true');
  });

  it('error-recovery contains Self-Correction tier', async () => {
    await writeSkills(makeContext(), tmp.path);
    const content = await readFile(join(tmp.path, '.claude', 'skills', 'error-recovery', 'SKILL.md'), 'utf-8');
    expect(content).toContain('Self-Correction');
  });

  it('error-recovery contains Full Human Takeover tier', async () => {
    await writeSkills(makeContext(), tmp.path);
    const content = await readFile(join(tmp.path, '.claude', 'skills', 'error-recovery', 'SKILL.md'), 'utf-8');
    expect(content).toContain('Full Human');
  });

  it('error-recovery uses sonnet model', async () => {
    await writeSkills(makeContext(), tmp.path);
    const content = await readFile(join(tmp.path, '.claude', 'skills', 'error-recovery', 'SKILL.md'), 'utf-8');
    expect(content).toContain('model: sonnet');
  });

  it('error-recovery contains flutter analyze command', async () => {
    await writeSkills(makeContext(), tmp.path);
    const content = await readFile(join(tmp.path, '.claude', 'skills', 'error-recovery', 'SKILL.md'), 'utf-8');
    expect(content).toContain('flutter analyze');
  });
});

// ─── P12-012: debug-workflow skill ───────────────────────────────────────────

describe('P12-012: debug-workflow skill', () => {
  const tmp = useTempDir('skill-debug-workflow-');

  it('generates debug-workflow in .claude/skills/', async () => {
    await writeSkills(makeContext(), tmp.path);
    const entries = await readdir(join(tmp.path, '.claude', 'skills'));
    expect(entries).toContain('debug-workflow');
  });

  it('debug-workflow has user-invocable: true in frontmatter', async () => {
    await writeSkills(makeContext(), tmp.path);
    const content = await readFile(join(tmp.path, '.claude', 'skills', 'debug-workflow', 'SKILL.md'), 'utf-8');
    expect(content).toContain('user-invocable: true');
  });

  it('debug-workflow contains Reproduce step', async () => {
    await writeSkills(makeContext(), tmp.path);
    const content = await readFile(join(tmp.path, '.claude', 'skills', 'debug-workflow', 'SKILL.md'), 'utf-8');
    expect(content).toContain('Reproduce');
  });

  it('debug-workflow contains Verify step', async () => {
    await writeSkills(makeContext(), tmp.path);
    const content = await readFile(join(tmp.path, '.claude', 'skills', 'debug-workflow', 'SKILL.md'), 'utf-8');
    expect(content).toContain('Verify');
  });

  it('debug-workflow contains flutter test command', async () => {
    await writeSkills(makeContext(), tmp.path);
    const content = await readFile(join(tmp.path, '.claude', 'skills', 'debug-workflow', 'SKILL.md'), 'utf-8');
    expect(content).toContain('flutter test');
  });

  it('debug-workflow uses sonnet model', async () => {
    await writeSkills(makeContext(), tmp.path);
    const content = await readFile(join(tmp.path, '.claude', 'skills', 'debug-workflow', 'SKILL.md'), 'utf-8');
    expect(content).toContain('model: sonnet');
  });

  it('debug-workflow contains Flutter DevTools section', async () => {
    await writeSkills(makeContext(), tmp.path);
    const content = await readFile(join(tmp.path, '.claude', 'skills', 'debug-workflow', 'SKILL.md'), 'utf-8');
    expect(content).toContain('Flutter DevTools');
  });
});

// ─── P12-011: SDD skills ─────────────────────────────────────────────────────

describe('P12-011: sdd-workflow skill', () => {
  const tmp = useTempDir('skill-sdd-workflow-');

  it('generates sdd-workflow in .claude/skills/', async () => {
    await writeSkills(makeContext(), tmp.path);
    const entries = await readdir(join(tmp.path, '.claude', 'skills'));
    expect(entries).toContain('sdd-workflow');
  });

  it('sdd-workflow has user-invocable: true', async () => {
    await writeSkills(makeContext(), tmp.path);
    const content = await readFile(join(tmp.path, '.claude', 'skills', 'sdd-workflow', 'SKILL.md'), 'utf-8');
    expect(content).toContain('user-invocable: true');
  });

  it('sdd-workflow uses sonnet model', async () => {
    await writeSkills(makeContext(), tmp.path);
    const content = await readFile(join(tmp.path, '.claude', 'skills', 'sdd-workflow', 'SKILL.md'), 'utf-8');
    expect(content).toContain('model: sonnet');
  });

  it('sdd-workflow contains SDD pipeline explanation', async () => {
    await writeSkills(makeContext(), tmp.path);
    const content = await readFile(join(tmp.path, '.claude', 'skills', 'sdd-workflow', 'SKILL.md'), 'utf-8');
    expect(content).toContain('Specify');
    expect(content).toContain('Plan');
    expect(content).toContain('Implement');
  });
});

describe('P12-011: spec-template skill', () => {
  const tmp = useTempDir('skill-spec-template-');

  it('generates spec-template in .claude/skills/', async () => {
    await writeSkills(makeContext(), tmp.path);
    const entries = await readdir(join(tmp.path, '.claude', 'skills'));
    expect(entries).toContain('spec-template');
  });

  it('spec-template has user-invocable: false (reference only)', async () => {
    await writeSkills(makeContext(), tmp.path);
    const content = await readFile(join(tmp.path, '.claude', 'skills', 'spec-template', 'SKILL.md'), 'utf-8');
    expect(content).toContain('user-invocable: false');
  });

  it('spec-template mentions freezed entities', async () => {
    await writeSkills(makeContext(), tmp.path);
    const content = await readFile(join(tmp.path, '.claude', 'skills', 'spec-template', 'SKILL.md'), 'utf-8');
    expect(content.toLowerCase()).toContain('freezed');
  });

  it('spec-template mentions acceptance criteria', async () => {
    await writeSkills(makeContext(), tmp.path);
    const content = await readFile(join(tmp.path, '.claude', 'skills', 'spec-template', 'SKILL.md'), 'utf-8');
    expect(content.toLowerCase()).toContain('acceptance criteria');
  });

  it('spec-template includes API section when api module enabled', async () => {
    const ctx = makeContext({ modules: { ...makeContext().modules, api: { baseUrl: 'https://api.test.com' } } });
    await writeSkills(ctx, tmp.path);
    const content = await readFile(join(tmp.path, '.claude', 'skills', 'spec-template', 'SKILL.md'), 'utf-8');
    expect(content).toContain('API');
  });

  it('spec-template includes auth section when auth module enabled', async () => {
    const ctx = makeContext({ modules: { ...makeContext().modules, auth: { provider: 'firebase' } } });
    await writeSkills(ctx, tmp.path);
    const content = await readFile(join(tmp.path, '.claude', 'skills', 'spec-template', 'SKILL.md'), 'utf-8');
    expect(content.toLowerCase()).toContain('auth');
  });
});

describe('P12-011: plan-template skill', () => {
  const tmp = useTempDir('skill-plan-template-');

  it('generates plan-template in .claude/skills/', async () => {
    await writeSkills(makeContext(), tmp.path);
    const entries = await readdir(join(tmp.path, '.claude', 'skills'));
    expect(entries).toContain('plan-template');
  });

  it('plan-template has user-invocable: false (reference only)', async () => {
    await writeSkills(makeContext(), tmp.path);
    const content = await readFile(join(tmp.path, '.claude', 'skills', 'plan-template', 'SKILL.md'), 'utf-8');
    expect(content).toContain('user-invocable: false');
  });

  it('plan-template mentions phased implementation', async () => {
    await writeSkills(makeContext(), tmp.path);
    const content = await readFile(join(tmp.path, '.claude', 'skills', 'plan-template', 'SKILL.md'), 'utf-8');
    expect(content.toLowerCase()).toContain('phase');
  });

  it('plan-template mentions complexity', async () => {
    await writeSkills(makeContext(), tmp.path);
    const content = await readFile(join(tmp.path, '.claude', 'skills', 'plan-template', 'SKILL.md'), 'utf-8');
    expect(content.toLowerCase()).toContain('complexity');
  });
});

// ─── P12-011: updated skill file count ──────────────────────────────────────

describe('P12-011: updated skill file count', () => {
  const tmp = useTempDir('skill-count-');

  it('generates exactly 13 skill directories', async () => {
    await writeSkills(makeContext(), tmp.path);
    const entries = await readdir(join(tmp.path, '.claude', 'skills'));
    expect(entries.sort()).toEqual([
      'add-feature',
      'debug-workflow',
      'error-recovery',
      'flutter-patterns',
      'go-router-patterns',
      'module-conventions',
      'performance-check',
      'plan-template',
      'prd',
      'quality-gate',
      'sdd-workflow',
      'security-review',
      'spec-template',
    ]);
  });
});
