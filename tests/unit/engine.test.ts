import { writeFile, readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { pathExists, ensureDir } from 'fs-extra';
import { ScaffoldEngine } from '../../src/scaffold/engine.js';
import { makeTestContext } from '../helpers/context-factory.js';
import { useTempDir } from '../helpers/temp-dir.js';

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
});
