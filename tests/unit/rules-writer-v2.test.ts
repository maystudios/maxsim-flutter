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

// ─── P11-004: path-scoped riverpod.md ──────────────────────────────────────

describe('P11-004: riverpod.md path scoping', () => {
  const tmp = useTempDir('rules-riverpod-scope-');

  it('riverpod.md frontmatter includes lib/**/providers/**', async () => {
    await writeRules(makeContext(), tmp.path);
    const content = await readFile(join(tmp.path, '.claude', 'rules', 'riverpod.md'), 'utf-8');
    expect(content).toContain('lib/**/providers/**');
  });

  it('riverpod.md frontmatter includes lib/**/presentation/**', async () => {
    await writeRules(makeContext(), tmp.path);
    const content = await readFile(join(tmp.path, '.claude', 'rules', 'riverpod.md'), 'utf-8');
    expect(content).toContain('lib/**/presentation/**');
  });
});

// ─── P11-004: path-scoped go-router.md ──────────────────────────────────────

describe('P11-004: go-router.md path scoping', () => {
  const tmp = useTempDir('rules-gorouter-scope-');

  it('go-router.md frontmatter includes lib/**/router/**', async () => {
    await writeRules(makeContext(), tmp.path);
    const content = await readFile(join(tmp.path, '.claude', 'rules', 'go-router.md'), 'utf-8');
    expect(content).toContain('lib/**/router/**');
  });

  it('go-router.md frontmatter includes lib/**/routes/**', async () => {
    await writeRules(makeContext(), tmp.path);
    const content = await readFile(join(tmp.path, '.claude', 'rules', 'go-router.md'), 'utf-8');
    expect(content).toContain('lib/**/routes/**');
  });
});

// ─── P11-004: new git-workflow.md core rule ─────────────────────────────────

describe('P11-004: git-workflow.md rule', () => {
  const tmp = useTempDir('rules-git-workflow-');

  it('generates git-workflow.md as a core rule', async () => {
    await writeRules(makeContext(), tmp.path);
    const entries = await readdir(join(tmp.path, '.claude', 'rules'));
    expect(entries).toContain('git-workflow.md');
  });

  it('git-workflow.md starts with YAML frontmatter', async () => {
    await writeRules(makeContext(), tmp.path);
    const content = await readFile(join(tmp.path, '.claude', 'rules', 'git-workflow.md'), 'utf-8');
    expect(content).toMatch(/^---\n/);
    expect(content).toContain('paths:');
  });

  it('git-workflow.md frontmatter paths includes **', async () => {
    await writeRules(makeContext(), tmp.path);
    const content = await readFile(join(tmp.path, '.claude', 'rules', 'git-workflow.md'), 'utf-8');
    expect(content).toContain('"**"');
  });

  it('git-workflow.md mentions commit conventions', async () => {
    await writeRules(makeContext(), tmp.path);
    const content = await readFile(join(tmp.path, '.claude', 'rules', 'git-workflow.md'), 'utf-8');
    expect(content.toLowerCase()).toContain('commit');
    expect(content.toLowerCase()).toContain('conventional');
  });

  it('git-workflow.md mentions branch naming', async () => {
    await writeRules(makeContext(), tmp.path);
    const content = await readFile(join(tmp.path, '.claude', 'rules', 'git-workflow.md'), 'utf-8');
    expect(content.toLowerCase()).toContain('branch');
  });

  it('git-workflow.md mentions feat/fix/chore prefixes', async () => {
    await writeRules(makeContext(), tmp.path);
    const content = await readFile(join(tmp.path, '.claude', 'rules', 'git-workflow.md'), 'utf-8');
    expect(content).toContain('feat');
    expect(content).toContain('fix');
    expect(content).toContain('chore');
  });
});

// ─── P11-004: new code-quality.md core rule ─────────────────────────────────

describe('P11-004: code-quality.md rule', () => {
  const tmp = useTempDir('rules-code-quality-');

  it('generates code-quality.md as a core rule', async () => {
    await writeRules(makeContext(), tmp.path);
    const entries = await readdir(join(tmp.path, '.claude', 'rules'));
    expect(entries).toContain('code-quality.md');
  });

  it('code-quality.md starts with YAML frontmatter', async () => {
    await writeRules(makeContext(), tmp.path);
    const content = await readFile(join(tmp.path, '.claude', 'rules', 'code-quality.md'), 'utf-8');
    expect(content).toMatch(/^---\n/);
    expect(content).toContain('paths:');
  });

  it('code-quality.md frontmatter paths includes lib/** and test/**', async () => {
    await writeRules(makeContext(), tmp.path);
    const content = await readFile(join(tmp.path, '.claude', 'rules', 'code-quality.md'), 'utf-8');
    expect(content).toContain('lib/**');
    expect(content).toContain('test/**');
  });

  it('code-quality.md mentions flutter analyze', async () => {
    await writeRules(makeContext(), tmp.path);
    const content = await readFile(join(tmp.path, '.claude', 'rules', 'code-quality.md'), 'utf-8');
    expect(content).toContain('flutter analyze');
  });

  it('code-quality.md mentions dart format', async () => {
    await writeRules(makeContext(), tmp.path);
    const content = await readFile(join(tmp.path, '.claude', 'rules', 'code-quality.md'), 'utf-8');
    expect(content).toContain('dart format');
  });

  it('code-quality.md mentions test coverage expectations', async () => {
    await writeRules(makeContext(), tmp.path);
    const content = await readFile(join(tmp.path, '.claude', 'rules', 'code-quality.md'), 'utf-8');
    expect(content.toLowerCase()).toContain('coverage');
  });
});

// ─── P11-004: updated core file counts ──────────────────────────────────────

describe('P11-004: updated core file counts', () => {
  const tmp = useTempDir('rules-counts-');

  it('generates exactly 7 core rules when no optional modules are enabled', async () => {
    await writeRules(makeContext(), tmp.path);
    const entries = await readdir(join(tmp.path, '.claude', 'rules'));
    expect(entries.sort()).toEqual([
      'architecture.md',
      'code-quality.md',
      'git-workflow.md',
      'go-router.md',
      'riverpod.md',
      'security.md',
      'testing.md',
    ]);
  });

  it('generates all 16 files when all optional modules are enabled', async () => {
    const ctx = makeContext({
      modules: {
        auth: { provider: 'firebase' },
        api: { baseUrl: 'https://api.example.com' },
        database: { engine: 'drift' },
        i18n: { defaultLocale: 'en', supportedLocales: ['en'] },
        theme: { seedColor: '#6750A4', darkMode: true },
        push: { provider: 'firebase' },
        analytics: { enabled: true },
        cicd: { provider: 'github' },
        deepLinking: { scheme: 'myapp', host: 'example.com' },
      },
    });
    await writeRules(ctx, tmp.path);
    const entries = await readdir(join(tmp.path, '.claude', 'rules'));
    expect(entries.sort()).toEqual([
      'analytics.md',
      'api.md',
      'architecture.md',
      'auth.md',
      'cicd.md',
      'code-quality.md',
      'database.md',
      'deep-linking.md',
      'git-workflow.md',
      'go-router.md',
      'i18n.md',
      'push.md',
      'riverpod.md',
      'security.md',
      'testing.md',
      'theme.md',
    ]);
  });
});
