import { writeSkills } from '../../src/claude-setup/skill-writer.js';
import { writeHooks } from '../../src/claude-setup/hooks-writer.js';
import { writeMcpConfig } from '../../src/claude-setup/mcp-config-writer.js';
import { writeCommands } from '../../src/claude-setup/commands-writer.js';
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

describe('writeSkills', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'skill-writer-test-'));
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  it('creates .claude/skills/ directory with 4 files', async () => {
    await writeSkills(makeContext(), tempDir);
    const skillsDir = join(tempDir, '.claude', 'skills');
    const entries = await readdir(skillsDir);
    expect(entries.sort()).toEqual([
      'flutter-patterns.md',
      'go-router-patterns.md',
      'module-conventions.md',
      'prd.md',
    ]);
  });

  it('flutter-patterns.md contains Riverpod patterns', async () => {
    await writeSkills(makeContext(), tempDir);
    const content = await readFile(
      join(tempDir, '.claude', 'skills', 'flutter-patterns.md'),
      'utf-8',
    );
    expect(content).toContain('Riverpod');
    expect(content).toContain('Provider');
    expect(content).toContain('ref.watch');
    expect(content).toContain('ref.read');
    expect(content).toContain('AsyncNotifier');
  });

  it('go-router-patterns.md contains GoRouter patterns', async () => {
    await writeSkills(makeContext(), tempDir);
    const content = await readFile(
      join(tempDir, '.claude', 'skills', 'go-router-patterns.md'),
      'utf-8',
    );
    expect(content).toContain('go_router');
    expect(content).toContain('TypedGoRoute');
    expect(content).toContain('GoRouteData');
  });

  it('go-router-patterns.md includes auth guard when auth is enabled', async () => {
    const ctx = makeContext({
      modules: { ...makeContext().modules, auth: { provider: 'firebase' } },
    });
    await writeSkills(ctx, tempDir);
    const content = await readFile(
      join(tempDir, '.claude', 'skills', 'go-router-patterns.md'),
      'utf-8',
    );
    expect(content).toContain('Auth Guards');
    expect(content).toContain('isLoggedInProvider');
  });

  it('go-router-patterns.md excludes auth guard when auth is disabled', async () => {
    await writeSkills(makeContext(), tempDir);
    const content = await readFile(
      join(tempDir, '.claude', 'skills', 'go-router-patterns.md'),
      'utf-8',
    );
    expect(content).not.toContain('Auth Guards');
  });

  it('go-router-patterns.md includes deep linking note when enabled', async () => {
    const ctx = makeContext({
      modules: { ...makeContext().modules, deepLinking: { scheme: 'myapp', host: 'example.com' } },
    });
    await writeSkills(ctx, tempDir);
    const content = await readFile(
      join(tempDir, '.claude', 'skills', 'go-router-patterns.md'),
      'utf-8',
    );
    expect(content).toContain('Deep Linking');
  });

  it('module-conventions.md contains Clean Architecture guide', async () => {
    await writeSkills(makeContext(), tempDir);
    const content = await readFile(
      join(tempDir, '.claude', 'skills', 'module-conventions.md'),
      'utf-8',
    );
    expect(content).toContain('Clean Architecture');
    expect(content).toContain('domain/');
    expect(content).toContain('data/');
    expect(content).toContain('presentation/');
    expect(content).toContain('Layer Dependency Rules');
  });

  it('prd.md contains story workflow guide', async () => {
    await writeSkills(makeContext(), tempDir);
    const content = await readFile(
      join(tempDir, '.claude', 'skills', 'prd.md'),
      'utf-8',
    );
    expect(content).toContain('prd.json');
    expect(content).toContain('passes');
    expect(content).toContain('acceptanceCriteria');
    expect(content).toContain('Workflow');
  });
});

describe('writeHooks', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'hooks-writer-test-'));
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  it('creates .claude/settings.local.json', async () => {
    await writeHooks(makeContext(), tempDir);
    const settingsPath = join(tempDir, '.claude', 'settings.local.json');
    const content = await readFile(settingsPath, 'utf-8');
    expect(content).toBeTruthy();
  });

  it('includes TaskCompleted hook with flutter analyze and test', async () => {
    await writeHooks(makeContext(), tempDir);
    const content = JSON.parse(
      await readFile(join(tempDir, '.claude', 'settings.local.json'), 'utf-8'),
    );
    expect(content.hooks.TaskCompleted).toBeDefined();
    expect(content.hooks.TaskCompleted).toHaveLength(1);
    expect(content.hooks.TaskCompleted[0].hooks[0].type).toBe('command');
    expect(content.hooks.TaskCompleted[0].hooks[0].command).toBe(
      'flutter analyze && flutter test',
    );
  });

  it('includes TeammateIdle hook when agentTeams is true', async () => {
    await writeHooks(makeContext({ claude: { enabled: true, agentTeams: true } }), tempDir);
    const content = JSON.parse(
      await readFile(join(tempDir, '.claude', 'settings.local.json'), 'utf-8'),
    );
    expect(content.hooks.TeammateIdle).toBeDefined();
    expect(content.hooks.TeammateIdle).toHaveLength(1);
    expect(content.hooks.TeammateIdle[0].hooks[0].command).toContain('git');
  });

  it('excludes TeammateIdle hook when agentTeams is false', async () => {
    await writeHooks(makeContext({ claude: { enabled: true, agentTeams: false } }), tempDir);
    const content = JSON.parse(
      await readFile(join(tempDir, '.claude', 'settings.local.json'), 'utf-8'),
    );
    expect(content.hooks.TeammateIdle).toBeUndefined();
  });

  it('writes valid JSON', async () => {
    await writeHooks(makeContext(), tempDir);
    const raw = await readFile(
      join(tempDir, '.claude', 'settings.local.json'),
      'utf-8',
    );
    expect(() => JSON.parse(raw)).not.toThrow();
  });
});

describe('writeMcpConfig', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'mcp-writer-test-'));
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  it('creates .mcp.json at output root', async () => {
    await writeMcpConfig(makeContext(), tempDir);
    const content = await readFile(join(tempDir, '.mcp.json'), 'utf-8');
    expect(content).toBeTruthy();
  });

  it('writes valid JSON', async () => {
    await writeMcpConfig(makeContext(), tempDir);
    const raw = await readFile(join(tempDir, '.mcp.json'), 'utf-8');
    expect(() => JSON.parse(raw)).not.toThrow();
  });

  it('has empty mcpServers when no modules need MCP', async () => {
    await writeMcpConfig(makeContext(), tempDir);
    const content = JSON.parse(
      await readFile(join(tempDir, '.mcp.json'), 'utf-8'),
    );
    expect(content.mcpServers).toEqual({});
  });

  it('includes firebase MCP when auth uses firebase', async () => {
    const ctx = makeContext({
      modules: { ...makeContext().modules, auth: { provider: 'firebase' } },
    });
    await writeMcpConfig(ctx, tempDir);
    const content = JSON.parse(
      await readFile(join(tempDir, '.mcp.json'), 'utf-8'),
    );
    expect(content.mcpServers.firebase).toBeDefined();
    expect(content.mcpServers.firebase.command).toBe('npx');
    expect(content.mcpServers.firebase.args).toContain('@firebase/mcp');
  });

  it('includes firebase MCP when push uses firebase', async () => {
    const ctx = makeContext({
      modules: { ...makeContext().modules, push: { provider: 'firebase' } },
    });
    await writeMcpConfig(ctx, tempDir);
    const content = JSON.parse(
      await readFile(join(tempDir, '.mcp.json'), 'utf-8'),
    );
    expect(content.mcpServers.firebase).toBeDefined();
  });

  it('includes firebase MCP when analytics is enabled', async () => {
    const ctx = makeContext({
      modules: { ...makeContext().modules, analytics: { enabled: true } },
    });
    await writeMcpConfig(ctx, tempDir);
    const content = JSON.parse(
      await readFile(join(tempDir, '.mcp.json'), 'utf-8'),
    );
    expect(content.mcpServers.firebase).toBeDefined();
  });

  it('includes supabase MCP when auth uses supabase', async () => {
    const ctx = makeContext({
      modules: { ...makeContext().modules, auth: { provider: 'supabase' } },
    });
    await writeMcpConfig(ctx, tempDir);
    const content = JSON.parse(
      await readFile(join(tempDir, '.mcp.json'), 'utf-8'),
    );
    expect(content.mcpServers.supabase).toBeDefined();
    expect(content.mcpServers.supabase.command).toBe('npx');
    expect(content.mcpServers.supabase.env).toHaveProperty('SUPABASE_ACCESS_TOKEN');
  });

  it('excludes supabase MCP when auth uses firebase', async () => {
    const ctx = makeContext({
      modules: { ...makeContext().modules, auth: { provider: 'firebase' } },
    });
    await writeMcpConfig(ctx, tempDir);
    const content = JSON.parse(
      await readFile(join(tempDir, '.mcp.json'), 'utf-8'),
    );
    expect(content.mcpServers.supabase).toBeUndefined();
  });

  it('includes both firebase and supabase when both are needed', async () => {
    const ctx = makeContext({
      modules: {
        ...makeContext().modules,
        auth: { provider: 'supabase' },
        analytics: { enabled: true },
      },
    });
    await writeMcpConfig(ctx, tempDir);
    const content = JSON.parse(
      await readFile(join(tempDir, '.mcp.json'), 'utf-8'),
    );
    expect(content.mcpServers.firebase).toBeDefined();
    expect(content.mcpServers.supabase).toBeDefined();
  });
});

describe('writeCommands', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'commands-writer-test-'));
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  it('creates .claude/commands/ directory with 2 files', async () => {
    await writeCommands(makeContext(), tempDir);
    const commandsDir = join(tempDir, '.claude', 'commands');
    const entries = await readdir(commandsDir);
    expect(entries.sort()).toEqual(['add-feature.md', 'analyze.md']);
  });

  it('add-feature.md contains Clean Architecture steps', async () => {
    await writeCommands(makeContext(), tempDir);
    const content = await readFile(
      join(tempDir, '.claude', 'commands', 'add-feature.md'),
      'utf-8',
    );
    expect(content).toContain('Add Feature');
    expect(content).toContain('Domain Layer');
    expect(content).toContain('Data Layer');
    expect(content).toContain('Presentation Layer');
    expect(content).toContain('freezed');
    expect(content).toContain('flutter_riverpod');
  });

  it('add-feature.md includes auth guard when auth is enabled', async () => {
    const ctx = makeContext({
      modules: { ...makeContext().modules, auth: { provider: 'firebase' } },
    });
    await writeCommands(ctx, tempDir);
    const content = await readFile(
      join(tempDir, '.claude', 'commands', 'add-feature.md'),
      'utf-8',
    );
    expect(content).toContain('Route Guard');
    expect(content).toContain('isLoggedInProvider');
  });

  it('add-feature.md excludes auth guard when auth is disabled', async () => {
    await writeCommands(makeContext(), tempDir);
    const content = await readFile(
      join(tempDir, '.claude', 'commands', 'add-feature.md'),
      'utf-8',
    );
    expect(content).not.toContain('Route Guard');
  });

  it('add-feature.md includes i18n when enabled', async () => {
    const ctx = makeContext({
      modules: {
        ...makeContext().modules,
        i18n: { defaultLocale: 'en', supportedLocales: ['en', 'de'] },
      },
    });
    await writeCommands(ctx, tempDir);
    const content = await readFile(
      join(tempDir, '.claude', 'commands', 'add-feature.md'),
      'utf-8',
    );
    expect(content).toContain('Localization');
    expect(content).toContain('gen-l10n');
  });

  it('analyze.md contains flutter analyze guide', async () => {
    await writeCommands(makeContext(), tempDir);
    const content = await readFile(
      join(tempDir, '.claude', 'commands', 'analyze.md'),
      'utf-8',
    );
    expect(content).toContain('flutter analyze');
    expect(content).toContain('error');
    expect(content).toContain('warning');
    expect(content).toContain('dart fix');
    expect(content).toContain('flutter test');
  });
});
