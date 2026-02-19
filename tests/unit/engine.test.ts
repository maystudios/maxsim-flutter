import { mkdtemp, rm, writeFile, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathExists, ensureDir } from 'fs-extra';
import { ScaffoldEngine } from '../../src/scaffold/engine.js';
import type { ProjectContext } from '../../src/core/context.js';

// The actual templates/core directory relative to the project root
const TEMPLATES_DIR = resolve('templates/core');

function makeContext(overrides: Partial<ProjectContext> = {}): ProjectContext {
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
      dryRun: true,
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
    outputDir: '/tmp/test-output',
    rawConfig: {} as ProjectContext['rawConfig'],
  };
  return { ...base, ...overrides };
}

describe('ScaffoldEngine', () => {
  describe('run (dry-run)', () => {
    it('returns a ScaffoldResult with filesWritten from core templates', async () => {
      const engine = new ScaffoldEngine({ templatesDir: TEMPLATES_DIR });
      const context = makeContext();
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
      const context = makeContext();
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
      const context = makeContext();
      const result = await engine.run(context);

      expect(result.filesWritten.some((f) => f.endsWith('.gitkeep'))).toBe(true);
    });

    it('skips post-processors in dry-run mode even when all are enabled', async () => {
      const engine = new ScaffoldEngine({ templatesDir: TEMPLATES_DIR });
      const context = makeContext({
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
      const context = makeContext();
      const result = await engine.run(context);

      expect(result.filesWritten.length).toBeGreaterThan(0);
    });
  });

  describe('run (real write)', () => {
    let tmpDir: string;

    beforeEach(async () => {
      tmpDir = await mkdtemp(join(tmpdir(), 'engine-test-'));
    });

    afterEach(async () => {
      await rm(tmpDir, { recursive: true, force: true });
    });

    it('writes files to outputDir when not in dry-run', async () => {
      const engine = new ScaffoldEngine({ templatesDir: TEMPLATES_DIR });
      const context = makeContext({
        scaffold: {
          dryRun: false,
          overwrite: 'always',
          postProcessors: {
            dartFormat: false,
            flutterPubGet: false,
            buildRunner: false,
          },
        },
        outputDir: tmpDir,
      });

      const result = await engine.run(context);

      expect(result.filesWritten.length).toBeGreaterThan(0);

      // Verify actual file was created on disk
      const pubspecExists = await pathExists(join(tmpDir, 'pubspec.yaml'));
      expect(pubspecExists).toBe(true);
    });

    it('respects overwrite never mode for existing files', async () => {
      await ensureDir(tmpDir);
      await writeFile(join(tmpDir, 'pubspec.yaml'), 'original content', 'utf-8');

      const engine = new ScaffoldEngine({ templatesDir: TEMPLATES_DIR });
      const context = makeContext({
        scaffold: {
          dryRun: false,
          overwrite: 'never',
          postProcessors: {
            dartFormat: false,
            flutterPubGet: false,
            buildRunner: false,
          },
        },
        outputDir: tmpDir,
      });

      const result = await engine.run(context);

      expect(result.filesSkipped).toContain('pubspec.yaml');

      const content = await readFile(join(tmpDir, 'pubspec.yaml'), 'utf-8');
      expect(content).toBe('original content');
    });
  });

  describe('template context', () => {
    it('maps enabled modules to their config objects', async () => {
      const engine = new ScaffoldEngine({ templatesDir: TEMPLATES_DIR });
      const context = makeContext({
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
      const context = makeContext({ platforms: ['android', 'ios', 'web', 'macos'] });
      const result = await engine.run(context);
      expect(result.filesWritten.length).toBeGreaterThan(0);
    });
  });

  describe('missing templates directory', () => {
    it('returns empty filesWritten when templates dir does not exist', async () => {
      const engine = new ScaffoldEngine({
        templatesDir: '/nonexistent/templates/path',
      });
      const context = makeContext();
      const result = await engine.run(context);

      expect(result.filesWritten).toEqual([]);
      expect(result.filesSkipped).toEqual([]);
      expect(result.conflicts).toEqual([]);
    });
  });
});
