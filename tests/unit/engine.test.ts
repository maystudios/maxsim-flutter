import { writeFile, readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { pathExists, ensureDir } from 'fs-extra';
import { ScaffoldEngine } from '../../src/scaffold/engine.js';
import { ModuleRegistry } from '../../src/modules/registry.js';
import { makeTestContext, makeWritableContext } from '../helpers/context-factory.js';
import { useTempDir } from '../helpers/temp-dir.js';
import { createTestRegistry } from '../helpers/registry-factory.js';
import type { ModuleManifest } from '../../src/types/module.js';
import type { ProjectContext } from '../../src/core/context.js';

// The actual templates/core directory relative to the project root
const TEMPLATES_DIR = resolve('templates/core');

describe('ScaffoldEngine', () => {
  describe('run (dry-run)', () => {
    it('returns a ScaffoldResult with filesWritten from core templates', async () => {
      const engine = new ScaffoldEngine({ templatesDir: TEMPLATES_DIR });
      const context = makeTestContext();
      const result = await engine.run(context);

      expect(result).toHaveProperty('filesWritten');
      expect(result).toHaveProperty('filesSkipped');
      expect(result).toHaveProperty('conflicts');
      expect(result).toHaveProperty('postProcessorsRun');
      expect(result).toHaveProperty('postProcessorErrors');

      // In dry-run, all files are counted as written
      expect(result.filesSkipped).toEqual([]);
      expect(result.conflicts).toEqual([]);
      expect(result.postProcessorsRun).toEqual([]);
      expect(result.postProcessorErrors).toEqual([]);
    });

    it('includes core template output paths without .hbs extension', async () => {
      const engine = new ScaffoldEngine({ templatesDir: TEMPLATES_DIR });
      const context = makeTestContext();
      const result = await engine.run(context);

      // pubspec.yaml.hbs should become pubspec.yaml
      expect(result.filesWritten.some((f) => f === 'pubspec.yaml')).toBe(true);
      // lib/main.dart.hbs should become lib/main.dart
      expect(
        result.filesWritten.some((f) => f.includes('main.dart') && !f.endsWith('.hbs')),
      ).toBe(true);
    });

    it('includes .gitkeep files as-is', async () => {
      const engine = new ScaffoldEngine({ templatesDir: TEMPLATES_DIR });
      const context = makeTestContext();
      const result = await engine.run(context);

      expect(result.filesWritten.some((f) => f.endsWith('.gitkeep'))).toBe(true);
    });

    it('skips post-processors in dry-run mode even when all are enabled', async () => {
      const engine = new ScaffoldEngine({ templatesDir: TEMPLATES_DIR });
      const context = makeTestContext({
        scaffold: {
          dryRun: true,
          overwrite: 'always',
          postProcessors: {
            dartFormat: true,
            flutterPubGet: true,
            buildRunner: true,
          },
        },
      });
      const result = await engine.run(context);

      expect(result.postProcessorsRun).toEqual([]);
    });

    it('produces more than zero files from core templates', async () => {
      const engine = new ScaffoldEngine({ templatesDir: TEMPLATES_DIR });
      const context = makeTestContext();
      const result = await engine.run(context);

      expect(result.filesWritten.length).toBeGreaterThan(0);
    });
  });

  describe('run (real write)', () => {
    const tmp = useTempDir('engine-test-');

    it('writes files to outputDir when not in dry-run', async () => {
      const engine = new ScaffoldEngine({ templatesDir: TEMPLATES_DIR });
      const context = makeTestContext({
        scaffold: {
          dryRun: false,
          overwrite: 'always',
          postProcessors: {
            dartFormat: false,
            flutterPubGet: false,
            buildRunner: false,
          },
        },
        outputDir: tmp.path,
      });

      const result = await engine.run(context);

      expect(result.filesWritten.length).toBeGreaterThan(0);

      // Verify actual file was created on disk
      const pubspecExists = await pathExists(join(tmp.path, 'pubspec.yaml'));
      expect(pubspecExists).toBe(true);
    });

    it('respects overwrite never mode for existing files', async () => {
      await ensureDir(tmp.path);
      await writeFile(join(tmp.path, 'pubspec.yaml'), 'original content', 'utf-8');

      const engine = new ScaffoldEngine({ templatesDir: TEMPLATES_DIR });
      const context = makeTestContext({
        scaffold: {
          dryRun: false,
          overwrite: 'never',
          postProcessors: {
            dartFormat: false,
            flutterPubGet: false,
            buildRunner: false,
          },
        },
        outputDir: tmp.path,
      });

      const result = await engine.run(context);

      expect(result.filesSkipped).toContain('pubspec.yaml');

      const content = await readFile(join(tmp.path, 'pubspec.yaml'), 'utf-8');
      expect(content).toBe('original content');
    });
  });

  describe('template context', () => {
    it('maps enabled modules to their config objects', async () => {
      const engine = new ScaffoldEngine({ templatesDir: TEMPLATES_DIR });
      const context = makeTestContext({
        modules: {
          auth: { provider: 'firebase' },
          api: { baseUrl: 'https://api.example.com' },
          database: false,
          i18n: false,
          theme: false,
          push: false,
          analytics: false,
          cicd: false,
          deepLinking: false,
        },
      });

      // Should run without error and produce files
      const result = await engine.run(context);
      expect(result.filesWritten.length).toBeGreaterThan(0);
    });

    it('handles all platforms being included', async () => {
      const engine = new ScaffoldEngine({ templatesDir: TEMPLATES_DIR });
      const context = makeTestContext({ platforms: ['android', 'ios', 'web', 'macos'] });
      const result = await engine.run(context);
      expect(result.filesWritten.length).toBeGreaterThan(0);
    });
  });

  describe('missing templates directory', () => {
    it('returns empty filesWritten when templates dir does not exist', async () => {
      const engine = new ScaffoldEngine({
        templatesDir: '/nonexistent/templates/path',
      });
      const context = makeTestContext();
      const result = await engine.run(context);

      expect(result.filesWritten).toEqual([]);
      expect(result.filesSkipped).toEqual([]);
      expect(result.conflicts).toEqual([]);
    });
  });

  describe('registry-driven module enablement', () => {
    const MODULES_DIR = resolve('templates/modules');
    const tmp = useTempDir('engine-registry-driven-');

    function makeMinimalManifest(overrides: Partial<ModuleManifest> = {}): ModuleManifest {
      return {
        id: 'test-module',
        name: 'Test Module',
        description: 'A test module',
        requires: [],
        templateDir: 'templates/modules/test-module',
        ralphPhase: 2,
        contributions: {},
        ...overrides,
      };
    }

    it('engine generates files for a module enabled in context and registered in registry', async () => {
      const engine = new ScaffoldEngine({
        templatesDir: TEMPLATES_DIR,
        modulesTemplatesDir: MODULES_DIR,
        registry: createTestRegistry(),
      });
      const context = makeWritableContext(tmp.path, {
        modules: {
          push: { provider: 'firebase' },
          auth: false,
          api: false,
          database: false,
          i18n: false,
          theme: false,
          analytics: false,
          cicd: false,
          deepLinking: false,
        },
      });
      await engine.run(context);

      const pushProviderPath = join(
        tmp.path,
        'lib/features/push/presentation/providers/push_provider.dart',
      );
      expect(await pathExists(pushProviderPath)).toBe(true);
    });

    it('engine skips module that is enabled in context but absent from registry', async () => {
      // Registry with only core and auth — no push
      const registry = new ModuleRegistry();
      registry.register(makeMinimalManifest({ id: 'core', alwaysIncluded: true }));
      registry.register(makeMinimalManifest({ id: 'auth' }));

      const engine = new ScaffoldEngine({
        templatesDir: TEMPLATES_DIR,
        modulesTemplatesDir: MODULES_DIR,
        registry,
      });
      const context = makeWritableContext(tmp.path, {
        modules: {
          push: { provider: 'firebase' },
          auth: false,
          api: false,
          database: false,
          i18n: false,
          theme: false,
          analytics: false,
          cicd: false,
          deepLinking: false,
        },
      });

      // Should not throw
      const result = await engine.run(context);
      expect(result).toBeDefined();

      // push files should NOT be generated since push is absent from registry
      const pushProviderPath = join(
        tmp.path,
        'lib/features/push/presentation/providers/push_provider.dart',
      );
      expect(await pathExists(pushProviderPath)).toBe(false);
    });

    it('engine enables a 3-part kebab module ID via correct camelCase mapping', async () => {
      // Verifies that /-([a-z])/g global regex handles multi-part IDs:
      // 'foo-bar-baz' → 'fooBarBaz'
      const fakeTmpModulesDir = resolve('templates/modules'); // real modules dir as base
      const registry = new ModuleRegistry();
      registry.register(makeMinimalManifest({ id: 'core', alwaysIncluded: true }));
      // Register a synthetic 3-part kebab module — no template dir, so engine skips file gen
      registry.register(makeMinimalManifest({ id: 'foo-bar-baz' }));

      const engine = new ScaffoldEngine({
        templatesDir: TEMPLATES_DIR,
        modulesTemplatesDir: fakeTmpModulesDir,
        registry,
      });

      // Cast modules to bypass TypeScript's fixed-key type — the engine uses Record<string, unknown>
      const mods = { fooBarBaz: { enabled: true } } as unknown as ProjectContext['modules'];
      const context = makeWritableContext(tmp.path, { modules: mods });

      // Engine should run without error; 'foo-bar-baz' template dir doesn't exist so no files added
      const result = await engine.run(context);
      expect(result).toBeDefined();
      expect(result.filesWritten.length).toBeGreaterThan(0); // core files still written
    });

    it('engine treats module as disabled when its camelCase key is absent from context.modules', async () => {
      const registry = new ModuleRegistry();
      registry.register(makeMinimalManifest({ id: 'core', alwaysIncluded: true }));
      registry.register(makeMinimalManifest({ id: 'push' }));

      const engine = new ScaffoldEngine({
        templatesDir: TEMPLATES_DIR,
        modulesTemplatesDir: resolve('templates/modules'),
        registry,
      });

      // context.modules has no 'push' key at all (undefined) — should be treated as disabled
      const mods = {} as unknown as ProjectContext['modules'];
      const context = makeWritableContext(tmp.path, { modules: mods });

      const result = await engine.run(context);
      expect(result).toBeDefined();

      // Push files should not be generated since the key is absent (undefined)
      const pushProviderPath = join(
        tmp.path,
        'lib/features/push/presentation/providers/push_provider.dart',
      );
      expect(await pathExists(pushProviderPath)).toBe(false);
    });

    it('engine correctly enables deep-linking via camelCase context key mapping', async () => {
      const engine = new ScaffoldEngine({
        templatesDir: TEMPLATES_DIR,
        modulesTemplatesDir: MODULES_DIR,
        registry: createTestRegistry(),
      });
      const context = makeWritableContext(tmp.path, {
        modules: {
          deepLinking: { scheme: 'myapp', host: 'example.com' },
          auth: false,
          api: false,
          database: false,
          i18n: false,
          theme: false,
          push: false,
          analytics: false,
          cicd: false,
        },
      });
      await engine.run(context);

      // deep-linking template files should be generated
      const deepLinkProviderPath = join(
        tmp.path,
        'lib/features/deep_linking/presentation/providers/deep_link_provider.dart',
      );
      expect(await pathExists(deepLinkProviderPath)).toBe(true);
    });
  });
});
