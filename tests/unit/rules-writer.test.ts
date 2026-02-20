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

describe('writeRules', () => {
  const tmp = useTempDir('rules-writer-test-');

  it('creates .claude/rules/ directory', async () => {
    await writeRules(makeContext(), tmp.path);
    const entries = await readdir(join(tmp.path, '.claude', 'rules'));
    expect(entries.length).toBeGreaterThan(0);
  });

  it('always generates architecture.md', async () => {
    await writeRules(makeContext(), tmp.path);
    const entries = await readdir(join(tmp.path, '.claude', 'rules'));
    expect(entries).toContain('architecture.md');
  });

  it('always generates security.md', async () => {
    await writeRules(makeContext(), tmp.path);
    const entries = await readdir(join(tmp.path, '.claude', 'rules'));
    expect(entries).toContain('security.md');
  });

  it('always generates riverpod.md', async () => {
    await writeRules(makeContext(), tmp.path);
    const entries = await readdir(join(tmp.path, '.claude', 'rules'));
    expect(entries).toContain('riverpod.md');
  });

  it('always generates go-router.md', async () => {
    await writeRules(makeContext(), tmp.path);
    const entries = await readdir(join(tmp.path, '.claude', 'rules'));
    expect(entries).toContain('go-router.md');
  });

  it('always generates testing.md', async () => {
    await writeRules(makeContext(), tmp.path);
    const entries = await readdir(join(tmp.path, '.claude', 'rules'));
    expect(entries).toContain('testing.md');
  });

  it('generates exactly 5 files when no optional modules are enabled', async () => {
    await writeRules(makeContext(), tmp.path);
    const entries = await readdir(join(tmp.path, '.claude', 'rules'));
    expect(entries.sort()).toEqual([
      'architecture.md',
      'go-router.md',
      'riverpod.md',
      'security.md',
      'testing.md',
    ]);
  });

  it('each rule file has YAML frontmatter with paths array', async () => {
    await writeRules(makeContext(), tmp.path);
    const content = await readFile(
      join(tmp.path, '.claude', 'rules', 'architecture.md'),
      'utf-8',
    );
    expect(content).toMatch(/^---\n/);
    expect(content).toContain('paths:');
    expect(content).toMatch(/---\n/);
  });

  it('architecture.md frontmatter paths includes lib/ and test/', async () => {
    await writeRules(makeContext(), tmp.path);
    const content = await readFile(
      join(tmp.path, '.claude', 'rules', 'architecture.md'),
      'utf-8',
    );
    expect(content).toContain('lib/');
    expect(content).toContain('test/');
  });

  it('architecture.md content describes Clean Architecture rules', async () => {
    await writeRules(makeContext(), tmp.path);
    const content = await readFile(
      join(tmp.path, '.claude', 'rules', 'architecture.md'),
      'utf-8',
    );
    expect(content).toContain('Clean Architecture');
    expect(content).toContain('domain');
    expect(content).toContain('data');
    expect(content).toContain('presentation');
  });

  it('security.md content describes security rules', async () => {
    await writeRules(makeContext(), tmp.path);
    const content = await readFile(
      join(tmp.path, '.claude', 'rules', 'security.md'),
      'utf-8',
    );
    expect(content).toContain('security');
  });

  it('riverpod.md content describes Riverpod patterns', async () => {
    await writeRules(makeContext(), tmp.path);
    const content = await readFile(
      join(tmp.path, '.claude', 'rules', 'riverpod.md'),
      'utf-8',
    );
    expect(content).toContain('Riverpod');
    expect(content).toContain('ref.watch');
  });

  it('testing.md content describes testing conventions', async () => {
    await writeRules(makeContext(), tmp.path);
    const content = await readFile(
      join(tmp.path, '.claude', 'rules', 'testing.md'),
      'utf-8',
    );
    expect(content).toContain('test');
  });

  it('generates auth.md when auth module is enabled', async () => {
    const ctx = makeContext({
      modules: { ...makeContext().modules, auth: { provider: 'firebase' } },
    });
    await writeRules(ctx, tmp.path);
    const entries = await readdir(join(tmp.path, '.claude', 'rules'));
    expect(entries).toContain('auth.md');
  });

  it('does not generate auth.md when auth module is disabled', async () => {
    await writeRules(makeContext(), tmp.path);
    const entries = await readdir(join(tmp.path, '.claude', 'rules'));
    expect(entries).not.toContain('auth.md');
  });

  it('generates api.md when api module is enabled', async () => {
    const ctx = makeContext({
      modules: { ...makeContext().modules, api: { baseUrl: 'https://api.example.com' } },
    });
    await writeRules(ctx, tmp.path);
    const entries = await readdir(join(tmp.path, '.claude', 'rules'));
    expect(entries).toContain('api.md');
  });

  it('does not generate api.md when api module is disabled', async () => {
    await writeRules(makeContext(), tmp.path);
    const entries = await readdir(join(tmp.path, '.claude', 'rules'));
    expect(entries).not.toContain('api.md');
  });

  it('generates database.md when database module is enabled', async () => {
    const ctx = makeContext({
      modules: { ...makeContext().modules, database: { engine: 'drift' } },
    });
    await writeRules(ctx, tmp.path);
    const entries = await readdir(join(tmp.path, '.claude', 'rules'));
    expect(entries).toContain('database.md');
  });

  it('does not generate database.md when database module is disabled', async () => {
    await writeRules(makeContext(), tmp.path);
    const entries = await readdir(join(tmp.path, '.claude', 'rules'));
    expect(entries).not.toContain('database.md');
  });

  it('generates i18n.md when i18n module is enabled', async () => {
    const ctx = makeContext({
      modules: {
        ...makeContext().modules,
        i18n: { defaultLocale: 'en', supportedLocales: ['en', 'de'] },
      },
    });
    await writeRules(ctx, tmp.path);
    const entries = await readdir(join(tmp.path, '.claude', 'rules'));
    expect(entries).toContain('i18n.md');
  });

  it('does not generate i18n.md when i18n module is disabled', async () => {
    await writeRules(makeContext(), tmp.path);
    const entries = await readdir(join(tmp.path, '.claude', 'rules'));
    expect(entries).not.toContain('i18n.md');
  });

  it('generates theme.md when theme module is enabled', async () => {
    const ctx = makeContext({
      modules: { ...makeContext().modules, theme: { seedColor: '#6750A4', darkMode: true } },
    });
    await writeRules(ctx, tmp.path);
    const entries = await readdir(join(tmp.path, '.claude', 'rules'));
    expect(entries).toContain('theme.md');
  });

  it('does not generate theme.md when theme module is disabled', async () => {
    await writeRules(makeContext(), tmp.path);
    const entries = await readdir(join(tmp.path, '.claude', 'rules'));
    expect(entries).not.toContain('theme.md');
  });

  it('theme.md has YAML frontmatter with paths', async () => {
    const ctx = makeContext({
      modules: { ...makeContext().modules, theme: { seedColor: '#6750A4', darkMode: true } },
    });
    await writeRules(ctx, tmp.path);
    const content = await readFile(
      join(tmp.path, '.claude', 'rules', 'theme.md'),
      'utf-8',
    );
    expect(content).toMatch(/^---\n/);
    expect(content).toContain('paths:');
    expect(content).toContain('lib/core/theme/');
  });

  it('theme.md content mentions Material 3 and ColorScheme', async () => {
    const ctx = makeContext({
      modules: { ...makeContext().modules, theme: { seedColor: '#6750A4', darkMode: true } },
    });
    await writeRules(ctx, tmp.path);
    const content = await readFile(
      join(tmp.path, '.claude', 'rules', 'theme.md'),
      'utf-8',
    );
    expect(content).toContain('Material 3');
    expect(content).toContain('ColorScheme');
  });

  it('generates push.md when push module is enabled', async () => {
    const ctx = makeContext({
      modules: { ...makeContext().modules, push: { provider: 'firebase' } },
    });
    await writeRules(ctx, tmp.path);
    const entries = await readdir(join(tmp.path, '.claude', 'rules'));
    expect(entries).toContain('push.md');
  });

  it('does not generate push.md when push module is disabled', async () => {
    await writeRules(makeContext(), tmp.path);
    const entries = await readdir(join(tmp.path, '.claude', 'rules'));
    expect(entries).not.toContain('push.md');
  });

  it('push.md has YAML frontmatter with paths', async () => {
    const ctx = makeContext({
      modules: { ...makeContext().modules, push: { provider: 'firebase' } },
    });
    await writeRules(ctx, tmp.path);
    const content = await readFile(
      join(tmp.path, '.claude', 'rules', 'push.md'),
      'utf-8',
    );
    expect(content).toMatch(/^---\n/);
    expect(content).toContain('paths:');
    expect(content).toContain('lib/features/push/');
  });

  it('push.md content mentions notification handling and permissions', async () => {
    const ctx = makeContext({
      modules: { ...makeContext().modules, push: { provider: 'firebase' } },
    });
    await writeRules(ctx, tmp.path);
    const content = await readFile(
      join(tmp.path, '.claude', 'rules', 'push.md'),
      'utf-8',
    );
    expect(content.toLowerCase()).toContain('notification');
    expect(content.toLowerCase()).toContain('permission');
  });

  it('generates analytics.md when analytics module is enabled', async () => {
    const ctx = makeContext({
      modules: { ...makeContext().modules, analytics: { enabled: true } },
    });
    await writeRules(ctx, tmp.path);
    const entries = await readdir(join(tmp.path, '.claude', 'rules'));
    expect(entries).toContain('analytics.md');
  });

  it('does not generate analytics.md when analytics module is disabled', async () => {
    await writeRules(makeContext(), tmp.path);
    const entries = await readdir(join(tmp.path, '.claude', 'rules'));
    expect(entries).not.toContain('analytics.md');
  });

  it('analytics.md has YAML frontmatter with paths', async () => {
    const ctx = makeContext({
      modules: { ...makeContext().modules, analytics: { enabled: true } },
    });
    await writeRules(ctx, tmp.path);
    const content = await readFile(
      join(tmp.path, '.claude', 'rules', 'analytics.md'),
      'utf-8',
    );
    expect(content).toMatch(/^---\n/);
    expect(content).toContain('paths:');
    expect(content).toContain('lib/features/analytics/');
  });

  it('analytics.md content mentions event tracking and route observer', async () => {
    const ctx = makeContext({
      modules: { ...makeContext().modules, analytics: { enabled: true } },
    });
    await writeRules(ctx, tmp.path);
    const content = await readFile(
      join(tmp.path, '.claude', 'rules', 'analytics.md'),
      'utf-8',
    );
    expect(content.toLowerCase()).toContain('event');
    expect(content.toLowerCase()).toContain('route observer');
  });

  it('generates cicd.md when cicd module is enabled', async () => {
    const ctx = makeContext({
      modules: { ...makeContext().modules, cicd: { provider: 'github' } },
    });
    await writeRules(ctx, tmp.path);
    const entries = await readdir(join(tmp.path, '.claude', 'rules'));
    expect(entries).toContain('cicd.md');
  });

  it('does not generate cicd.md when cicd module is disabled', async () => {
    await writeRules(makeContext(), tmp.path);
    const entries = await readdir(join(tmp.path, '.claude', 'rules'));
    expect(entries).not.toContain('cicd.md');
  });

  it('cicd.md has YAML frontmatter with paths', async () => {
    const ctx = makeContext({
      modules: { ...makeContext().modules, cicd: { provider: 'github' } },
    });
    await writeRules(ctx, tmp.path);
    const content = await readFile(
      join(tmp.path, '.claude', 'rules', 'cicd.md'),
      'utf-8',
    );
    expect(content).toMatch(/^---\n/);
    expect(content).toContain('paths:');
    expect(content).toContain('.github/');
  });

  it('cicd.md content mentions CI/CD pipeline conventions', async () => {
    const ctx = makeContext({
      modules: { ...makeContext().modules, cicd: { provider: 'github' } },
    });
    await writeRules(ctx, tmp.path);
    const content = await readFile(
      join(tmp.path, '.claude', 'rules', 'cicd.md'),
      'utf-8',
    );
    expect(content).toContain('CI/CD');
  });

  it('generates deep-linking.md when deepLinking module is enabled', async () => {
    const ctx = makeContext({
      modules: { ...makeContext().modules, deepLinking: { scheme: 'myapp', host: 'example.com' } },
    });
    await writeRules(ctx, tmp.path);
    const entries = await readdir(join(tmp.path, '.claude', 'rules'));
    expect(entries).toContain('deep-linking.md');
  });

  it('does not generate deep-linking.md when deepLinking module is disabled', async () => {
    await writeRules(makeContext(), tmp.path);
    const entries = await readdir(join(tmp.path, '.claude', 'rules'));
    expect(entries).not.toContain('deep-linking.md');
  });

  it('deep-linking.md has YAML frontmatter with paths', async () => {
    const ctx = makeContext({
      modules: { ...makeContext().modules, deepLinking: { scheme: 'myapp', host: 'example.com' } },
    });
    await writeRules(ctx, tmp.path);
    const content = await readFile(
      join(tmp.path, '.claude', 'rules', 'deep-linking.md'),
      'utf-8',
    );
    expect(content).toMatch(/^---\n/);
    expect(content).toContain('paths:');
    expect(content).toContain('lib/core/router/');
  });

  it('deep-linking.md content mentions deep link handling and GoRouter', async () => {
    const ctx = makeContext({
      modules: { ...makeContext().modules, deepLinking: { scheme: 'myapp', host: 'example.com' } },
    });
    await writeRules(ctx, tmp.path);
    const content = await readFile(
      join(tmp.path, '.claude', 'rules', 'deep-linking.md'),
      'utf-8',
    );
    expect(content.toLowerCase()).toContain('deep link');
    expect(content).toContain('GoRouter');
  });

  it('generates all 14 files when all optional modules are enabled', async () => {
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
      'database.md',
      'deep-linking.md',
      'go-router.md',
      'i18n.md',
      'push.md',
      'riverpod.md',
      'security.md',
      'testing.md',
      'theme.md',
    ]);
  });

  it('auth.md content mentions authentication', async () => {
    const ctx = makeContext({
      modules: { ...makeContext().modules, auth: { provider: 'firebase' } },
    });
    await writeRules(ctx, tmp.path);
    const content = await readFile(
      join(tmp.path, '.claude', 'rules', 'auth.md'),
      'utf-8',
    );
    expect(content).toContain('auth');
  });

  it('api.md content mentions HTTP or API patterns', async () => {
    const ctx = makeContext({
      modules: { ...makeContext().modules, api: { baseUrl: 'https://api.example.com' } },
    });
    await writeRules(ctx, tmp.path);
    const content = await readFile(
      join(tmp.path, '.claude', 'rules', 'api.md'),
      'utf-8',
    );
    expect(content.toLowerCase()).toMatch(/api|http|dio/i);
  });

  it('database.md content mentions database or storage patterns', async () => {
    const ctx = makeContext({
      modules: { ...makeContext().modules, database: { engine: 'drift' } },
    });
    await writeRules(ctx, tmp.path);
    const content = await readFile(
      join(tmp.path, '.claude', 'rules', 'database.md'),
      'utf-8',
    );
    expect(content.toLowerCase()).toMatch(/database|drift|hive|isar|storage/i);
  });

  it('auth.md has YAML frontmatter with paths', async () => {
    const ctx = makeContext({
      modules: { ...makeContext().modules, auth: { provider: 'firebase' } },
    });
    await writeRules(ctx, tmp.path);
    const content = await readFile(
      join(tmp.path, '.claude', 'rules', 'auth.md'),
      'utf-8',
    );
    expect(content).toMatch(/^---\n/);
    expect(content).toContain('paths:');
  });
});
