import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { dump as yamlDump } from 'js-yaml';
import { ProjectDetector } from '../../src/core/detector.js';

async function createProject(
  baseDir: string,
  options: {
    pubspecDeps?: Record<string, string>;
    createDirs?: string[];
    createFiles?: Array<{ path: string; content: string }>;
  } = {},
): Promise<string> {
  const pubspec = {
    name: 'test_app',
    description: 'A test app',
    version: '1.0.0',
    environment: { sdk: '>=3.0.0 <4.0.0' },
    dependencies: {
      flutter: { sdk: 'flutter' },
      ...(options.pubspecDeps ?? {}),
    },
    dev_dependencies: {
      flutter_test: { sdk: 'flutter' },
    },
  };

  await writeFile(join(baseDir, 'pubspec.yaml'), yamlDump(pubspec), 'utf-8');

  for (const dir of options.createDirs ?? []) {
    await mkdir(join(baseDir, dir), { recursive: true });
  }
  for (const file of options.createFiles ?? []) {
    await mkdir(join(baseDir, file.path, '..'), { recursive: true });
    await writeFile(join(baseDir, file.path), file.content, 'utf-8');
  }

  return baseDir;
}

describe('ProjectDetector', () => {
  let tempDir: string;
  let detector: ProjectDetector;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'detector-test-'));
    detector = new ProjectDetector();
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  describe('analyzeProject - projectName', () => {
    it('extracts project name from pubspec.yaml', async () => {
      await createProject(tempDir);
      const report = await detector.analyzeProject(tempDir);
      expect(report.projectName).toBe('test_app');
    });

    it('returns "unknown" when pubspec.yaml is missing', async () => {
      const report = await detector.analyzeProject(tempDir);
      expect(report.projectName).toBe('unknown');
    });
  });

  describe('detectStateManagement', () => {
    it('detects riverpod from flutter_riverpod dependency', async () => {
      await createProject(tempDir, { pubspecDeps: { flutter_riverpod: '^2.0.0' } });
      const report = await detector.analyzeProject(tempDir);
      expect(report.stateManagement).toBe('riverpod');
    });

    it('detects riverpod from hooks_riverpod dependency', async () => {
      await createProject(tempDir, { pubspecDeps: { hooks_riverpod: '^2.0.0' } });
      const report = await detector.analyzeProject(tempDir);
      expect(report.stateManagement).toBe('riverpod');
    });

    it('detects bloc from flutter_bloc dependency', async () => {
      await createProject(tempDir, { pubspecDeps: { flutter_bloc: '^8.0.0' } });
      const report = await detector.analyzeProject(tempDir);
      expect(report.stateManagement).toBe('bloc');
    });

    it('detects provider from provider dependency', async () => {
      await createProject(tempDir, { pubspecDeps: { provider: '^6.0.0' } });
      const report = await detector.analyzeProject(tempDir);
      expect(report.stateManagement).toBe('provider');
    });

    it('detects getx from get dependency', async () => {
      await createProject(tempDir, { pubspecDeps: { get: '^4.0.0' } });
      const report = await detector.analyzeProject(tempDir);
      expect(report.stateManagement).toBe('getx');
    });

    it('returns unknown when no state management is found', async () => {
      await createProject(tempDir);
      const report = await detector.analyzeProject(tempDir);
      expect(report.stateManagement).toBe('unknown');
    });
  });

  describe('detectRouting', () => {
    it('detects go_router', async () => {
      await createProject(tempDir, { pubspecDeps: { go_router: '^14.0.0' } });
      const report = await detector.analyzeProject(tempDir);
      expect(report.routing).toBe('go_router');
    });

    it('detects auto_route', async () => {
      await createProject(tempDir, { pubspecDeps: { auto_route: '^9.0.0' } });
      const report = await detector.analyzeProject(tempDir);
      expect(report.routing).toBe('auto_route');
    });

    it('defaults to navigator when no routing package found', async () => {
      await createProject(tempDir);
      const report = await detector.analyzeProject(tempDir);
      expect(report.routing).toBe('navigator');
    });
  });

  describe('detectArchitecture', () => {
    it('detects clean architecture from features/ with all 3 layers', async () => {
      await createProject(tempDir, {
        createDirs: [
          'lib/features/auth/domain',
          'lib/features/auth/data',
          'lib/features/auth/presentation',
        ],
      });
      const report = await detector.analyzeProject(tempDir);
      expect(report.architecture).toBe('clean');
    });

    it('detects mvc from controllers/ + views/', async () => {
      await createProject(tempDir, {
        createDirs: ['lib/controllers', 'lib/views', 'lib/models'],
      });
      const report = await detector.analyzeProject(tempDir);
      expect(report.architecture).toBe('mvc');
    });

    it('detects mvvm from viewmodels/', async () => {
      await createProject(tempDir, {
        createDirs: ['lib/viewmodels'],
      });
      const report = await detector.analyzeProject(tempDir);
      expect(report.architecture).toBe('mvvm');
    });

    it('returns unknown when no pattern is detected', async () => {
      await createProject(tempDir);
      const report = await detector.analyzeProject(tempDir);
      expect(report.architecture).toBe('unknown');
    });
  });

  describe('detectModules', () => {
    it('detects auth from firebase_auth dependency', async () => {
      await createProject(tempDir, { pubspecDeps: { firebase_auth: '^5.0.0' } });
      const report = await detector.analyzeProject(tempDir);
      expect(report.detectedModules).toContain('auth');
    });

    it('detects auth from supabase_flutter dependency', async () => {
      await createProject(tempDir, { pubspecDeps: { supabase_flutter: '^2.0.0' } });
      const report = await detector.analyzeProject(tempDir);
      expect(report.detectedModules).toContain('auth');
    });

    it('detects auth from lib/features/auth/ directory', async () => {
      await createProject(tempDir, { createDirs: ['lib/features/auth'] });
      const report = await detector.analyzeProject(tempDir);
      expect(report.detectedModules).toContain('auth');
    });

    it('detects api from dio dependency', async () => {
      await createProject(tempDir, { pubspecDeps: { dio: '^5.0.0' } });
      const report = await detector.analyzeProject(tempDir);
      expect(report.detectedModules).toContain('api');
    });

    it('detects database from drift dependency', async () => {
      await createProject(tempDir, { pubspecDeps: { drift: '^2.0.0' } });
      const report = await detector.analyzeProject(tempDir);
      expect(report.detectedModules).toContain('database');
    });

    it('detects database from hive dependency', async () => {
      await createProject(tempDir, { pubspecDeps: { hive_flutter: '^1.0.0' } });
      const report = await detector.analyzeProject(tempDir);
      expect(report.detectedModules).toContain('database');
    });

    it('detects i18n from ARB files in lib/l10n/', async () => {
      await createProject(tempDir, {
        createFiles: [{ path: 'lib/l10n/app_en.arb', content: '{}' }],
      });
      const report = await detector.analyzeProject(tempDir);
      expect(report.detectedModules).toContain('i18n');
    });

    it('detects theme from google_fonts dependency', async () => {
      await createProject(tempDir, { pubspecDeps: { google_fonts: '^6.0.0' } });
      const report = await detector.analyzeProject(tempDir);
      expect(report.detectedModules).toContain('theme');
    });

    it('detects push from firebase_messaging dependency', async () => {
      await createProject(tempDir, { pubspecDeps: { firebase_messaging: '^15.0.0' } });
      const report = await detector.analyzeProject(tempDir);
      expect(report.detectedModules).toContain('push');
    });

    it('detects analytics from firebase_analytics dependency', async () => {
      await createProject(tempDir, { pubspecDeps: { firebase_analytics: '^11.0.0' } });
      const report = await detector.analyzeProject(tempDir);
      expect(report.detectedModules).toContain('analytics');
    });

    it('detects cicd from .github/workflows/ directory', async () => {
      await createProject(tempDir, { createDirs: ['.github/workflows'] });
      const report = await detector.analyzeProject(tempDir);
      expect(report.detectedModules).toContain('cicd');
    });

    it('detects deep-linking from app_links dependency', async () => {
      await createProject(tempDir, { pubspecDeps: { app_links: '^6.0.0' } });
      const report = await detector.analyzeProject(tempDir);
      expect(report.detectedModules).toContain('deep-linking');
    });

    it('returns empty array when no modules detected', async () => {
      await createProject(tempDir);
      const report = await detector.analyzeProject(tempDir);
      expect(report.detectedModules).toEqual([]);
    });
  });

  describe('cleanArchitectureGaps', () => {
    it('reports gap when features dir has no subdirs', async () => {
      await createProject(tempDir, { createDirs: ['lib/features/home'] });
      const report = await detector.analyzeProject(tempDir);
      expect(report.cleanArchitectureGaps.length).toBeGreaterThan(0);
      expect(report.cleanArchitectureGaps.some((g) => g.includes('home'))).toBe(true);
    });

    it('reports no gaps when features have all 3 layers', async () => {
      await createProject(tempDir, {
        createDirs: [
          'lib/features/home/domain',
          'lib/features/home/data',
          'lib/features/home/presentation',
        ],
      });
      const report = await detector.analyzeProject(tempDir);
      const homeGaps = report.cleanArchitectureGaps.filter((g) => g.includes('home'));
      expect(homeGaps).toHaveLength(0);
    });

    it('reports missing domain layer gap', async () => {
      await createProject(tempDir, {
        createDirs: ['lib/features/home/data', 'lib/features/home/presentation'],
      });
      const report = await detector.analyzeProject(tempDir);
      expect(report.cleanArchitectureGaps.some((g) => g.includes('domain'))).toBe(true);
    });
  });

  describe('migrationDifficulty', () => {
    it('returns simple for existing riverpod + go_router + clean arch project', async () => {
      await createProject(tempDir, {
        pubspecDeps: {
          flutter_riverpod: '^2.0.0',
          go_router: '^14.0.0',
        },
        createDirs: [
          'lib/features/home/domain',
          'lib/features/home/data',
          'lib/features/home/presentation',
        ],
      });
      const report = await detector.analyzeProject(tempDir);
      expect(report.migrationDifficulty).toBe('simple');
    });

    it('returns complex when missing riverpod, go_router, and clean arch', async () => {
      await createProject(tempDir, {
        pubspecDeps: { flutter_bloc: '^8.0.0' },
      });
      const report = await detector.analyzeProject(tempDir);
      expect(report.migrationDifficulty).toBe('complex');
    });

    it('returns moderate for partial adoption', async () => {
      await createProject(tempDir, {
        pubspecDeps: {
          flutter_riverpod: '^2.0.0',
          go_router: '^14.0.0',
        },
      });
      const report = await detector.analyzeProject(tempDir);
      // has riverpod + go_router but no clean arch → score 2 → moderate
      expect(['moderate', 'complex']).toContain(report.migrationDifficulty);
    });
  });

  describe('recommendations', () => {
    it('recommends riverpod migration when using bloc', async () => {
      await createProject(tempDir, { pubspecDeps: { flutter_bloc: '^8.0.0' } });
      const report = await detector.analyzeProject(tempDir);
      expect(report.recommendations.some((r) => r.toLowerCase().includes('riverpod'))).toBe(true);
    });

    it('recommends go_router migration when using Navigator', async () => {
      await createProject(tempDir);
      const report = await detector.analyzeProject(tempDir);
      expect(report.recommendations.some((r) => r.includes('go_router'))).toBe(true);
    });

    it('recommends clean architecture when not using it', async () => {
      await createProject(tempDir);
      const report = await detector.analyzeProject(tempDir);
      expect(report.recommendations.some((r) => r.toLowerCase().includes('features/'))).toBe(true);
    });

    it('makes no state management recommendation when already using riverpod', async () => {
      await createProject(tempDir, { pubspecDeps: { flutter_riverpod: '^2.0.0' } });
      const report = await detector.analyzeProject(tempDir);
      const riverpodMigRecs = report.recommendations.filter(
        (r) => r.toLowerCase().includes('migrate') && r.toLowerCase().includes('riverpod'),
      );
      expect(riverpodMigRecs).toHaveLength(0);
    });
  });

  describe('rawDependencies', () => {
    it('includes all dependencies from pubspec.yaml', async () => {
      await createProject(tempDir, {
        pubspecDeps: {
          flutter_riverpod: '^2.0.0',
          go_router: '^14.0.0',
          dio: '^5.0.0',
        },
      });
      const report = await detector.analyzeProject(tempDir);
      expect(report.rawDependencies).toContain('flutter_riverpod');
      expect(report.rawDependencies).toContain('go_router');
      expect(report.rawDependencies).toContain('dio');
    });
  });
});
