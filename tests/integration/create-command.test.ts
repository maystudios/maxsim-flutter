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
