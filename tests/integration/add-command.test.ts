import { readFile, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { load as yamlLoad, dump as yamlDump } from 'js-yaml';
import fsExtra from 'fs-extra';

import { ScaffoldEngine } from '../../src/scaffold/engine.js';
import { makeWritableContext } from '../helpers/context-factory.js';
import { useTempDir } from '../helpers/temp-dir.js';
import { createTestRegistry } from '../helpers/registry-factory.js';
import {
  findProjectRoot,
  getEnabledModuleIds,
  mergePubspecYaml,
  createAddCommand,
} from '../../src/cli/commands/add.js';
import { parseConfig } from '../../src/core/config/loader.js';

const { pathExists } = fsExtra;

const TEMPLATES_DIR = resolve('templates/core');
const MODULES_DIR = resolve('templates/modules');

function makeContext(
  outputDir: string,
  overrides: Partial<Parameters<typeof makeWritableContext>[1]> = {},
) {
  return makeWritableContext(outputDir, overrides);
}

describe('Integration: add command structure', () => {
  it('createAddCommand returns command named "add"', () => {
    const cmd = createAddCommand();
    expect(cmd.name()).toBe('add');
  });

  it('add command has --dry-run and --project-dir options', () => {
    const cmd = createAddCommand();
    const dryRun = cmd.options.find((o) => o.long === '--dry-run');
    const projectDir = cmd.options.find((o) => o.long === '--project-dir');
    expect(dryRun).toBeDefined();
    expect(projectDir).toBeDefined();
  });
});

describe('Integration: findProjectRoot in a scaffolded project', () => {
  const tmp = useTempDir('add-findroot-test-');

  it('finds project root after scaffold + config write', async () => {
    const tmpDir = tmp.path;
    const engine = new ScaffoldEngine({ templatesDir: TEMPLATES_DIR });
    await engine.run(makeContext(tmpDir));

    await writeFile(
      join(tmpDir, 'maxsim.config.yaml'),
      yamlDump({ project: { name: 'my_app', orgId: 'com.example' }, modules: {} }),
      'utf-8',
    );

    const root = await findProjectRoot(tmpDir);
    expect(root).toBe(tmpDir);
  });

  it('finds project root from inside lib/features subdirectory', async () => {
    const tmpDir = tmp.path;
    const engine = new ScaffoldEngine({ templatesDir: TEMPLATES_DIR });
    await engine.run(makeContext(tmpDir));

    await writeFile(
      join(tmpDir, 'maxsim.config.yaml'),
      yamlDump({ project: { name: 'my_app', orgId: 'com.example' }, modules: {} }),
      'utf-8',
    );

    // lib/features is created by ScaffoldEngine
    const featuresDir = join(tmpDir, 'lib', 'features');
    const root = await findProjectRoot(featuresDir);
    expect(root).toBe(tmpDir);
  });

  it('returns null if no config in scaffolded structure', async () => {
    const tmpDir = tmp.path;
    const engine = new ScaffoldEngine({ templatesDir: TEMPLATES_DIR });
    await engine.run(makeContext(tmpDir));

    // No maxsim.config.yaml written — should not find root
    const root = await findProjectRoot(tmpDir);
    expect(root).toBeNull();
  });
});

describe('Integration: getEnabledModuleIds reflects project config state', () => {
  it('returns empty set for base project with no modules', () => {
    const config = parseConfig({
      project: { name: 'my_app', orgId: 'com.example' },
      modules: {},
    });
    expect(getEnabledModuleIds(config).size).toBe(0);
  });

  it('detects auth as enabled after simulated add-auth operation', () => {
    const config = parseConfig({
      project: { name: 'my_app', orgId: 'com.example' },
      modules: { auth: { enabled: true, provider: 'firebase' } },
    });
    const enabled = getEnabledModuleIds(config);
    expect(enabled.has('auth')).toBe(true);
    expect(enabled.size).toBe(1);
  });

  it('detects auth and api as enabled, not database', () => {
    const config = parseConfig({
      project: { name: 'my_app', orgId: 'com.example' },
      modules: {
        auth: { enabled: true, provider: 'firebase' },
        api: { enabled: true },
      },
    });
    const enabled = getEnabledModuleIds(config);
    expect(enabled.has('auth')).toBe(true);
    expect(enabled.has('api')).toBe(true);
    expect(enabled.has('database')).toBe(false);
    expect(enabled.size).toBe(2);
  });
});

describe('Integration: mergePubspecYaml on a scaffolded project', () => {
  const tmp = useTempDir('add-pubspec-test-');

  it('merges auth firebase deps into a live scaffolded pubspec.yaml', async () => {
    const tmpDir = tmp.path;
    const engine = new ScaffoldEngine({ templatesDir: TEMPLATES_DIR });
    await engine.run(makeContext(tmpDir));

    const authDeps = new Map([
      ['firebase_core', '^3.0.0'],
      ['firebase_auth', '^5.0.0'],
    ]);
    await mergePubspecYaml(tmpDir, authDeps, new Map());

    const content = await readFile(join(tmpDir, 'pubspec.yaml'), 'utf-8');
    const pubspec = yamlLoad(content) as Record<string, unknown>;
    const deps = pubspec['dependencies'] as Record<string, unknown>;

    expect(deps).toHaveProperty('firebase_core', '^3.0.0');
    expect(deps).toHaveProperty('firebase_auth', '^5.0.0');
    // Existing core deps are preserved
    expect(deps).toHaveProperty('flutter_riverpod');
    expect(deps).toHaveProperty('go_router');
  });

  it('merges api deps and dev_dependencies into scaffolded pubspec', async () => {
    const tmpDir = tmp.path;
    const engine = new ScaffoldEngine({ templatesDir: TEMPLATES_DIR });
    await engine.run(makeContext(tmpDir));

    const apiDeps = new Map([['dio', '^5.4.0']]);
    const apiDevDeps = new Map([
      ['retrofit_generator', '^9.0.0'],
      ['build_runner', '^2.4.0'],
    ]);
    await mergePubspecYaml(tmpDir, apiDeps, apiDevDeps);

    const content = await readFile(join(tmpDir, 'pubspec.yaml'), 'utf-8');
    const pubspec = yamlLoad(content) as Record<string, unknown>;
    const deps = pubspec['dependencies'] as Record<string, unknown>;
    const devDeps = pubspec['dev_dependencies'] as Record<string, unknown>;

    expect(deps).toHaveProperty('dio', '^5.4.0');
    expect(devDeps).toHaveProperty('retrofit_generator', '^9.0.0');
    // build_runner already exists in the scaffolded project; it should still be present
    expect(devDeps).toHaveProperty('build_runner');
  });

  it('does not downgrade an existing dependency', async () => {
    const tmpDir = tmp.path;
    const engine = new ScaffoldEngine({ templatesDir: TEMPLATES_DIR });
    await engine.run(makeContext(tmpDir));

    // Read current go_router version from scaffolded pubspec
    const before = await readFile(join(tmpDir, 'pubspec.yaml'), 'utf-8');
    const pubspecBefore = yamlLoad(before) as Record<string, unknown>;
    const depsBefore = pubspecBefore['dependencies'] as Record<string, unknown>;
    const existingVersion = depsBefore['go_router'] as string;

    // Attempt to merge an older version
    await mergePubspecYaml(tmpDir, new Map([['go_router', '^1.0.0']]), new Map());

    const after = await readFile(join(tmpDir, 'pubspec.yaml'), 'utf-8');
    const pubspecAfter = yamlLoad(after) as Record<string, unknown>;
    const depsAfter = pubspecAfter['dependencies'] as Record<string, unknown>;

    // Newer version should be preserved
    expect(depsAfter['go_router']).toBe(existingVersion);
  });
});

describe('Integration: adding modules to an existing project', () => {
  const tmp = useTempDir('add-module-test-');

  it('generates auth module files when added to a base project', async () => {
    const tmpDir = tmp.path;
    // Step 1: Scaffold the base project (no modules)
    const baseEngine = new ScaffoldEngine({
      templatesDir: TEMPLATES_DIR,
      modulesTemplatesDir: MODULES_DIR,
      registry: createTestRegistry(),
    });
    await baseEngine.run(makeContext(tmpDir));

    // Auth directory should not exist yet
    expect(await pathExists(join(tmpDir, 'lib/features/auth'))).toBe(false);

    // Step 2: Simulate the add command — run engine again with auth enabled + never-overwrite
    const addEngine = new ScaffoldEngine({
      templatesDir: TEMPLATES_DIR,
      modulesTemplatesDir: MODULES_DIR,
      registry: createTestRegistry(),
    });
    const addContext = makeContext(tmpDir, {
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
      scaffold: {
        dryRun: false,
        overwrite: 'never',
        postProcessors: {
          dartFormat: false,
          flutterPubGet: false,
          buildRunner: false,
        },
      },
    });
    await addEngine.run(addContext);

    // Auth module files should now be generated
    expect(
      await pathExists(
        join(tmpDir, 'lib/features/auth/presentation/providers/auth_provider.dart'),
      ),
    ).toBe(true);
    expect(
      await pathExists(
        join(tmpDir, 'lib/features/auth/presentation/pages/login_page.dart'),
      ),
    ).toBe(true);
    expect(
      await pathExists(
        join(tmpDir, 'lib/features/auth/domain/entities/user_entity.dart'),
      ),
    ).toBe(true);
  });

  it('does not overwrite existing core files when adding a module', async () => {
    const tmpDir = tmp.path;
    // Create base project
    const baseEngine = new ScaffoldEngine({ templatesDir: TEMPLATES_DIR });
    await baseEngine.run(makeContext(tmpDir));

    const mainDartBefore = await readFile(join(tmpDir, 'lib/main.dart'), 'utf-8');

    // Add theme module with never-overwrite
    const addEngine = new ScaffoldEngine({
      templatesDir: TEMPLATES_DIR,
      modulesTemplatesDir: MODULES_DIR,
      registry: createTestRegistry(),
    });
    await addEngine.run(
      makeContext(tmpDir, {
        modules: {
          auth: false,
          api: false,
          database: false,
          i18n: false,
          theme: { seedColor: '#6750A4', darkMode: true },
          push: false,
          analytics: false,
          cicd: false,
          deepLinking: false,
        },
        scaffold: {
          dryRun: false,
          overwrite: 'never',
          postProcessors: {
            dartFormat: false,
            flutterPubGet: false,
            buildRunner: false,
          },
        },
      }),
    );

    // Core main.dart should be unchanged (overwrite: never)
    const mainDartAfter = await readFile(join(tmpDir, 'lib/main.dart'), 'utf-8');
    expect(mainDartAfter).toBe(mainDartBefore);

    // Theme file should be generated
    expect(await pathExists(join(tmpDir, 'lib/core/theme/app_theme.dart'))).toBe(true);
  });

  it('pubspec.yaml receives module dependencies after add', async () => {
    const tmpDir = tmp.path;
    // Scaffold base project
    const engine = new ScaffoldEngine({ templatesDir: TEMPLATES_DIR });
    await engine.run(makeContext(tmpDir));

    // Simulate add command merging auth dependencies
    const authDeps = new Map([
      ['firebase_core', '^3.0.0'],
      ['firebase_auth', '^5.0.0'],
      ['firebase_ui_auth', '^1.0.0'],
    ]);
    await mergePubspecYaml(tmpDir, authDeps, new Map());

    const content = await readFile(join(tmpDir, 'pubspec.yaml'), 'utf-8');
    const pubspec = yamlLoad(content) as Record<string, unknown>;
    const deps = pubspec['dependencies'] as Record<string, unknown>;

    expect(deps).toHaveProperty('firebase_core');
    expect(deps).toHaveProperty('firebase_auth');
    expect(deps).toHaveProperty('firebase_ui_auth');
    // Core deps still present
    expect(deps).toHaveProperty('flutter_riverpod');
    expect(deps).toHaveProperty('go_router');
  });

  it('maxsim.config.yaml is updated after adding auth module', async () => {
    const tmpDir = tmp.path;
    // Scaffold base project
    const engine = new ScaffoldEngine({ templatesDir: TEMPLATES_DIR });
    await engine.run(makeContext(tmpDir));

    const configPath = join(tmpDir, 'maxsim.config.yaml');

    // Write initial config (as create command would)
    const initialConfig = {
      project: { name: 'my_app', orgId: 'com.example' },
      modules: {},
    };
    await writeFile(configPath, yamlDump(initialConfig), 'utf-8');

    // Simulate add command updating config
    const updatedConfig = {
      project: { name: 'my_app', orgId: 'com.example' },
      modules: { auth: { enabled: true, provider: 'firebase' } },
    };
    await writeFile(configPath, yamlDump(updatedConfig), 'utf-8');

    // Verify config reflects new module
    const raw = await readFile(configPath, 'utf-8');
    const parsed = yamlLoad(raw) as Record<string, unknown>;
    const modules = parsed['modules'] as Record<string, unknown>;
    expect(modules).toHaveProperty('auth');
    const auth = modules['auth'] as Record<string, unknown>;
    expect(auth['enabled']).toBe(true);
    expect(auth['provider']).toBe('firebase');

    // getEnabledModuleIds must pick up the updated module
    const config = parseConfig(updatedConfig);
    const enabled = getEnabledModuleIds(config);
    expect(enabled.has('auth')).toBe(true);
  });
});

describe('Integration: add command --dry-run behavior', () => {
  const tmp = useTempDir('add-dryrun-test-');

  it('engine with dryRun: true does not write any files to disk', async () => {
    const tmpDir = tmp.path;
    const engine = new ScaffoldEngine({ templatesDir: TEMPLATES_DIR });
    const context = makeContext(tmpDir, {
      scaffold: {
        dryRun: true,
        overwrite: 'always',
        postProcessors: {
          dartFormat: false,
          flutterPubGet: false,
          buildRunner: false,
        },
      },
    });
    await engine.run(context);

    // No files should be written
    expect(await pathExists(join(tmpDir, 'lib/main.dart'))).toBe(false);
    expect(await pathExists(join(tmpDir, 'pubspec.yaml'))).toBe(false);
    expect(await pathExists(join(tmpDir, 'analysis_options.yaml'))).toBe(false);
  });

  it('engine with dryRun: true does not write auth module files to disk', async () => {
    const tmpDir = tmp.path;
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
      scaffold: {
        dryRun: true,
        overwrite: 'always',
        postProcessors: {
          dartFormat: false,
          flutterPubGet: false,
          buildRunner: false,
        },
      },
    });
    await engine.run(context);

    // No files should actually land on disk in dry-run mode
    expect(await pathExists(join(tmpDir, 'lib/features/auth'))).toBe(false);
    expect(await pathExists(join(tmpDir, 'lib/main.dart'))).toBe(false);
  });
});
