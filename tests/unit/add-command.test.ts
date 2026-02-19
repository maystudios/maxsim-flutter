import { mkdtemp, rm, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { dump as yamlDump, load as yamlLoad } from 'js-yaml';
import fsExtra from 'fs-extra';

import { createAddCommand, findProjectRoot, getEnabledModuleIds, mergePubspecYaml } from '../../src/cli/commands/add.js';
import { parseConfig } from '../../src/core/config/loader.js';

const { ensureDir, writeFile: fsWriteFile } = fsExtra;

describe('createAddCommand', () => {
  it('creates a Command named "add"', () => {
    const cmd = createAddCommand();
    expect(cmd.name()).toBe('add');
  });

  it('accepts a [module] argument', () => {
    const cmd = createAddCommand();
    expect(cmd.registeredArguments[0].name()).toBe('module');
  });

  it('has --dry-run option', () => {
    const cmd = createAddCommand();
    const option = cmd.options.find((o) => o.long === '--dry-run');
    expect(option).toBeDefined();
  });

  it('has --project-dir option', () => {
    const cmd = createAddCommand();
    const option = cmd.options.find((o) => o.long === '--project-dir');
    expect(option).toBeDefined();
  });
});

describe('findProjectRoot', () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), 'maxsim-add-test-'));
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  it('returns the directory containing maxsim.config.yaml', async () => {
    await fsWriteFile(join(tmpDir, 'maxsim.config.yaml'), 'version: "1"', 'utf-8');
    const result = await findProjectRoot(tmpDir);
    expect(result).toBe(tmpDir);
  });

  it('returns null if maxsim.config.yaml is not found', async () => {
    const result = await findProjectRoot(tmpDir);
    expect(result).toBeNull();
  });

  it('finds config in parent directory', async () => {
    await fsWriteFile(join(tmpDir, 'maxsim.config.yaml'), 'version: "1"', 'utf-8');
    const subDir = join(tmpDir, 'lib', 'features');
    await ensureDir(subDir);
    const result = await findProjectRoot(subDir);
    expect(result).toBe(tmpDir);
  });

  it('returns null when config is beyond 5 levels up', async () => {
    // Create a very deep directory structure without a config
    const deepDir = join(tmpDir, 'a', 'b', 'c', 'd', 'e', 'f');
    await ensureDir(deepDir);
    // Put config at tmpDir — which is more than 5 levels above deepDir
    await fsWriteFile(join(tmpDir, 'maxsim.config.yaml'), 'version: "1"', 'utf-8');
    const result = await findProjectRoot(deepDir);
    // Should not find it — 6 levels up
    expect(result).toBeNull();
  });
});

describe('getEnabledModuleIds', () => {
  it('returns empty set when no modules configured', () => {
    const config = parseConfig({
      project: { name: 'my_app', orgId: 'com.example' },
    });
    const enabled = getEnabledModuleIds(config);
    expect(enabled.size).toBe(0);
  });

  it('detects auth module as enabled', () => {
    const config = parseConfig({
      project: { name: 'my_app', orgId: 'com.example' },
      modules: { auth: { enabled: true, provider: 'firebase' } },
    });
    const enabled = getEnabledModuleIds(config);
    expect(enabled.has('auth')).toBe(true);
  });

  it('does not include auth when explicitly false', () => {
    const config = parseConfig({
      project: { name: 'my_app', orgId: 'com.example' },
      modules: { auth: false },
    });
    const enabled = getEnabledModuleIds(config);
    expect(enabled.has('auth')).toBe(false);
  });

  it('does not include auth when enabled: false', () => {
    const config = parseConfig({
      project: { name: 'my_app', orgId: 'com.example' },
      modules: { auth: { enabled: false, provider: 'firebase' } },
    });
    const enabled = getEnabledModuleIds(config);
    expect(enabled.has('auth')).toBe(false);
  });

  it('detects multiple enabled modules', () => {
    const config = parseConfig({
      project: { name: 'my_app', orgId: 'com.example' },
      modules: {
        auth: { enabled: true, provider: 'firebase' },
        api: { enabled: true },
        theme: { enabled: true },
      },
    });
    const enabled = getEnabledModuleIds(config);
    expect(enabled.has('auth')).toBe(true);
    expect(enabled.has('api')).toBe(true);
    expect(enabled.has('theme')).toBe(true);
    expect(enabled.has('database')).toBe(false);
  });

  it('detects deep-linking module', () => {
    const config = parseConfig({
      project: { name: 'my_app', orgId: 'com.example' },
      modules: { 'deep-linking': { enabled: true } },
    });
    const enabled = getEnabledModuleIds(config);
    expect(enabled.has('deep-linking')).toBe(true);
  });

  it('detects all 9 possible modules when all enabled', () => {
    const config = parseConfig({
      project: { name: 'my_app', orgId: 'com.example' },
      modules: {
        auth: { enabled: true, provider: 'firebase' },
        api: { enabled: true },
        database: { enabled: true, engine: 'drift' },
        i18n: { enabled: true },
        theme: { enabled: true },
        push: { enabled: true, provider: 'firebase' },
        analytics: { enabled: true },
        cicd: { enabled: true, provider: 'github' },
        'deep-linking': { enabled: true },
      },
    });
    const enabled = getEnabledModuleIds(config);
    expect(enabled.size).toBe(9);
  });
});

describe('mergePubspecYaml', () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), 'maxsim-pubspec-test-'));
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  async function writePubspec(content: Record<string, unknown>): Promise<void> {
    await fsWriteFile(
      join(tmpDir, 'pubspec.yaml'),
      yamlDump(content, { indent: 2 }),
      'utf-8',
    );
  }

  async function readPubspec(): Promise<Record<string, unknown>> {
    const content = await readFile(join(tmpDir, 'pubspec.yaml'), 'utf-8');
    return yamlLoad(content) as Record<string, unknown>;
  }

  it('adds new dependencies to empty deps section', async () => {
    await writePubspec({
      name: 'my_app',
      dependencies: { flutter: { sdk: 'flutter' } },
    });

    const extraDeps = new Map([['dio', '^5.0.0']]);
    await mergePubspecYaml(tmpDir, extraDeps, new Map());

    const updated = await readPubspec();
    const deps = updated['dependencies'] as Record<string, unknown>;
    expect(deps['dio']).toBe('^5.0.0');
    // Existing deps preserved
    expect(deps['flutter']).toEqual({ sdk: 'flutter' });
  });

  it('adds new dev dependencies', async () => {
    await writePubspec({
      name: 'my_app',
      dependencies: {},
      dev_dependencies: { flutter_test: { sdk: 'flutter' } },
    });

    const extraDevDeps = new Map([['mocktail', '^1.0.0']]);
    await mergePubspecYaml(tmpDir, new Map(), extraDevDeps);

    const updated = await readPubspec();
    const devDeps = updated['dev_dependencies'] as Record<string, unknown>;
    expect(devDeps['mocktail']).toBe('^1.0.0');
  });

  it('updates existing dependency to newer version', async () => {
    await writePubspec({
      name: 'my_app',
      dependencies: { dio: '^4.0.0' },
    });

    const extraDeps = new Map([['dio', '^5.0.0']]);
    await mergePubspecYaml(tmpDir, extraDeps, new Map());

    const updated = await readPubspec();
    const deps = updated['dependencies'] as Record<string, unknown>;
    expect(deps['dio']).toBe('^5.0.0');
  });

  it('keeps existing version if newer than new dep', async () => {
    await writePubspec({
      name: 'my_app',
      dependencies: { dio: '^6.0.0' },
    });

    const extraDeps = new Map([['dio', '^5.0.0']]);
    await mergePubspecYaml(tmpDir, extraDeps, new Map());

    const updated = await readPubspec();
    const deps = updated['dependencies'] as Record<string, unknown>;
    expect(deps['dio']).toBe('^6.0.0');
  });

  it('skips SDK-style dependencies (non-string values)', async () => {
    await writePubspec({
      name: 'my_app',
      dependencies: { flutter: { sdk: 'flutter' } },
    });

    // Trying to set flutter to a string version should not overwrite SDK dep
    const extraDeps = new Map([['flutter', '^3.0.0']]);
    await mergePubspecYaml(tmpDir, extraDeps, new Map());

    const updated = await readPubspec();
    const deps = updated['dependencies'] as Record<string, unknown>;
    // SDK-style dep preserved (not a string, so not replaced)
    expect(deps['flutter']).toEqual({ sdk: 'flutter' });
  });

  it('does nothing if pubspec.yaml does not exist', async () => {
    // Should not throw
    await expect(
      mergePubspecYaml(tmpDir, new Map([['dio', '^5.0.0']]), new Map()),
    ).resolves.not.toThrow();
  });

  it('creates dependencies section if missing', async () => {
    await writePubspec({ name: 'my_app' });

    const extraDeps = new Map([['firebase_core', '^3.0.0']]);
    await mergePubspecYaml(tmpDir, extraDeps, new Map());

    const updated = await readPubspec();
    const deps = updated['dependencies'] as Record<string, unknown>;
    expect(deps['firebase_core']).toBe('^3.0.0');
  });
});
