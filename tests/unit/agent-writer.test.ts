import { writeAgents, buildAgentDefinitions } from '../../src/claude-setup/agent-writer.js';
import { makeTestContext } from '../helpers/context-factory.js';
import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { useTempDir } from '../helpers/temp-dir.js';

function makeContext(overrides: Partial<Parameters<typeof makeTestContext>[0]> = {}) {
  return makeTestContext({
    scaffold: {
      dryRun: false,
      overwrite: 'ask',
      postProcessors: { dartFormat: true, flutterPubGet: true, buildRunner: true },
    },
    claude: { enabled: true, agentTeams: true },
    ...overrides,
  });
}

describe('buildAgentDefinitions', () => {
  it('returns exactly 4 agent definitions', () => {
    const agents = buildAgentDefinitions(makeContext());
    expect(agents).toHaveLength(4);
  });

  it('returns agents with correct filenames', () => {
    const agents = buildAgentDefinitions(makeContext());
    const filenames = agents.map((a) => a.filename);
    expect(filenames).toEqual([
      'flutter-architect.md',
      'flutter-builder.md',
      'flutter-tester.md',
      'flutter-reviewer.md',
    ]);
  });

  it('returns agents with correct names', () => {
    const agents = buildAgentDefinitions(makeContext());
    const names = agents.map((a) => a.name);
    expect(names).toEqual([
      'flutter-architect',
      'flutter-builder',
      'flutter-tester',
      'flutter-reviewer',
    ]);
  });

  describe('flutter-builder', () => {
    it('uses opus model', () => {
      const agents = buildAgentDefinitions(makeContext());
      const builder = agents.find((a) => a.name === 'flutter-builder')!;
      expect(builder.model).toBe('opus');
    });

    it('has all tools including Write, Edit, and Bash', () => {
      const agents = buildAgentDefinitions(makeContext());
      const builder = agents.find((a) => a.name === 'flutter-builder')!;
      expect(builder.tools).toContain('Read');
      expect(builder.tools).toContain('Write');
      expect(builder.tools).toContain('Edit');
      expect(builder.tools).toContain('Bash');
      expect(builder.tools).toContain('Grep');
      expect(builder.tools).toContain('Glob');
    });

    it('includes project name in body', () => {
      const agents = buildAgentDefinitions(makeContext({ projectName: 'awesome_app' }));
      const builder = agents.find((a) => a.name === 'flutter-builder')!;
      expect(builder.body).toContain('awesome_app');
    });

    it('includes architecture rules', () => {
      const agents = buildAgentDefinitions(makeContext());
      const builder = agents.find((a) => a.name === 'flutter-builder')!;
      expect(builder.body).toContain('Domain');
      expect(builder.body).toContain('Data');
      expect(builder.body).toContain('Presentation');
      expect(builder.body).toContain('domain/');
    });

    it('includes implementation workflow', () => {
      const agents = buildAgentDefinitions(makeContext());
      const builder = agents.find((a) => a.name === 'flutter-builder')!;
      expect(builder.body).toContain('flutter analyze');
      expect(builder.body).toContain('flutter test');
    });

    it('includes code conventions', () => {
      const agents = buildAgentDefinitions(makeContext());
      const builder = agents.find((a) => a.name === 'flutter-builder')!;
      expect(builder.body).toContain('snake_case');
      expect(builder.body).toContain('PascalCase');
      expect(builder.body).toContain('ref.watch()');
    });
  });

  describe('flutter-tester', () => {
    it('uses sonnet model', () => {
      const agents = buildAgentDefinitions(makeContext());
      const tester = agents.find((a) => a.name === 'flutter-tester')!;
      expect(tester.model).toBe('sonnet');
    });

    it('has all tools including Write, Edit, and Bash', () => {
      const agents = buildAgentDefinitions(makeContext());
      const tester = agents.find((a) => a.name === 'flutter-tester')!;
      expect(tester.tools).toContain('Read');
      expect(tester.tools).toContain('Write');
      expect(tester.tools).toContain('Edit');
      expect(tester.tools).toContain('Bash');
    });

    it('includes testing patterns', () => {
      const agents = buildAgentDefinitions(makeContext());
      const tester = agents.find((a) => a.name === 'flutter-tester')!;
      expect(tester.body).toContain('flutter_test');
      expect(tester.body).toContain('mocktail');
      expect(tester.body).toContain('_test.dart');
    });

    it('mentions messaging builders about failures', () => {
      const agents = buildAgentDefinitions(makeContext());
      const tester = agents.find((a) => a.name === 'flutter-tester')!;
      expect(tester.body).toContain('Message the builder');
      expect(tester.body).toContain('fail');
    });
  });

  describe('flutter-reviewer', () => {
    it('uses haiku model', () => {
      const agents = buildAgentDefinitions(makeContext());
      const reviewer = agents.find((a) => a.name === 'flutter-reviewer')!;
      expect(reviewer.model).toBe('haiku');
    });

    it('has read-only tools', () => {
      const agents = buildAgentDefinitions(makeContext());
      const reviewer = agents.find((a) => a.name === 'flutter-reviewer')!;
      expect(reviewer.tools).toEqual(['Read', 'Grep', 'Glob']);
      expect(reviewer.tools).not.toContain('Write');
      expect(reviewer.tools).not.toContain('Edit');
      expect(reviewer.tools).not.toContain('Bash');
    });

    it('includes review checklist', () => {
      const agents = buildAgentDefinitions(makeContext());
      const reviewer = agents.find((a) => a.name === 'flutter-reviewer')!;
      expect(reviewer.body).toContain('Clean Architecture Compliance');
      expect(reviewer.body).toContain('Riverpod Patterns');
      expect(reviewer.body).toContain('Code Quality');
    });

    it('is read-only role', () => {
      const agents = buildAgentDefinitions(makeContext());
      const reviewer = agents.find((a) => a.name === 'flutter-reviewer')!;
      expect(reviewer.body).toContain('read-only');
      expect(reviewer.body).toContain('do NOT write');
    });
  });

  describe('module context', () => {
    it('shows no-modules message when no modules enabled', () => {
      const agents = buildAgentDefinitions(makeContext());
      for (const agent of agents) {
        expect(agent.body).toContain('core Clean Architecture structure without additional modules');
      }
    });

    it('lists active modules when modules are enabled', () => {
      const ctx = makeContext({
        modules: {
          ...makeContext().modules,
          auth: { provider: 'firebase' },
          api: { baseUrl: 'https://api.test.com' },
          theme: { seedColor: '#6750A4', darkMode: true },
        },
      });
      const agents = buildAgentDefinitions(ctx);
      for (const agent of agents) {
        expect(agent.body).toContain('auth, api, theme');
      }
    });

    it('lists all modules when all are enabled', () => {
      const ctx = makeContext({
        modules: {
          auth: { provider: 'firebase' },
          api: { baseUrl: 'https://api.test.com' },
          database: { engine: 'drift' },
          i18n: { defaultLocale: 'en', supportedLocales: ['en'] },
          theme: { seedColor: '#6750A4', darkMode: true },
          push: { provider: 'firebase' },
          analytics: { enabled: true },
          cicd: { provider: 'github' },
          deepLinking: { scheme: 'myapp', host: 'example.com' },
        },
      });
      const agents = buildAgentDefinitions(ctx);
      for (const agent of agents) {
        expect(agent.body).toContain('auth, api, database, i18n, theme, push, analytics, cicd, deep-linking');
      }
    });
  });
});

describe('writeAgents', () => {
  const tmp = useTempDir('agent-writer-test-');

  it('creates .claude/agents/ directory with 4 files', async () => {
    await writeAgents(makeContext(), tmp.path);
    const agentsDir = join(tmp.path, '.claude', 'agents');
    const entries = await readdir(agentsDir);
    expect(entries).toHaveLength(4);
  });

  it('writes all 4 agent files', async () => {
    const files = await writeAgents(makeContext(), tmp.path);
    expect(files).toHaveLength(4);
    for (const file of files) {
      expect(file).toContain('.claude/agents/');
      expect(file).toMatch(/\.md$/);
    }
  });

  it('writes valid markdown with YAML frontmatter', async () => {
    await writeAgents(makeContext(), tmp.path);
    const content = await readFile(
      join(tmp.path, '.claude', 'agents', 'flutter-builder.md'),
      'utf-8',
    );
    expect(content).toMatch(/^---\n/);
    expect(content).toContain('name: flutter-builder');
    expect(content).toContain('model: opus');
    expect(content).toContain('tools:');
    expect(content).toMatch(/---\n\n/);
  });

  it('includes project name in generated agent files', async () => {
    await writeAgents(makeContext({ projectName: 'cool_app' }), tmp.path);
    const content = await readFile(
      join(tmp.path, '.claude', 'agents', 'flutter-builder.md'),
      'utf-8',
    );
    expect(content).toContain('cool_app');
  });

  it('returns full file paths', async () => {
    const files = await writeAgents(makeContext(), tmp.path);
    expect(files[0]).toBe(join(tmp.path, '.claude', 'agents', 'flutter-architect.md'));
    expect(files[1]).toBe(join(tmp.path, '.claude', 'agents', 'flutter-builder.md'));
    expect(files[2]).toBe(join(tmp.path, '.claude', 'agents', 'flutter-tester.md'));
    expect(files[3]).toBe(join(tmp.path, '.claude', 'agents', 'flutter-reviewer.md'));
  });

  it('generates reviewer agent with haiku model', async () => {
    await writeAgents(makeContext(), tmp.path);
    const content = await readFile(
      join(tmp.path, '.claude', 'agents', 'flutter-reviewer.md'),
      'utf-8',
    );
    expect(content).toContain('model: haiku');
  });

  it('generates reviewer agent with read-only tools', async () => {
    await writeAgents(makeContext(), tmp.path);
    const content = await readFile(
      join(tmp.path, '.claude', 'agents', 'flutter-reviewer.md'),
      'utf-8',
    );
    expect(content).toContain('["Read","Grep","Glob"]');
    expect(content).not.toContain('"Write"');
    expect(content).not.toContain('"Bash"');
  });
});
