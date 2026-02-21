import { writeRules } from '../../src/claude-setup/rules-writer.js';
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

// ─── git-workflow.md content completeness ─────────────────────────────────

describe('git-workflow.md: content completeness', () => {
  const tmp = useTempDir('rules-git-workflow-edge-');

  async function getContent(): Promise<string> {
    await writeRules(makeContext(), tmp.path);
    return readFile(join(tmp.path, '.claude', 'rules', 'git-workflow.md'), 'utf-8');
  }

  it('prohibits --no-verify flag', async () => {
    const content = await getContent();
    expect(content).toContain('--no-verify');
  });

  it('prohibits force-push to main', async () => {
    const content = await getContent();
    const lower = content.toLowerCase();
    expect(lower.includes('force-push') || lower.includes('force push')).toBe(true);
  });

  it('requires always pushing to remote after committing', async () => {
    const content = await getContent();
    const lower = content.toLowerCase();
    expect(lower.includes('always push') || lower.includes('push to remote')).toBe(true);
  });

  it('includes feature/ branch naming pattern', async () => {
    const content = await getContent();
    expect(content).toContain('feature/');
  });

  it('includes fix/ branch naming pattern', async () => {
    const content = await getContent();
    expect(content).toContain('fix/');
  });

  it('includes refactor commit type', async () => {
    const content = await getContent();
    expect(content).toContain('refactor');
  });

  it('includes test commit type', async () => {
    const content = await getContent();
    expect(content).toContain('test:');
  });
});

// ─── code-quality.md content completeness ────────────────────────────────

describe('code-quality.md: content completeness', () => {
  const tmp = useTempDir('rules-code-quality-edge-');

  async function getContent(): Promise<string> {
    await writeRules(makeContext(), tmp.path);
    return readFile(join(tmp.path, '.claude', 'rules', 'code-quality.md'), 'utf-8');
  }

  it('mentions flutter test', async () => {
    const content = await getContent();
    expect(content).toContain('flutter test');
  });

  it('mentions 80% coverage threshold', async () => {
    const content = await getContent();
    expect(content).toContain('80%');
  });

  it('prohibits print() in production code', async () => {
    const content = await getContent();
    expect(content).toContain('print()');
  });

  it('warns against dynamic types', async () => {
    const content = await getContent();
    expect(content).toContain('dynamic');
  });

  it('mentions unused imports or dead code', async () => {
    const content = await getContent();
    const lower = content.toLowerCase();
    expect(lower.includes('unused') || lower.includes('dead code')).toBe(true);
  });
});

// ─── testing.md content completeness ──────────────────────────────────────

describe('testing.md: content completeness', () => {
  const tmp = useTempDir('rules-testing-edge-');

  async function getContent(): Promise<string> {
    await writeRules(makeContext(), tmp.path);
    return readFile(join(tmp.path, '.claude', 'rules', 'testing.md'), 'utf-8');
  }

  it('mentions mocktail or mockito for mocking', async () => {
    const content = await getContent();
    expect(content.toLowerCase().includes('mocktail') || content.toLowerCase().includes('mockito')).toBe(true);
  });

  it('mentions 80% coverage target', async () => {
    const content = await getContent();
    expect(content).toContain('80%');
  });

  it('frontmatter paths scoped to test/**', async () => {
    const content = await getContent();
    expect(content).toContain('"test/**"');
  });
});

// ─── security.md content completeness ────────────────────────────────────

describe('security.md: content completeness', () => {
  const tmp = useTempDir('rules-security-edge-');

  async function getContent(): Promise<string> {
    await writeRules(makeContext(), tmp.path);
    return readFile(join(tmp.path, '.claude', 'rules', 'security.md'), 'utf-8');
  }

  it('mentions flutter_secure_storage', async () => {
    const content = await getContent();
    expect(content).toContain('flutter_secure_storage');
  });

  it('requires HTTPS for all network requests', async () => {
    const content = await getContent();
    expect(content).toContain('HTTPS');
  });

  it('prohibits hardcoding secrets or API keys', async () => {
    const content = await getContent();
    const lower = content.toLowerCase();
    expect(lower.includes('secret') || lower.includes('api key') || lower.includes('hardcode')).toBe(true);
  });

  it('mentions PII protection (no logging sensitive data)', async () => {
    const content = await getContent();
    expect(content).toContain('PII');
  });

  it('frontmatter paths covers all files (**)', async () => {
    const content = await getContent();
    expect(content).toContain('"**"');
  });
});

// ─── Frontmatter exact structure ──────────────────────────────────────────

describe('frontmatter: exact YAML structure', () => {
  const tmp = useTempDir('rules-frontmatter-structure-');

  it('architecture.md frontmatter has exact paths: lib/** and test/**', async () => {
    await writeRules(makeContext(), tmp.path);
    const content = await readFile(join(tmp.path, '.claude', 'rules', 'architecture.md'), 'utf-8');
    expect(content).toContain('"lib/**"');
    expect(content).toContain('"test/**"');
  });

  it('riverpod.md frontmatter has exact paths: lib/**/providers/** and lib/**/presentation/**', async () => {
    await writeRules(makeContext(), tmp.path);
    const content = await readFile(join(tmp.path, '.claude', 'rules', 'riverpod.md'), 'utf-8');
    expect(content).toContain('"lib/**/providers/**"');
    expect(content).toContain('"lib/**/presentation/**"');
  });

  it('go-router.md frontmatter has exact paths: lib/**/router/** and lib/**/routes/**', async () => {
    await writeRules(makeContext(), tmp.path);
    const content = await readFile(join(tmp.path, '.claude', 'rules', 'go-router.md'), 'utf-8');
    expect(content).toContain('"lib/**/router/**"');
    expect(content).toContain('"lib/**/routes/**"');
  });

  it('each core rule file opens with --- on the first line', async () => {
    await writeRules(makeContext(), tmp.path);
    const entries = await readdir(join(tmp.path, '.claude', 'rules'));
    for (const file of entries) {
      const content = await readFile(join(tmp.path, '.claude', 'rules', file), 'utf-8');
      expect(content.startsWith('---\n')).toBe(true);
    }
  });

  it('each core rule file has closing --- followed by two newlines before body', async () => {
    await writeRules(makeContext(), tmp.path);
    const content = await readFile(join(tmp.path, '.claude', 'rules', 'architecture.md'), 'utf-8');
    expect(content).toContain('---\n\n#');
  });

  it('frontmatter paths are quoted strings (wrapped in double quotes)', async () => {
    await writeRules(makeContext(), tmp.path);
    const content = await readFile(join(tmp.path, '.claude', 'rules', 'architecture.md'), 'utf-8');
    // Each path in frontmatter should be quoted: - "lib/**"
    expect(content).toMatch(/  - "lib\/\*\*"/);
  });
});

// ─── Module rules: individual conditional branches ────────────────────────

describe('writeRules: module-conditional rules absent by default', () => {
  const tmp = useTempDir('rules-absent-by-default-');

  it('theme.md absent by default', async () => {
    await writeRules(makeContext(), tmp.path);
    const entries = await readdir(join(tmp.path, '.claude', 'rules'));
    expect(entries).not.toContain('theme.md');
  });

  it('push.md absent by default', async () => {
    await writeRules(makeContext(), tmp.path);
    const entries = await readdir(join(tmp.path, '.claude', 'rules'));
    expect(entries).not.toContain('push.md');
  });

  it('analytics.md absent by default', async () => {
    await writeRules(makeContext(), tmp.path);
    const entries = await readdir(join(tmp.path, '.claude', 'rules'));
    expect(entries).not.toContain('analytics.md');
  });

  it('cicd.md absent by default', async () => {
    await writeRules(makeContext(), tmp.path);
    const entries = await readdir(join(tmp.path, '.claude', 'rules'));
    expect(entries).not.toContain('cicd.md');
  });

  it('deep-linking.md absent by default', async () => {
    await writeRules(makeContext(), tmp.path);
    const entries = await readdir(join(tmp.path, '.claude', 'rules'));
    expect(entries).not.toContain('deep-linking.md');
  });
});

// ─── writeRules idempotency ───────────────────────────────────────────────

describe('writeRules: idempotency', () => {
  const tmp = useTempDir('rules-idempotent-');

  it('can be called twice without throwing', async () => {
    const ctx = makeContext();
    await writeRules(ctx, tmp.path);
    await expect(writeRules(ctx, tmp.path)).resolves.not.toThrow();
  });

  it('second call still produces exactly 9 core rule files', async () => {
    const ctx = makeContext();
    await writeRules(ctx, tmp.path);
    await writeRules(ctx, tmp.path);
    const entries = await readdir(join(tmp.path, '.claude', 'rules'));
    expect(entries).toHaveLength(9);
  });

  it('second call with modules enabled generates additional rules', async () => {
    const ctx = makeContext({
      modules: { ...makeContext().modules, auth: { provider: 'firebase' } },
    });
    await writeRules(makeContext(), tmp.path); // first: no modules
    await writeRules(ctx, tmp.path); // second: with auth
    const entries = await readdir(join(tmp.path, '.claude', 'rules'));
    expect(entries).toContain('auth.md');
  });
});
