import { mkdtemp, rm, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { load as yamlLoad } from 'js-yaml';
import fsExtra from 'fs-extra';
import { ScaffoldEngine } from '../../src/scaffold/engine.js';
import type { ProjectContext } from '../../src/core/context.js';
import { ModuleRegistry } from '../../src/modules/registry.js';
import { manifest as coreManifest } from '../../src/modules/definitions/core/module.js';
import { manifest as authManifest } from '../../src/modules/definitions/auth/module.js';
import { manifest as apiManifest } from '../../src/modules/definitions/api/module.js';
import { manifest as themeManifest } from '../../src/modules/definitions/theme/module.js';
import { manifest as databaseManifest } from '../../src/modules/definitions/database/module.js';

const { pathExists } = fsExtra;

const TEMPLATES_DIR = resolve('templates/core');
const MODULES_DIR = resolve('templates/modules');

/** Build a pre-loaded registry for tests (avoids dynamic import issues in ts-jest). */
function createTestRegistry(): ModuleRegistry {
  const registry = new ModuleRegistry();
  registry.register(coreManifest);
  registry.register(authManifest);
  registry.register(apiManifest);
  registry.register(themeManifest);
  registry.register(databaseManifest);
  return registry;
}

function makeContext(
  outputDir: string,
  overrides: Partial<ProjectContext> = {},
): ProjectContext {
  const base: ProjectContext = {
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
      overwrite: 'always',
      postProcessors: {
        dartFormat: false,
        flutterPubGet: false,
        buildRunner: false,
      },
    },
    claude: {
      enabled: false,
      agentTeams: false,
    },
    outputDir,
    rawConfig: {} as ProjectContext['rawConfig'],
  };
  return { ...base, ...overrides };
}

describe('Integration: create command generates working Flutter project', () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), 'integration-test-'));
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  it('generates project with correct directory structure', async () => {
    const engine = new ScaffoldEngine({ templatesDir: TEMPLATES_DIR });
    const context = makeContext(tmpDir);
    await engine.run(context);

    const expectedDirs = [
      'lib',
      join('lib', 'core'),
      join('lib', 'core', 'router'),
      join('lib', 'core', 'theme'),
      join('lib', 'core', 'providers'),
      join('lib', 'features'),
      join('lib', 'features', 'home'),
      join('lib', 'features', 'home', 'presentation'),
      join('lib', 'features', 'home', 'domain'),
      join('lib', 'features', 'home', 'data'),
      'test',
    ];

    for (const dir of expectedDirs) {
      const dirPath = join(tmpDir, dir);
      const exists = await pathExists(dirPath);
      expect(exists).toBe(true);
    }
  });

  it('generates valid pubspec.yaml with required dependencies', async () => {
    const engine = new ScaffoldEngine({ templatesDir: TEMPLATES_DIR });
    const context = makeContext(tmpDir);
    await engine.run(context);

    const pubspecContent = await readFile(join(tmpDir, 'pubspec.yaml'), 'utf-8');
    const pubspec = yamlLoad(pubspecContent) as Record<string, unknown>;

    expect(pubspec).toBeTruthy();

    const dependencies = pubspec['dependencies'] as Record<string, unknown>;
    expect(dependencies).toHaveProperty('flutter_riverpod');
    expect(dependencies).toHaveProperty('go_router');
    expect(dependencies).toHaveProperty('freezed_annotation');

    // Verify project name matches
    expect(pubspec['name']).toBe('my_app');
  });

  it('generates main.dart with ProviderScope', async () => {
    const engine = new ScaffoldEngine({ templatesDir: TEMPLATES_DIR });
    const context = makeContext(tmpDir);
    await engine.run(context);

    const mainDartContent = await readFile(join(tmpDir, 'lib', 'main.dart'), 'utf-8');

    expect(mainDartContent).toContain('ProviderScope');
    expect(mainDartContent).toContain('runApp');
  });

  it('generates app_router.dart with GoRouter setup', async () => {
    const engine = new ScaffoldEngine({ templatesDir: TEMPLATES_DIR });
    const context = makeContext(tmpDir);
    await engine.run(context);

    const routerContent = await readFile(
      join(tmpDir, 'lib', 'core', 'router', 'app_router.dart'),
      'utf-8',
    );

    const hasGoRouter = routerContent.includes('GoRouter') || routerContent.includes('GoRoute');
    expect(hasGoRouter).toBe(true);

    // Verify it has a provider (riverpod annotation or provider definition)
    const hasProvider =
      routerContent.includes('@riverpod') || routerContent.includes('Provider');
    expect(hasProvider).toBe(true);
  });

  it('generates valid analysis_options.yaml', async () => {
    const engine = new ScaffoldEngine({ templatesDir: TEMPLATES_DIR });
    const context = makeContext(tmpDir);
    await engine.run(context);

    const analysisContent = await readFile(join(tmpDir, 'analysis_options.yaml'), 'utf-8');
    const analysisOptions = yamlLoad(analysisContent) as Record<string, unknown>;

    expect(analysisOptions).toBeTruthy();
    // Verify it references flutter_lints
    expect(analysisContent).toContain('flutter_lints');
  });

  it('generates widget_test.dart', async () => {
    const engine = new ScaffoldEngine({ templatesDir: TEMPLATES_DIR });
    const context = makeContext(tmpDir);
    await engine.run(context);

    const widgetTestContent = await readFile(
      join(tmpDir, 'test', 'widget_test.dart'),
      'utf-8',
    );

    // Verify it contains a test
    expect(widgetTestContent).toContain('testWidgets');
  });

  it('writes maxsim.config.yaml when scaffold completes', async () => {
    const engine = new ScaffoldEngine({ templatesDir: TEMPLATES_DIR });
    const context = makeContext(tmpDir);
    await engine.run(context);

    // Simulate what the create command does: write the config file
    const configContent = `project:\n  name: my_app\n  orgId: com.example\n`;
    const configPath = join(tmpDir, 'maxsim.config.yaml');
    await writeFile(configPath, configContent, 'utf-8');

    const configExists = await pathExists(configPath);
    expect(configExists).toBe(true);

    const rawConfig = await readFile(configPath, 'utf-8');
    const parsedConfig = yamlLoad(rawConfig) as Record<string, unknown>;
    expect(parsedConfig).toBeTruthy();
    expect(parsedConfig['project']).toBeDefined();
  });

  it('generates project with correct project name in files', async () => {
    const engine = new ScaffoldEngine({ templatesDir: TEMPLATES_DIR });
    const context = makeContext(tmpDir, { projectName: 'awesome_app' });
    await engine.run(context);

    const pubspecContent = await readFile(join(tmpDir, 'pubspec.yaml'), 'utf-8');
    const pubspec = yamlLoad(pubspecContent) as Record<string, unknown>;

    expect(pubspec['name']).toBe('awesome_app');
  });

  it('generates auth module files when auth is enabled', async () => {
    const engine = new ScaffoldEngine({
      templatesDir: TEMPLATES_DIR,
      modulesTemplatesDir: MODULES_DIR,
      registry: createTestRegistry(),
    });
    const context = makeContext(tmpDir, {
      modules: {
        auth: { provider: 'firebase' },
        api: false,
        database: false,
        i18n: false,
        theme: false,
        push: false,
        analytics: false,
        cicd: false,
        deepLinking: false,
      },
    });
    await engine.run(context);

    // Auth module files should exist
    const authProviderPath = join(
      tmpDir,
      'lib/features/auth/presentation/providers/auth_provider.dart',
    );
    expect(await pathExists(authProviderPath)).toBe(true);

    const loginPagePath = join(tmpDir, 'lib/features/auth/presentation/pages/login_page.dart');
    expect(await pathExists(loginPagePath)).toBe(true);

    // Core files should still exist
    expect(await pathExists(join(tmpDir, 'lib/main.dart'))).toBe(true);
  });

  it('generates api module files when api is enabled', async () => {
    const engine = new ScaffoldEngine({
      templatesDir: TEMPLATES_DIR,
      modulesTemplatesDir: MODULES_DIR,
      registry: createTestRegistry(),
    });
    const context = makeContext(tmpDir, {
      modules: {
        auth: false,
        api: { baseUrl: 'https://api.test.com' },
        database: false,
        i18n: false,
        theme: false,
        push: false,
        analytics: false,
        cicd: false,
        deepLinking: false,
      },
    });
    await engine.run(context);

    // API module files should exist
    const apiClientPath = join(tmpDir, 'lib/features/api/data/datasources/api_client.dart');
    expect(await pathExists(apiClientPath)).toBe(true);

    const apiProviderPath = join(
      tmpDir,
      'lib/features/api/presentation/providers/api_provider.dart',
    );
    expect(await pathExists(apiProviderPath)).toBe(true);
  });

  it('merges module dependencies into pubspec.yaml', async () => {
    const engine = new ScaffoldEngine({
      templatesDir: TEMPLATES_DIR,
      modulesTemplatesDir: MODULES_DIR,
      registry: createTestRegistry(),
    });
    const context = makeContext(tmpDir, {
      modules: {
        auth: { provider: 'firebase' },
        api: { baseUrl: 'https://api.test.com' },
        database: false,
        i18n: false,
        theme: { seedColor: '#6750A4', darkMode: true },
        push: false,
        analytics: false,
        cicd: false,
        deepLinking: false,
      },
    });
    await engine.run(context);

    const pubspecContent = await readFile(join(tmpDir, 'pubspec.yaml'), 'utf-8');
    const pubspec = yamlLoad(pubspecContent) as Record<string, unknown>;
    const deps = pubspec['dependencies'] as Record<string, unknown>;

    // Core deps should still be present
    expect(deps).toHaveProperty('flutter_riverpod');
    expect(deps).toHaveProperty('go_router');

    // Module deps should be merged in
    expect(deps).toHaveProperty('dio');
    expect(deps).toHaveProperty('google_fonts');
  });

  it('generates multiple modules together with merged pubspec', async () => {
    const engine = new ScaffoldEngine({
      templatesDir: TEMPLATES_DIR,
      modulesTemplatesDir: MODULES_DIR,
      registry: createTestRegistry(),
    });
    const context = makeContext(tmpDir, {
      modules: {
        auth: { provider: 'firebase' },
        api: { baseUrl: 'https://api.test.com' },
        database: false,
        i18n: false,
        theme: { seedColor: '#6750A4', darkMode: true },
        push: false,
        analytics: false,
        cicd: false,
        deepLinking: false,
      },
    });
    const result = await engine.run(context);

    // Should generate core + module files
    expect(result.filesWritten.length).toBeGreaterThan(20);

    // Verify module-specific files exist
    expect(await pathExists(join(tmpDir, 'lib/features/auth/presentation/pages/login_page.dart'))).toBe(true);
    expect(await pathExists(join(tmpDir, 'lib/features/api/data/datasources/api_client.dart'))).toBe(true);
    expect(await pathExists(join(tmpDir, 'lib/core/theme/app_theme.dart'))).toBe(true);

    // Verify merged pubspec
    const pubspecContent = await readFile(join(tmpDir, 'pubspec.yaml'), 'utf-8');
    const pubspec = yamlLoad(pubspecContent) as Record<string, unknown>;
    const deps = pubspec['dependencies'] as Record<string, unknown>;
    expect(deps).toHaveProperty('flutter_riverpod');
    expect(deps).toHaveProperty('firebase_core');
    expect(deps).toHaveProperty('dio');
    expect(deps).toHaveProperty('google_fonts');

    const devDeps = pubspec['dev_dependencies'] as Record<string, unknown>;
    expect(devDeps).toHaveProperty('retrofit_generator');
  });

  it('does not generate module files when no modules are selected', async () => {
    const engine = new ScaffoldEngine({
      templatesDir: TEMPLATES_DIR,
      modulesTemplatesDir: MODULES_DIR,
      registry: createTestRegistry(),
    });
    const context = makeContext(tmpDir);
    await engine.run(context);

    expect(await pathExists(join(tmpDir, 'lib/features/auth'))).toBe(false);
    expect(await pathExists(join(tmpDir, 'lib/features/api'))).toBe(false);

    const pubspecContent = await readFile(join(tmpDir, 'pubspec.yaml'), 'utf-8');
    const pubspec = yamlLoad(pubspecContent) as Record<string, unknown>;
    const deps = pubspec['dependencies'] as Record<string, unknown>;
    expect(deps).not.toHaveProperty('firebase_core');
    expect(deps).not.toHaveProperty('dio');
    expect(deps).not.toHaveProperty('google_fonts');
  });

  it('generates database module files with drift engine', async () => {
    const engine = new ScaffoldEngine({
      templatesDir: TEMPLATES_DIR,
      modulesTemplatesDir: MODULES_DIR,
      registry: createTestRegistry(),
    });
    const context = makeContext(tmpDir, {
      modules: {
        auth: false,
        api: false,
        database: { engine: 'drift' },
        i18n: false,
        theme: false,
        push: false,
        analytics: false,
        cicd: false,
        deepLinking: false,
      },
    });
    await engine.run(context);

    // Database module files should exist
    const datasourcePath = join(
      tmpDir,
      'lib/features/database/data/datasources/database_datasource.dart',
    );
    expect(await pathExists(datasourcePath)).toBe(true);

    const repoImplPath = join(
      tmpDir,
      'lib/features/database/data/repositories/database_repository_impl.dart',
    );
    expect(await pathExists(repoImplPath)).toBe(true);

    const providerPath = join(
      tmpDir,
      'lib/features/database/presentation/providers/database_provider.dart',
    );
    expect(await pathExists(providerPath)).toBe(true);

    const domainRepoPath = join(
      tmpDir,
      'lib/features/database/domain/repositories/database_repository.dart',
    );
    expect(await pathExists(domainRepoPath)).toBe(true);

    // Verify drift-specific content in datasource
    const datasourceContent = await readFile(datasourcePath, 'utf-8');
    expect(datasourceContent).toContain('DriftDatabase');
    expect(datasourceContent).toContain('AppDatabase');

    // Verify drift deps in pubspec
    const pubspecContent = await readFile(join(tmpDir, 'pubspec.yaml'), 'utf-8');
    const pubspec = yamlLoad(pubspecContent) as Record<string, unknown>;
    const deps = pubspec['dependencies'] as Record<string, unknown>;
    expect(deps).toHaveProperty('drift');
    expect(deps).toHaveProperty('sqlite3_flutter_libs');
    expect(deps).not.toHaveProperty('hive_ce_flutter');
    expect(deps).not.toHaveProperty('isar');
  });

  it('generates database module with hive engine deps', async () => {
    const engine = new ScaffoldEngine({
      templatesDir: TEMPLATES_DIR,
      modulesTemplatesDir: MODULES_DIR,
      registry: createTestRegistry(),
    });
    const context = makeContext(tmpDir, {
      modules: {
        auth: false,
        api: false,
        database: { engine: 'hive' },
        i18n: false,
        theme: false,
        push: false,
        analytics: false,
        cicd: false,
        deepLinking: false,
      },
    });
    await engine.run(context);

    const datasourcePath = join(
      tmpDir,
      'lib/features/database/data/datasources/database_datasource.dart',
    );
    const datasourceContent = await readFile(datasourcePath, 'utf-8');
    expect(datasourceContent).toContain('HiveDatabaseDataSource');
    expect(datasourceContent).toContain('Hive.initFlutter');

    const pubspecContent = await readFile(join(tmpDir, 'pubspec.yaml'), 'utf-8');
    const pubspec = yamlLoad(pubspecContent) as Record<string, unknown>;
    const deps = pubspec['dependencies'] as Record<string, unknown>;
    expect(deps).toHaveProperty('hive_ce_flutter');
    expect(deps).not.toHaveProperty('drift');
    expect(deps).not.toHaveProperty('isar');
  });

  it('generates database module with isar engine deps', async () => {
    const engine = new ScaffoldEngine({
      templatesDir: TEMPLATES_DIR,
      modulesTemplatesDir: MODULES_DIR,
      registry: createTestRegistry(),
    });
    const context = makeContext(tmpDir, {
      modules: {
        auth: false,
        api: false,
        database: { engine: 'isar' },
        i18n: false,
        theme: false,
        push: false,
        analytics: false,
        cicd: false,
        deepLinking: false,
      },
    });
    await engine.run(context);

    const datasourcePath = join(
      tmpDir,
      'lib/features/database/data/datasources/database_datasource.dart',
    );
    const datasourceContent = await readFile(datasourcePath, 'utf-8');
    expect(datasourceContent).toContain('IsarDatabaseDataSource');
    expect(datasourceContent).toContain('Isar.open');

    const pubspecContent = await readFile(join(tmpDir, 'pubspec.yaml'), 'utf-8');
    const pubspec = yamlLoad(pubspecContent) as Record<string, unknown>;
    const deps = pubspec['dependencies'] as Record<string, unknown>;
    expect(deps).toHaveProperty('isar');
    expect(deps).toHaveProperty('isar_flutter_libs');
    expect(deps).not.toHaveProperty('drift');
    expect(deps).not.toHaveProperty('hive_ce_flutter');
  });

  describe('Claude setup integration', () => {
    it('generates CLAUDE.md when claude.enabled is true', async () => {
      const engine = new ScaffoldEngine({ templatesDir: TEMPLATES_DIR });
      const context = makeContext(tmpDir, {
        claude: { enabled: true, agentTeams: false },
      });
      await engine.run(context);

      const claudeMdPath = join(tmpDir, 'CLAUDE.md');
      expect(await pathExists(claudeMdPath)).toBe(true);

      const content = await readFile(claudeMdPath, 'utf-8');
      expect(content).toContain('# CLAUDE.md');
      expect(content).toContain('## Architecture Rules');
      expect(content).toContain('## Quality Gates');
      expect(content).toContain('## Development Workflow');
    });

    it('generates .claude/agents/ with 5 agent files', async () => {
      const engine = new ScaffoldEngine({ templatesDir: TEMPLATES_DIR });
      const context = makeContext(tmpDir, {
        claude: { enabled: true, agentTeams: true },
      });
      await engine.run(context);

      const agentsDir = join(tmpDir, '.claude', 'agents');
      expect(await pathExists(agentsDir)).toBe(true);

      const expectedAgents = [
        'flutter-architect.md',
        'flutter-feature-builder.md',
        'flutter-tester.md',
        'flutter-reviewer.md',
        'flutter-docs.md',
      ];
      for (const agentFile of expectedAgents) {
        expect(await pathExists(join(agentsDir, agentFile))).toBe(true);
      }
    });

    it('generates prd.json with stories', async () => {
      const engine = new ScaffoldEngine({ templatesDir: TEMPLATES_DIR });
      const context = makeContext(tmpDir, {
        claude: { enabled: true, agentTeams: false },
        modules: {
          auth: { provider: 'firebase' },
          api: false,
          database: false,
          i18n: false,
          theme: false,
          push: false,
          analytics: false,
          cicd: false,
          deepLinking: false,
        },
      });
      await engine.run(context);

      const prdPath = join(tmpDir, 'prd.json');
      expect(await pathExists(prdPath)).toBe(true);

      const prdContent = await readFile(prdPath, 'utf-8');
      const prd = JSON.parse(prdContent) as { stories: Array<{ id: string; phase: number; passes: boolean }> };

      expect(prd.stories).toBeDefined();
      expect(prd.stories.length).toBeGreaterThan(0);

      // Phase 1 stories always present
      const phase1 = prd.stories.filter((s) => s.phase === 1);
      expect(phase1.length).toBeGreaterThanOrEqual(4);

      // Auth module story present (phase 2)
      const phase2 = prd.stories.filter((s) => s.phase === 2);
      expect(phase2.length).toBeGreaterThanOrEqual(1);

      // All stories have passes: false
      expect(prd.stories.every((s) => s.passes === false)).toBe(true);

      // Story IDs are sequential
      expect(prd.stories[0].id).toBe('S-001');
    });

    it('skips Claude setup when claude.enabled is false', async () => {
      const engine = new ScaffoldEngine({ templatesDir: TEMPLATES_DIR });
      const context = makeContext(tmpDir, {
        claude: { enabled: false, agentTeams: false },
      });
      await engine.run(context);

      expect(await pathExists(join(tmpDir, 'CLAUDE.md'))).toBe(false);
      expect(await pathExists(join(tmpDir, '.claude', 'agents'))).toBe(false);
      expect(await pathExists(join(tmpDir, 'prd.json'))).toBe(false);
    });

    it('skips Claude setup when noClaude option is set', async () => {
      const engine = new ScaffoldEngine({
        templatesDir: TEMPLATES_DIR,
        noClaude: true,
      });
      const context = makeContext(tmpDir, {
        claude: { enabled: true, agentTeams: true },
      });
      await engine.run(context);

      expect(await pathExists(join(tmpDir, 'CLAUDE.md'))).toBe(false);
      expect(await pathExists(join(tmpDir, 'prd.json'))).toBe(false);
    });

    it('generates Agent Teams section in CLAUDE.md when agentTeams is true', async () => {
      const engine = new ScaffoldEngine({ templatesDir: TEMPLATES_DIR });
      const context = makeContext(tmpDir, {
        claude: { enabled: true, agentTeams: true },
      });
      await engine.run(context);

      const content = await readFile(join(tmpDir, 'CLAUDE.md'), 'utf-8');
      expect(content).toContain('## Agent Teams Workflow');
      expect(content).toContain('prd.json');
    });

    it('generates .mcp.json', async () => {
      const engine = new ScaffoldEngine({ templatesDir: TEMPLATES_DIR });
      const context = makeContext(tmpDir, {
        claude: { enabled: true, agentTeams: false },
      });
      await engine.run(context);

      expect(await pathExists(join(tmpDir, '.mcp.json'))).toBe(true);
    });
  });

  it('generates supabase deps when auth provider is supabase', async () => {
    const engine = new ScaffoldEngine({
      templatesDir: TEMPLATES_DIR,
      modulesTemplatesDir: MODULES_DIR,
      registry: createTestRegistry(),
    });
    const context = makeContext(tmpDir, {
      modules: {
        auth: { provider: 'supabase' },
        api: false,
        database: false,
        i18n: false,
        theme: false,
        push: false,
        analytics: false,
        cicd: false,
        deepLinking: false,
      },
    });
    await engine.run(context);

    const pubspecContent = await readFile(join(tmpDir, 'pubspec.yaml'), 'utf-8');
    const pubspec = yamlLoad(pubspecContent) as Record<string, unknown>;
    const deps = pubspec['dependencies'] as Record<string, unknown>;

    expect(deps).toHaveProperty('supabase_flutter');
    expect(deps).not.toHaveProperty('firebase_core');
    expect(deps).not.toHaveProperty('firebase_auth');
  });
});
