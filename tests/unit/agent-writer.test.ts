import { writeAgents, buildAgentDefinitions } from '../../src/claude-setup/agent-writer.js';
import type { ProjectContext } from '../../src/core/context.js';
import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

function makeContext(overrides: Partial<ProjectContext> = {}): ProjectContext {
  return {
    projectName: 'my_app',
    orgId: 'com.example',
    description: 'A test Flutter app',
    platforms: ['android', 'ios'],
    modules: {
      auth: false,
      api: false,
      database: false,
      i18n: false,
      theme: false,
      push: false,
      analytics: false,
      cicd: false,
      deepLinking: false,
    },
    scaffold: {
      dryRun: false,
      overwrite: 'ask',
      postProcessors: {
        dartFormat: true,
        flutterPubGet: true,
        buildRunner: true,
      },
    },
    claude: {
      enabled: true,
      agentTeams: true,
    },
    outputDir: '/tmp/my_app',
    rawConfig: {} as ProjectContext['rawConfig'],
    ...overrides,
  };
}

describe('buildAgentDefinitions', () => {
  it('returns exactly 5 agent definitions', () => {
    const agents = buildAgentDefinitions(makeContext());
    expect(agents).toHaveLength(5);
  });

  it('returns agents with correct filenames', () => {
    const agents = buildAgentDefinitions(makeContext());
    const filenames = agents.map((a) => a.filename);
    expect(filenames).toEqual([
      'flutter-architect.md',
      'flutter-feature-builder.md',
      'flutter-tester.md',
      'flutter-reviewer.md',
      'flutter-docs.md',
    ]);
  });

  it('returns agents with correct names', () => {
    const agents = buildAgentDefinitions(makeContext());
    const names = agents.map((a) => a.name);
    expect(names).toEqual([
      'flutter-architect',
      'flutter-feature-builder',
      'flutter-tester',
      'flutter-reviewer',
      'flutter-docs',
    ]);
  });

  describe('flutter-architect', () => {
    it('uses sonnet model', () => {
      const agents = buildAgentDefinitions(makeContext());
      const architect = agents.find((a) => a.name === 'flutter-architect')!;
      expect(architect.model).toBe('sonnet');
    });

    it('has read-only tools', () => {
      const agents = buildAgentDefinitions(makeContext());
      const architect = agents.find((a) => a.name === 'flutter-architect')!;
      expect(architect.tools).toEqual(['Read', 'Grep', 'Glob', 'WebSearch']);
      expect(architect.tools).not.toContain('Write');
      expect(architect.tools).not.toContain('Edit');
      expect(architect.tools).not.toContain('Bash');
    });

    it('includes project name in body', () => {
      const agents = buildAgentDefinitions(makeContext({ projectName: 'awesome_app' }));
      const architect = agents.find((a) => a.name === 'flutter-architect')!;
      expect(architect.body).toContain('awesome_app');
    });

    it('includes architecture rules', () => {
      const agents = buildAgentDefinitions(makeContext());
      const architect = agents.find((a) => a.name === 'flutter-architect')!;
      expect(architect.body).toContain('Domain');
      expect(architect.body).toContain('Data');
      expect(architect.body).toContain('Presentation');
      expect(architect.body).toContain('domain/');
    });

    it('includes reviews-before-implementation role', () => {
      const agents = buildAgentDefinitions(makeContext());
      const architect = agents.find((a) => a.name === 'flutter-architect')!;
      expect(architect.body).toContain('read-only');
      expect(architect.body).toContain('before builders start');
    });
  });

  describe('flutter-feature-builder', () => {
    it('uses sonnet model', () => {
      const agents = buildAgentDefinitions(makeContext());
      const builder = agents.find((a) => a.name === 'flutter-feature-builder')!;
      expect(builder.model).toBe('sonnet');
    });

    it('has all tools including Write, Edit, and Bash', () => {
      const agents = buildAgentDefinitions(makeContext());
      const builder = agents.find((a) => a.name === 'flutter-feature-builder')!;
      expect(builder.tools).toContain('Read');
      expect(builder.tools).toContain('Write');
      expect(builder.tools).toContain('Edit');
      expect(builder.tools).toContain('Bash');
      expect(builder.tools).toContain('Grep');
      expect(builder.tools).toContain('Glob');
    });

    it('includes implementation workflow', () => {
      const agents = buildAgentDefinitions(makeContext());
      const builder = agents.find((a) => a.name === 'flutter-feature-builder')!;
      expect(builder.body).toContain('implementation');
      expect(builder.body).toContain('flutter analyze');
      expect(builder.body).toContain('flutter test');
    });

    it('includes code conventions', () => {
      const agents = buildAgentDefinitions(makeContext());
      const builder = agents.find((a) => a.name === 'flutter-feature-builder')!;
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
    it('uses sonnet model', () => {
      const agents = buildAgentDefinitions(makeContext());
      const reviewer = agents.find((a) => a.name === 'flutter-reviewer')!;
      expect(reviewer.model).toBe('sonnet');
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

  describe('flutter-docs', () => {
    it('uses haiku model', () => {
      const agents = buildAgentDefinitions(makeContext());
      const docs = agents.find((a) => a.name === 'flutter-docs')!;
      expect(docs.model).toBe('haiku');
    });

    it('has edit tools but no Bash', () => {
      const agents = buildAgentDefinitions(makeContext());
      const docs = agents.find((a) => a.name === 'flutter-docs')!;
      expect(docs.tools).toContain('Read');
      expect(docs.tools).toContain('Write');
      expect(docs.tools).toContain('Edit');
      expect(docs.tools).not.toContain('Bash');
    });

    it('mentions documenting after review', () => {
      const agents = buildAgentDefinitions(makeContext());
      const docs = agents.find((a) => a.name === 'flutter-docs')!;
      expect(docs.body).toContain('reviewed and approved');
    });

    it('includes Dart doc comment style', () => {
      const agents = buildAgentDefinitions(makeContext());
      const docs = agents.find((a) => a.name === 'flutter-docs')!;
      expect(docs.body).toContain('///');
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
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'agent-writer-test-'));
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  it('creates .claude/agents/ directory', async () => {
    await writeAgents(makeContext(), tempDir);
    const agentsDir = join(tempDir, '.claude', 'agents');
    const entries = await readdir(agentsDir);
    expect(entries).toHaveLength(5);
  });

  it('writes all 5 agent files', async () => {
    const files = await writeAgents(makeContext(), tempDir);
    expect(files).toHaveLength(5);
    for (const file of files) {
      expect(file).toContain('.claude/agents/');
      expect(file).toMatch(/\.md$/);
    }
  });

  it('writes valid markdown with YAML frontmatter', async () => {
    await writeAgents(makeContext(), tempDir);
    const content = await readFile(
      join(tempDir, '.claude', 'agents', 'flutter-architect.md'),
      'utf-8',
    );
    expect(content).toMatch(/^---\n/);
    expect(content).toContain('name: flutter-architect');
    expect(content).toContain('model: sonnet');
    expect(content).toContain('tools:');
    expect(content).toMatch(/---\n\n/);
  });

  it('includes project name in generated agent files', async () => {
    await writeAgents(makeContext({ projectName: 'cool_app' }), tempDir);
    const content = await readFile(
      join(tempDir, '.claude', 'agents', 'flutter-feature-builder.md'),
      'utf-8',
    );
    expect(content).toContain('cool_app');
  });

  it('returns full file paths', async () => {
    const files = await writeAgents(makeContext(), tempDir);
    expect(files[0]).toBe(join(tempDir, '.claude', 'agents', 'flutter-architect.md'));
    expect(files[1]).toBe(join(tempDir, '.claude', 'agents', 'flutter-feature-builder.md'));
    expect(files[2]).toBe(join(tempDir, '.claude', 'agents', 'flutter-tester.md'));
    expect(files[3]).toBe(join(tempDir, '.claude', 'agents', 'flutter-reviewer.md'));
    expect(files[4]).toBe(join(tempDir, '.claude', 'agents', 'flutter-docs.md'));
  });

  it('generates docs agent with haiku model', async () => {
    await writeAgents(makeContext(), tempDir);
    const content = await readFile(
      join(tempDir, '.claude', 'agents', 'flutter-docs.md'),
      'utf-8',
    );
    expect(content).toContain('model: haiku');
  });

  it('generates reviewer agent with read-only tools', async () => {
    await writeAgents(makeContext(), tempDir);
    const content = await readFile(
      join(tempDir, '.claude', 'agents', 'flutter-reviewer.md'),
      'utf-8',
    );
    expect(content).toContain('["Read","Grep","Glob"]');
    expect(content).not.toContain('"Write"');
    expect(content).not.toContain('"Bash"');
  });
});
