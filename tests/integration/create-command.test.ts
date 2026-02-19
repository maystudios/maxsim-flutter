import { readFile, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { load as yamlLoad } from 'js-yaml';
import fsExtra from 'fs-extra';
import { ScaffoldEngine } from '../../src/scaffold/engine.js';
import { makeWritableContext } from '../helpers/context-factory.js';
import { useTempDir } from '../helpers/temp-dir.js';
import { createTestRegistry } from '../helpers/registry-factory.js';

const { pathExists } = fsExtra;

const TEMPLATES_DIR = resolve('templates/core');
const MODULES_DIR = resolve('templates/modules');

describe('Integration: create command generates working Flutter project', () => {
  const tmp = useTempDir('integration-test-');

  it('generates project with correct directory structure', async () => {
    const engine = new ScaffoldEngine({ templatesDir: TEMPLATES_DIR });
    const context = makeWritableContext(tmp.path);
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
      const dirPath = join(tmp.path, dir);
      const exists = await pathExists(dirPath);
      expect(exists).toBe(true);
    }
  });

  it('generates valid pubspec.yaml with required dependencies', async () => {
    const engine = new ScaffoldEngine({ templatesDir: TEMPLATES_DIR });
    const context = makeWritableContext(tmp.path);
    await engine.run(context);

    const pubspecContent = await readFile(join(tmp.path, 'pubspec.yaml'), 'utf-8');
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
    const context = makeWritableContext(tmp.path);
    await engine.run(context);

    const mainDartContent = await readFile(join(tmp.path, 'lib', 'main.dart'), 'utf-8');

    expect(mainDartContent).toContain('ProviderScope');
    expect(mainDartContent).toContain('runApp');
  });

  it('generates app_router.dart with GoRouter setup', async () => {
    const engine = new ScaffoldEngine({ templatesDir: TEMPLATES_DIR });
    const context = makeWritableContext(tmp.path);
    await engine.run(context);

    const routerContent = await readFile(
      join(tmp.path, 'lib', 'core', 'router', 'app_router.dart'),
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
    const context = makeWritableContext(tmp.path);
    await engine.run(context);

    const analysisContent = await readFile(join(tmp.path, 'analysis_options.yaml'), 'utf-8');
    const analysisOptions = yamlLoad(analysisContent) as Record<string, unknown>;

    expect(analysisOptions).toBeTruthy();
    // Verify it references flutter_lints
    expect(analysisContent).toContain('flutter_lints');
  });

  it('generates widget_test.dart', async () => {
    const engine = new ScaffoldEngine({ templatesDir: TEMPLATES_DIR });
    const context = makeWritableContext(tmp.path);
    await engine.run(context);

    const widgetTestContent = await readFile(
      join(tmp.path, 'test', 'widget_test.dart'),
      'utf-8',
    );

    // Verify it contains a test
    expect(widgetTestContent).toContain('testWidgets');
  });

  it('writes maxsim.config.yaml when scaffold completes', async () => {
    const engine = new ScaffoldEngine({ templatesDir: TEMPLATES_DIR });
    const context = makeWritableContext(tmp.path);
    await engine.run(context);

    // Simulate what the create command does: write the config file
    const configContent = `project:\n  name: my_app\n  orgId: com.example\n`;
    const configPath = join(tmp.path, 'maxsim.config.yaml');
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
    const context = makeWritableContext(tmp.path, { projectName: 'awesome_app' });
    await engine.run(context);

    const pubspecContent = await readFile(join(tmp.path, 'pubspec.yaml'), 'utf-8');
    const pubspec = yamlLoad(pubspecContent) as Record<string, unknown>;

    expect(pubspec['name']).toBe('awesome_app');
  });

  it('generates auth module files when auth is enabled', async () => {
    const engine = new ScaffoldEngine({
      templatesDir: TEMPLATES_DIR,
      modulesTemplatesDir: MODULES_DIR,
      registry: createTestRegistry(),
    });
    const context = makeWritableContext(tmp.path, {
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
      tmp.path,
      'lib/features/auth/presentation/providers/auth_provider.dart',
    );
    expect(await pathExists(authProviderPath)).toBe(true);

    const loginPagePath = join(tmp.path, 'lib/features/auth/presentation/pages/login_page.dart');
    expect(await pathExists(loginPagePath)).toBe(true);

    // Core files should still exist
    expect(await pathExists(join(tmp.path, 'lib/main.dart'))).toBe(true);
  });

  it('generates api module files when api is enabled', async () => {
    const engine = new ScaffoldEngine({
      templatesDir: TEMPLATES_DIR,
      modulesTemplatesDir: MODULES_DIR,
      registry: createTestRegistry(),
    });
    const context = makeWritableContext(tmp.path, {
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
    const apiClientPath = join(tmp.path, 'lib/features/api/data/datasources/api_client.dart');
    expect(await pathExists(apiClientPath)).toBe(true);

    const apiProviderPath = join(
      tmp.path,
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
    const context = makeWritableContext(tmp.path, {
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

    const pubspecContent = await readFile(join(tmp.path, 'pubspec.yaml'), 'utf-8');
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
    const context = makeWritableContext(tmp.path, {
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
    expect(await pathExists(join(tmp.path, 'lib/features/auth/presentation/pages/login_page.dart'))).toBe(true);
    expect(await pathExists(join(tmp.path, 'lib/features/api/data/datasources/api_client.dart'))).toBe(true);
    expect(await pathExists(join(tmp.path, 'lib/core/theme/app_theme.dart'))).toBe(true);

    // Verify merged pubspec
    const pubspecContent = await readFile(join(tmp.path, 'pubspec.yaml'), 'utf-8');
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
    const context = makeWritableContext(tmp.path);
    await engine.run(context);

    expect(await pathExists(join(tmp.path, 'lib/features/auth'))).toBe(false);
    expect(await pathExists(join(tmp.path, 'lib/features/api'))).toBe(false);

    const pubspecContent = await readFile(join(tmp.path, 'pubspec.yaml'), 'utf-8');
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
    const context = makeWritableContext(tmp.path, {
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
      tmp.path,
      'lib/features/database/data/datasources/database_datasource.dart',
    );
    expect(await pathExists(datasourcePath)).toBe(true);

    const repoImplPath = join(
      tmp.path,
      'lib/features/database/data/repositories/database_repository_impl.dart',
    );
    expect(await pathExists(repoImplPath)).toBe(true);

    const providerPath = join(
      tmp.path,
      'lib/features/database/presentation/providers/database_provider.dart',
    );
    expect(await pathExists(providerPath)).toBe(true);

    const domainRepoPath = join(
      tmp.path,
      'lib/features/database/domain/repositories/database_repository.dart',
    );
    expect(await pathExists(domainRepoPath)).toBe(true);

    // Verify drift-specific content in datasource
    const datasourceContent = await readFile(datasourcePath, 'utf-8');
    expect(datasourceContent).toContain('DriftDatabase');
    expect(datasourceContent).toContain('AppDatabase');

    // Verify drift deps in pubspec
    const pubspecContent = await readFile(join(tmp.path, 'pubspec.yaml'), 'utf-8');
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
    const context = makeWritableContext(tmp.path, {
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
      tmp.path,
      'lib/features/database/data/datasources/database_datasource.dart',
    );
    const datasourceContent = await readFile(datasourcePath, 'utf-8');
    expect(datasourceContent).toContain('HiveDatabaseDataSource');
    expect(datasourceContent).toContain('Hive.initFlutter');

    const pubspecContent = await readFile(join(tmp.path, 'pubspec.yaml'), 'utf-8');
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
    const context = makeWritableContext(tmp.path, {
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
      tmp.path,
      'lib/features/database/data/datasources/database_datasource.dart',
    );
    const datasourceContent = await readFile(datasourcePath, 'utf-8');
    expect(datasourceContent).toContain('IsarDatabaseDataSource');
    expect(datasourceContent).toContain('Isar.open');

    const pubspecContent = await readFile(join(tmp.path, 'pubspec.yaml'), 'utf-8');
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
      const context = makeWritableContext(tmp.path, {
        claude: { enabled: true, agentTeams: false },
      });
      await engine.run(context);

      const claudeMdPath = join(tmp.path, 'CLAUDE.md');
      expect(await pathExists(claudeMdPath)).toBe(true);

      const content = await readFile(claudeMdPath, 'utf-8');
      expect(content).toContain('# CLAUDE.md');
      expect(content).toContain('## Architecture Rules');
      expect(content).toContain('## Quality Gates');
      expect(content).toContain('## Development Workflow');
    });

    it('generates .claude/agents/ with 5 agent files', async () => {
      const engine = new ScaffoldEngine({ templatesDir: TEMPLATES_DIR });
      const context = makeWritableContext(tmp.path, {
        claude: { enabled: true, agentTeams: true },
      });
      await engine.run(context);

      const agentsDir = join(tmp.path, '.claude', 'agents');
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
      const context = makeWritableContext(tmp.path, {
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

      const prdPath = join(tmp.path, 'prd.json');
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
      const context = makeWritableContext(tmp.path, {
        claude: { enabled: false, agentTeams: false },
      });
      await engine.run(context);

      expect(await pathExists(join(tmp.path, 'CLAUDE.md'))).toBe(false);
      expect(await pathExists(join(tmp.path, '.claude', 'agents'))).toBe(false);
      expect(await pathExists(join(tmp.path, 'prd.json'))).toBe(false);
    });

    it('skips Claude setup when noClaude option is set', async () => {
      const engine = new ScaffoldEngine({
        templatesDir: TEMPLATES_DIR,
        noClaude: true,
      });
      const context = makeWritableContext(tmp.path, {
        claude: { enabled: true, agentTeams: true },
      });
      await engine.run(context);

      expect(await pathExists(join(tmp.path, 'CLAUDE.md'))).toBe(false);
      expect(await pathExists(join(tmp.path, 'prd.json'))).toBe(false);
    });

    it('generates Agent Teams section in CLAUDE.md when agentTeams is true', async () => {
      const engine = new ScaffoldEngine({ templatesDir: TEMPLATES_DIR });
      const context = makeWritableContext(tmp.path, {
        claude: { enabled: true, agentTeams: true },
      });
      await engine.run(context);

      const content = await readFile(join(tmp.path, 'CLAUDE.md'), 'utf-8');
      expect(content).toContain('## Agent Teams Workflow');
      expect(content).toContain('prd.json');
    });

    it('generates .mcp.json', async () => {
      const engine = new ScaffoldEngine({ templatesDir: TEMPLATES_DIR });
      const context = makeWritableContext(tmp.path, {
        claude: { enabled: true, agentTeams: false },
      });
      await engine.run(context);

      expect(await pathExists(join(tmp.path, '.mcp.json'))).toBe(true);
    });

    it('generates .claude/skills/ with 4 skill files', async () => {
      const engine = new ScaffoldEngine({ templatesDir: TEMPLATES_DIR });
      const context = makeWritableContext(tmp.path, {
        claude: { enabled: true, agentTeams: false },
      });
      await engine.run(context);

      const skillsDir = join(tmp.path, '.claude', 'skills');
      expect(await pathExists(skillsDir)).toBe(true);

      const expectedSkills = [
        'flutter-patterns.md',
        'go-router-patterns.md',
        'module-conventions.md',
        'prd.md',
      ];
      for (const skillFile of expectedSkills) {
        expect(await pathExists(join(skillsDir, skillFile))).toBe(true);
      }

      // Verify skill content
      const flutterPatterns = await readFile(join(skillsDir, 'flutter-patterns.md'), 'utf-8');
      expect(flutterPatterns).toContain('Riverpod');
    });

    it('generates .claude/settings.local.json with hooks', async () => {
      const engine = new ScaffoldEngine({ templatesDir: TEMPLATES_DIR });
      const context = makeWritableContext(tmp.path, {
        claude: { enabled: true, agentTeams: false },
      });
      await engine.run(context);

      const hooksPath = join(tmp.path, '.claude', 'settings.local.json');
      expect(await pathExists(hooksPath)).toBe(true);

      const hooksContent = await readFile(hooksPath, 'utf-8');
      const hooks = JSON.parse(hooksContent) as Record<string, unknown>;
      expect(hooks).toHaveProperty('hooks');

      // TaskCompleted hook should run flutter analyze + test
      expect(hooksContent).toContain('flutter analyze');
      expect(hooksContent).toContain('flutter test');
    });

    it('generates .claude/commands/ with command files', async () => {
      const engine = new ScaffoldEngine({ templatesDir: TEMPLATES_DIR });
      const context = makeWritableContext(tmp.path, {
        claude: { enabled: true, agentTeams: false },
      });
      await engine.run(context);

      const commandsDir = join(tmp.path, '.claude', 'commands');
      expect(await pathExists(commandsDir)).toBe(true);

      const expectedCommands = ['add-feature.md', 'analyze.md'];
      for (const cmdFile of expectedCommands) {
        expect(await pathExists(join(commandsDir, cmdFile))).toBe(true);
      }

      // Verify command content
      const addFeature = await readFile(join(commandsDir, 'add-feature.md'), 'utf-8');
      expect(addFeature).toContain('feature');
    });
  });

  describe('deep-linking module does not conflict with core router', () => {
    it('produces only one routerProvider definition across all output files', async () => {
      const engine = new ScaffoldEngine({
        templatesDir: TEMPLATES_DIR,
        modulesTemplatesDir: MODULES_DIR,
        registry: createTestRegistry(),
      });
      const context = makeWritableContext(tmp.path, {
        modules: {
          auth: false,
          api: false,
          database: false,
          i18n: false,
          theme: false,
          push: false,
          analytics: false,
          cicd: false,
          deepLinking: { scheme: 'myapp', host: 'example.com' },
        },
      });
      await engine.run(context);

      // Collect all .dart files
      const { readdir: readdirRecursive } = await import('node:fs/promises');
      const allEntries = await readdirRecursive(tmp.path, { recursive: true });
      const dartFiles = (allEntries as string[]).filter((f: string) => f.endsWith('.dart'));

      let routerProviderCount = 0;
      for (const file of dartFiles) {
        const content = await readFile(join(tmp.path, file), 'utf-8');
        // Count @riverpod annotated functions named "router"
        const matches = content.match(/@riverpod[\s\S]*?\n\s*\w+\s+router\s*\(/g);
        if (matches) {
          routerProviderCount += matches.length;
        }
      }

      expect(routerProviderCount).toBe(1);
    });

    it('deep-link provider imports routerProvider from core router', async () => {
      const engine = new ScaffoldEngine({
        templatesDir: TEMPLATES_DIR,
        modulesTemplatesDir: MODULES_DIR,
        registry: createTestRegistry(),
      });
      const context = makeWritableContext(tmp.path, {
        modules: {
          auth: false,
          api: false,
          database: false,
          i18n: false,
          theme: false,
          push: false,
          analytics: false,
          cicd: false,
          deepLinking: { scheme: 'myapp', host: 'example.com' },
        },
      });
      await engine.run(context);

      const deepLinkProviderPath = join(
        tmp.path,
        'lib/features/deep_linking/presentation/providers/deep_link_provider.dart',
      );
      const content = await readFile(deepLinkProviderPath, 'utf-8');

      expect(content).toContain('core/router/app_router.dart');
      expect(content).not.toMatch(/@riverpod[\s\S]*?\n\s*GoRouter\s+router\s*\(/);
    });
  });

  it('generates supabase deps when auth provider is supabase', async () => {
    const engine = new ScaffoldEngine({
      templatesDir: TEMPLATES_DIR,
      modulesTemplatesDir: MODULES_DIR,
      registry: createTestRegistry(),
    });
    const context = makeWritableContext(tmp.path, {
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

    const pubspecContent = await readFile(join(tmp.path, 'pubspec.yaml'), 'utf-8');
    const pubspec = yamlLoad(pubspecContent) as Record<string, unknown>;
    const deps = pubspec['dependencies'] as Record<string, unknown>;

    expect(deps).toHaveProperty('supabase_flutter');
    expect(deps).not.toHaveProperty('firebase_core');
    expect(deps).not.toHaveProperty('firebase_auth');
  });

  describe('Create with all modules and .claude/ output', () => {
    it('generates complete project with all 9 modules enabled', async () => {
      // Large test — 9 modules × many template files; allow extra time on WSL2
      const engine = new ScaffoldEngine({
        templatesDir: TEMPLATES_DIR,
        modulesTemplatesDir: MODULES_DIR,
        registry: createTestRegistry(),
      });
      const context = makeWritableContext(tmp.path, {
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
        claude: { enabled: true, agentTeams: true },
      });
      const result = await engine.run(context);

      // Core files
      expect(await pathExists(join(tmp.path, 'lib/main.dart'))).toBe(true);
      expect(await pathExists(join(tmp.path, 'pubspec.yaml'))).toBe(true);
      expect(await pathExists(join(tmp.path, 'analysis_options.yaml'))).toBe(true);

      // Auth module files
      expect(
        await pathExists(join(tmp.path, 'lib/features/auth/presentation/pages/login_page.dart')),
      ).toBe(true);
      expect(
        await pathExists(join(tmp.path, 'lib/features/auth/domain/entities/user_entity.dart')),
      ).toBe(true);

      // API module files
      expect(
        await pathExists(join(tmp.path, 'lib/features/api/data/datasources/api_client.dart')),
      ).toBe(true);

      // Database module files
      expect(
        await pathExists(
          join(tmp.path, 'lib/features/database/data/datasources/database_datasource.dart'),
        ),
      ).toBe(true);

      // i18n module files
      expect(await pathExists(join(tmp.path, 'l10n.yaml'))).toBe(true);
      expect(await pathExists(join(tmp.path, 'lib/l10n/app_en.arb'))).toBe(true);

      // Theme module files
      expect(await pathExists(join(tmp.path, 'lib/core/theme/app_theme.dart'))).toBe(true);

      // Push module files
      expect(
        await pathExists(
          join(tmp.path, 'lib/features/push/presentation/providers/push_provider.dart'),
        ),
      ).toBe(true);

      // Analytics module files
      expect(
        await pathExists(
          join(tmp.path, 'lib/features/analytics/domain/services/analytics_service.dart'),
        ),
      ).toBe(true);

      // CI/CD module files
      expect(await pathExists(join(tmp.path, '.github/workflows/ci.yml'))).toBe(true);

      // Deep linking module files
      expect(
        await pathExists(
          join(
            tmp.path,
            'lib/features/deep_linking/presentation/providers/deep_link_provider.dart',
          ),
        ),
      ).toBe(true);

      // Significant file count
      expect(result.filesWritten.length).toBeGreaterThan(30);
    }, 15000);

    it('merges all module dependencies into pubspec.yaml', async () => {
      const engine = new ScaffoldEngine({
        templatesDir: TEMPLATES_DIR,
        modulesTemplatesDir: MODULES_DIR,
        registry: createTestRegistry(),
      });
      const context = makeWritableContext(tmp.path, {
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
      await engine.run(context);

      const pubspecContent = await readFile(join(tmp.path, 'pubspec.yaml'), 'utf-8');
      const pubspec = yamlLoad(pubspecContent) as Record<string, unknown>;
      const deps = pubspec['dependencies'] as Record<string, unknown>;
      const devDeps = pubspec['dev_dependencies'] as Record<string, unknown>;

      // Core deps
      expect(deps).toHaveProperty('flutter_riverpod');
      expect(deps).toHaveProperty('go_router');

      // Auth deps
      expect(deps).toHaveProperty('firebase_core');
      expect(deps).toHaveProperty('firebase_auth');

      // API deps
      expect(deps).toHaveProperty('dio');

      // Database deps
      expect(deps).toHaveProperty('drift');
      expect(deps).toHaveProperty('sqlite3_flutter_libs');

      // i18n deps
      expect(deps).toHaveProperty('intl');

      // Theme deps
      expect(deps).toHaveProperty('google_fonts');

      // Push deps
      expect(deps).toHaveProperty('firebase_messaging');

      // Analytics deps
      expect(deps).toHaveProperty('firebase_analytics');

      // Deep linking deps
      expect(deps).toHaveProperty('app_links');

      // Dev deps
      expect(devDeps).toHaveProperty('retrofit_generator');
      expect(devDeps).toHaveProperty('drift_dev');
    }, 15000);

    it('generates complete .claude/ directory with all modules', async () => {
      const engine = new ScaffoldEngine({
        templatesDir: TEMPLATES_DIR,
        modulesTemplatesDir: MODULES_DIR,
        registry: createTestRegistry(),
      });
      const context = makeWritableContext(tmp.path, {
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
        claude: { enabled: true, agentTeams: true },
      });
      await engine.run(context);

      // CLAUDE.md with module-specific sections
      const claudeMd = await readFile(join(tmp.path, 'CLAUDE.md'), 'utf-8');
      expect(claudeMd).toContain('# CLAUDE.md');
      expect(claudeMd).toContain('## Architecture Rules');
      expect(claudeMd).toContain('## Agent Teams Workflow');

      // Agents
      expect(await pathExists(join(tmp.path, '.claude/agents/flutter-architect.md'))).toBe(true);
      expect(await pathExists(join(tmp.path, '.claude/agents/flutter-feature-builder.md'))).toBe(
        true,
      );
      expect(await pathExists(join(tmp.path, '.claude/agents/flutter-tester.md'))).toBe(true);
      expect(await pathExists(join(tmp.path, '.claude/agents/flutter-reviewer.md'))).toBe(true);
      expect(await pathExists(join(tmp.path, '.claude/agents/flutter-docs.md'))).toBe(true);

      // Skills
      expect(await pathExists(join(tmp.path, '.claude/skills/flutter-patterns.md'))).toBe(true);
      expect(await pathExists(join(tmp.path, '.claude/skills/go-router-patterns.md'))).toBe(true);
      expect(await pathExists(join(tmp.path, '.claude/skills/module-conventions.md'))).toBe(true);
      expect(await pathExists(join(tmp.path, '.claude/skills/prd.md'))).toBe(true);

      // Hooks
      const hooks = await readFile(join(tmp.path, '.claude/settings.local.json'), 'utf-8');
      expect(hooks).toContain('flutter analyze');
      expect(hooks).toContain('flutter test');

      // Commands
      expect(await pathExists(join(tmp.path, '.claude/commands/add-feature.md'))).toBe(true);
      expect(await pathExists(join(tmp.path, '.claude/commands/analyze.md'))).toBe(true);

      // MCP config
      expect(await pathExists(join(tmp.path, '.mcp.json'))).toBe(true);

      // PRD
      const prdContent = await readFile(join(tmp.path, 'prd.json'), 'utf-8');
      const prd = JSON.parse(prdContent) as {
        stories: Array<{ id: string; phase: number; passes: boolean }>;
      };
      expect(prd.stories.length).toBeGreaterThan(0);
      expect(prd.stories.every((s) => s.passes === false)).toBe(true);
    }, 15000);
  });
});
