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

// ─── Proactive frontmatter: exact field values ────────────────────────────

describe('proactive skills: frontmatter field values', () => {
  const tmp = useTempDir('skill-frontmatter-values-');

  it('security-review.md has user-invocable: true', async () => {
    await writeSkills(makeContext(), tmp.path);
    const content = await readFile(join(tmp.path, '.claude', 'skills', 'security-review.md'), 'utf-8');
    expect(content).toContain('user-invocable: true');
  });

  it('performance-check.md has user-invocable: true', async () => {
    await writeSkills(makeContext(), tmp.path);
    const content = await readFile(join(tmp.path, '.claude', 'skills', 'performance-check.md'), 'utf-8');
    expect(content).toContain('user-invocable: true');
  });

  it('quality-gate.md has user-invocable: true', async () => {
    await writeSkills(makeContext(), tmp.path);
    const content = await readFile(join(tmp.path, '.claude', 'skills', 'quality-gate.md'), 'utf-8');
    expect(content).toContain('user-invocable: true');
  });

  it('security-review.md uses sonnet model', async () => {
    await writeSkills(makeContext(), tmp.path);
    const content = await readFile(join(tmp.path, '.claude', 'skills', 'security-review.md'), 'utf-8');
    expect(content).toContain('model: sonnet');
  });

  it('performance-check.md uses haiku model', async () => {
    await writeSkills(makeContext(), tmp.path);
    const content = await readFile(join(tmp.path, '.claude', 'skills', 'performance-check.md'), 'utf-8');
    expect(content).toContain('model: haiku');
  });

  it('quality-gate.md uses sonnet model', async () => {
    await writeSkills(makeContext(), tmp.path);
    const content = await readFile(join(tmp.path, '.claude', 'skills', 'quality-gate.md'), 'utf-8');
    expect(content).toContain('model: sonnet');
  });

  it('all 3 proactive skill files open with --- on the first line', async () => {
    await writeSkills(makeContext(), tmp.path);
    for (const file of ['security-review.md', 'performance-check.md', 'quality-gate.md']) {
      const content = await readFile(join(tmp.path, '.claude', 'skills', file), 'utf-8');
      expect(content.startsWith('---\n')).toBe(true);
    }
  });

  it('all 3 proactive skill files have a description: field in frontmatter', async () => {
    await writeSkills(makeContext(), tmp.path);
    for (const file of ['security-review.md', 'performance-check.md', 'quality-gate.md']) {
      const content = await readFile(join(tmp.path, '.claude', 'skills', file), 'utf-8');
      expect(content).toContain('description:');
    }
  });
});

// ─── Specific trigger phrases ─────────────────────────────────────────────

describe('proactive skills: specific trigger phrases', () => {
  const tmp = useTempDir('skill-trigger-phrases-');

  it('security-review.md triggers on "security review"', async () => {
    await writeSkills(makeContext(), tmp.path);
    const content = await readFile(join(tmp.path, '.claude', 'skills', 'security-review.md'), 'utf-8');
    expect(content.toLowerCase()).toContain('security review');
  });

  it('security-review.md triggers on "vulnerabilities"', async () => {
    await writeSkills(makeContext(), tmp.path);
    const content = await readFile(join(tmp.path, '.claude', 'skills', 'security-review.md'), 'utf-8');
    expect(content.toLowerCase()).toContain('vulnerabilit');
  });

  it('performance-check.md triggers on "performance check"', async () => {
    await writeSkills(makeContext(), tmp.path);
    const content = await readFile(join(tmp.path, '.claude', 'skills', 'performance-check.md'), 'utf-8');
    expect(content.toLowerCase()).toContain('performance check');
  });

  it('performance-check.md triggers on "optimize"', async () => {
    await writeSkills(makeContext(), tmp.path);
    const content = await readFile(join(tmp.path, '.claude', 'skills', 'performance-check.md'), 'utf-8');
    expect(content.toLowerCase()).toContain('optim');
  });

  it('quality-gate.md triggers on "quality gate"', async () => {
    await writeSkills(makeContext(), tmp.path);
    const content = await readFile(join(tmp.path, '.claude', 'skills', 'quality-gate.md'), 'utf-8');
    expect(content.toLowerCase()).toContain('quality gate');
  });

  it('quality-gate.md triggers on "run quality checks"', async () => {
    await writeSkills(makeContext(), tmp.path);
    const content = await readFile(join(tmp.path, '.claude', 'skills', 'quality-gate.md'), 'utf-8');
    expect(content.toLowerCase()).toContain('quality check');
  });
});

// ─── quality-gate.md content completeness ────────────────────────────────

describe('quality-gate.md: step content completeness', () => {
  const tmp = useTempDir('skill-quality-gate-content-');

  async function getContent(): Promise<string> {
    await writeSkills(makeContext(), tmp.path);
    return readFile(join(tmp.path, '.claude', 'skills', 'quality-gate.md'), 'utf-8');
  }

  it('includes dart format step', async () => {
    const content = await getContent();
    expect(content).toContain('dart format');
  });

  it('dart format step uses --set-exit-if-changed flag', async () => {
    const content = await getContent();
    expect(content).toContain('--set-exit-if-changed');
  });

  it('includes flutter test --coverage step', async () => {
    const content = await getContent();
    expect(content).toContain('flutter test --coverage');
  });

  it('mentions 80% coverage target', async () => {
    const content = await getContent();
    expect(content).toContain('80%');
  });

  it('has numbered steps (Step 1 through Step 5)', async () => {
    const content = await getContent();
    expect(content).toContain('Step 1');
    expect(content).toContain('Step 5');
  });

  it('includes a summary/report section at the end', async () => {
    const content = await getContent();
    const lower = content.toLowerCase();
    expect(lower.includes('summary') || lower.includes('report')).toBe(true);
  });
});

// ─── Non-proactive skills: no user-invocable frontmatter ─────────────────

describe('non-proactive skills: no user-invocable frontmatter', () => {
  const tmp = useTempDir('skill-no-frontmatter-');

  it('flutter-patterns.md has no user-invocable field', async () => {
    await writeSkills(makeContext(), tmp.path);
    const content = await readFile(join(tmp.path, '.claude', 'skills', 'flutter-patterns.md'), 'utf-8');
    expect(content).not.toContain('user-invocable');
  });

  it('module-conventions.md has no user-invocable field', async () => {
    await writeSkills(makeContext(), tmp.path);
    const content = await readFile(join(tmp.path, '.claude', 'skills', 'module-conventions.md'), 'utf-8');
    expect(content).not.toContain('user-invocable');
  });

  it('prd.md has no user-invocable field', async () => {
    await writeSkills(makeContext(), tmp.path);
    const content = await readFile(join(tmp.path, '.claude', 'skills', 'prd.md'), 'utf-8');
    expect(content).not.toContain('user-invocable');
  });

  it('add-feature.md has no user-invocable field (model only)', async () => {
    await writeSkills(makeContext(), tmp.path);
    const content = await readFile(join(tmp.path, '.claude', 'skills', 'add-feature.md'), 'utf-8');
    expect(content).not.toContain('user-invocable');
    expect(content).toContain('model: sonnet');
  });
});

// ─── Context-conditional skill content ───────────────────────────────────

describe('go-router-patterns.md: context-conditional content', () => {
  const tmp = useTempDir('skill-router-context-');

  it('includes auth guard section when auth module is enabled', async () => {
    const ctx = makeContext({ modules: { ...makeContext().modules, auth: { provider: 'firebase' } } });
    await writeSkills(ctx, tmp.path);
    const content = await readFile(join(tmp.path, '.claude', 'skills', 'go-router-patterns.md'), 'utf-8');
    expect(content).toContain('Auth Guard');
  });

  it('omits auth guard section when auth module is disabled', async () => {
    await writeSkills(makeContext(), tmp.path);
    const content = await readFile(join(tmp.path, '.claude', 'skills', 'go-router-patterns.md'), 'utf-8');
    expect(content).not.toContain('Auth Guard');
  });

  it('includes deep linking section when deepLinking module is enabled', async () => {
    const ctx = makeContext({
      modules: { ...makeContext().modules, deepLinking: { scheme: 'myapp', host: 'example.com' } },
    });
    await writeSkills(ctx, tmp.path);
    const content = await readFile(join(tmp.path, '.claude', 'skills', 'go-router-patterns.md'), 'utf-8');
    expect(content).toContain('Deep Linking');
  });

  it('omits deep linking section when deepLinking module is disabled', async () => {
    await writeSkills(makeContext(), tmp.path);
    const content = await readFile(join(tmp.path, '.claude', 'skills', 'go-router-patterns.md'), 'utf-8');
    expect(content).not.toContain('Deep Linking Integration');
  });
});

describe('add-feature.md: context-conditional auth guard step', () => {
  const tmp = useTempDir('skill-add-feature-context-');

  it('includes route guard step when auth module is enabled', async () => {
    const ctx = makeContext({ modules: { ...makeContext().modules, auth: { provider: 'firebase' } } });
    await writeSkills(ctx, tmp.path);
    const content = await readFile(join(tmp.path, '.claude', 'skills', 'add-feature.md'), 'utf-8');
    expect(content).toContain('Route Guard');
  });

  it('omits route guard step when auth module is disabled', async () => {
    await writeSkills(makeContext(), tmp.path);
    const content = await readFile(join(tmp.path, '.claude', 'skills', 'add-feature.md'), 'utf-8');
    expect(content).not.toContain('Route Guard');
  });
});

// ─── writeSkills idempotency ──────────────────────────────────────────────

describe('writeSkills: idempotency', () => {
  const tmp = useTempDir('skill-idempotent-');

  it('can be called twice without throwing', async () => {
    const ctx = makeContext();
    await writeSkills(ctx, tmp.path);
    await expect(writeSkills(ctx, tmp.path)).resolves.not.toThrow();
  });

  it('second call still produces exactly 8 skill files', async () => {
    const ctx = makeContext();
    await writeSkills(ctx, tmp.path);
    await writeSkills(ctx, tmp.path);
    const entries = await readdir(join(tmp.path, '.claude', 'skills'));
    expect(entries).toHaveLength(8);
  });
});
