import { mkdtemp, rm, readFile, writeFile, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { dump as yamlDump } from 'js-yaml';
import fsExtra from 'fs-extra';

import { ProjectDetector } from '../../src/core/detector.js';
import { createMigrateCommand } from '../../src/cli/commands/migrate.js';

const { pathExists } = fsExtra;

interface MockProjectOptions {
  name?: string;
  deps?: Record<string, string>;
  devDeps?: Record<string, string>;
  dirs?: string[];
  files?: Array<{ path: string; content: string }>;
}

/** Create a minimal mock Flutter project in baseDir. */
async function createMockFlutterProject(
  baseDir: string,
  options: MockProjectOptions = {},
): Promise<void> {
  const pubspec = {
    name: options.name ?? 'test_app',
    description: 'A test Flutter app',
    version: '1.0.0+1',
    environment: { sdk: '>=3.0.0 <4.0.0' },
    dependencies: {
      flutter: { sdk: 'flutter' },
      ...(options.deps ?? {}),
    },
    dev_dependencies: {
      flutter_test: { sdk: 'flutter' },
      ...(options.devDeps ?? {}),
    },
  };

  await writeFile(join(baseDir, 'pubspec.yaml'), yamlDump(pubspec, { indent: 2 }), 'utf-8');

  // Always create lib/ with a minimal main.dart
  await mkdir(join(baseDir, 'lib'), { recursive: true });
  await writeFile(
    join(baseDir, 'lib', 'main.dart'),
    "import 'package:flutter/material.dart';\n\nvoid main() => runApp(const MaterialApp(home: Text('Hello')));\n",
    'utf-8',
  );

  for (const dir of options.dirs ?? []) {
    await mkdir(join(baseDir, dir), { recursive: true });
  }

  for (const file of options.files ?? []) {
    await mkdir(join(baseDir, file.path, '..'), { recursive: true });
    await writeFile(join(baseDir, file.path), file.content, 'utf-8');
  }
}

describe('Integration: migrate command structure', () => {
  it('createMigrateCommand returns command named "migrate"', () => {
    const cmd = createMigrateCommand();
    expect(cmd.name()).toBe('migrate');
  });

  it('has --analysis-only option', () => {
    const cmd = createMigrateCommand();
    const opt = cmd.options.find((o) => o.long === '--analysis-only');
    expect(opt).toBeDefined();
  });

  it('has --yes option', () => {
    const cmd = createMigrateCommand();
    const opt = cmd.options.find((o) => o.long === '--yes');
    expect(opt).toBeDefined();
  });

  it('accepts an optional [path] argument', () => {
    const cmd = createMigrateCommand();
    const arg = cmd.registeredArguments.find((a) => a.name() === 'path');
    expect(arg).toBeDefined();
  });
});

describe('Integration: ProjectDetector.analyzeProject on realistic Flutter projects', () => {
  let tmpDir: string;
  let detector: ProjectDetector;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), 'migrate-integration-test-'));
    detector = new ProjectDetector();
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  describe('project name and basic detection', () => {
    it('extracts project name from a realistic pubspec.yaml', async () => {
      await createMockFlutterProject(tmpDir, { name: 'my_existing_app' });
      const report = await detector.analyzeProject(tmpDir);
      expect(report.projectName).toBe('my_existing_app');
    });

    it('returns all required fields in the analysis report', async () => {
      await createMockFlutterProject(tmpDir, {
        deps: { flutter_bloc: '^8.0.0' },
      });
      const report = await detector.analyzeProject(tmpDir);

      expect(report).toHaveProperty('projectName');
      expect(report).toHaveProperty('architecture');
      expect(report).toHaveProperty('stateManagement');
      expect(report).toHaveProperty('routing');
      expect(report).toHaveProperty('detectedModules');
      expect(report).toHaveProperty('cleanArchitectureGaps');
      expect(report).toHaveProperty('recommendations');
      expect(report).toHaveProperty('migrationDifficulty');
      expect(report).toHaveProperty('rawDependencies');
    });
  });

  describe('state management detection', () => {
    it('detects riverpod in a project with flutter_riverpod dependency', async () => {
      await createMockFlutterProject(tmpDir, {
        deps: { flutter_riverpod: '^2.4.0', riverpod_annotation: '^2.3.0' },
      });
      const report = await detector.analyzeProject(tmpDir);
      expect(report.stateManagement).toBe('riverpod');
    });

    it('detects bloc in a typical BLoC project', async () => {
      await createMockFlutterProject(tmpDir, {
        deps: { flutter_bloc: '^8.1.0', bloc: '^8.1.0' },
      });
      const report = await detector.analyzeProject(tmpDir);
      expect(report.stateManagement).toBe('bloc');
    });

    it('detects provider in an older-style project', async () => {
      await createMockFlutterProject(tmpDir, {
        deps: { provider: '^6.1.0' },
      });
      const report = await detector.analyzeProject(tmpDir);
      expect(report.stateManagement).toBe('provider');
    });

    it('detects getx in a GetX project', async () => {
      await createMockFlutterProject(tmpDir, {
        deps: { get: '^4.6.0' },
      });
      const report = await detector.analyzeProject(tmpDir);
      expect(report.stateManagement).toBe('getx');
    });

    it('returns unknown for a vanilla Flutter project', async () => {
      await createMockFlutterProject(tmpDir);
      const report = await detector.analyzeProject(tmpDir);
      expect(report.stateManagement).toBe('unknown');
    });
  });

  describe('routing detection', () => {
    it('detects go_router in a project already using it', async () => {
      await createMockFlutterProject(tmpDir, {
        deps: { go_router: '^14.2.0' },
      });
      const report = await detector.analyzeProject(tmpDir);
      expect(report.routing).toBe('go_router');
    });

    it('detects auto_route in a project using it', async () => {
      await createMockFlutterProject(tmpDir, {
        deps: { auto_route: '^9.0.0' },
        devDeps: { auto_route_generator: '^9.0.0' },
      });
      const report = await detector.analyzeProject(tmpDir);
      expect(report.routing).toBe('auto_route');
    });

    it('defaults to navigator for projects without routing packages', async () => {
      await createMockFlutterProject(tmpDir);
      const report = await detector.analyzeProject(tmpDir);
      expect(report.routing).toBe('navigator');
    });
  });

  describe('architecture detection', () => {
    it('detects clean architecture in a project with full feature layers', async () => {
      await createMockFlutterProject(tmpDir, {
        dirs: [
          'lib/features/home/domain',
          'lib/features/home/data',
          'lib/features/home/presentation',
          'lib/features/auth/domain',
          'lib/features/auth/data',
          'lib/features/auth/presentation',
        ],
      });
      const report = await detector.analyzeProject(tmpDir);
      expect(report.architecture).toBe('clean');
    });

    it('detects mvc architecture from controllers/ + views/ structure', async () => {
      await createMockFlutterProject(tmpDir, {
        dirs: ['lib/controllers', 'lib/views', 'lib/models'],
      });
      const report = await detector.analyzeProject(tmpDir);
      expect(report.architecture).toBe('mvc');
    });

    it('detects mvvm architecture from viewmodels/', async () => {
      await createMockFlutterProject(tmpDir, {
        dirs: ['lib/viewmodels', 'lib/views'],
      });
      const report = await detector.analyzeProject(tmpDir);
      expect(report.architecture).toBe('mvvm');
    });

    it('returns unknown for flat project structure', async () => {
      await createMockFlutterProject(tmpDir);
      const report = await detector.analyzeProject(tmpDir);
      expect(report.architecture).toBe('unknown');
    });
  });

  describe('module detection', () => {
    it('detects auth, api, theme from dependencies in real project', async () => {
      await createMockFlutterProject(tmpDir, {
        deps: {
          firebase_auth: '^5.0.0',
          firebase_core: '^3.0.0',
          dio: '^5.4.0',
          google_fonts: '^6.1.0',
        },
      });
      const report = await detector.analyzeProject(tmpDir);
      expect(report.detectedModules).toContain('auth');
      expect(report.detectedModules).toContain('api');
      expect(report.detectedModules).toContain('theme');
    });

    it('detects push and analytics modules from firebase deps', async () => {
      await createMockFlutterProject(tmpDir, {
        deps: {
          firebase_messaging: '^15.0.0',
          firebase_analytics: '^11.0.0',
          firebase_core: '^3.0.0',
        },
      });
      const report = await detector.analyzeProject(tmpDir);
      expect(report.detectedModules).toContain('push');
      expect(report.detectedModules).toContain('analytics');
    });

    it('detects i18n module from ARB files in lib/l10n/', async () => {
      await createMockFlutterProject(tmpDir, {
        files: [
          { path: 'lib/l10n/app_en.arb', content: '{"@@locale": "en", "appTitle": "My App"}' },
          { path: 'lib/l10n/app_es.arb', content: '{"@@locale": "es", "appTitle": "Mi App"}' },
        ],
      });
      const report = await detector.analyzeProject(tmpDir);
      expect(report.detectedModules).toContain('i18n');
    });

    it('detects cicd module from .github/workflows/ directory', async () => {
      await createMockFlutterProject(tmpDir, {
        dirs: ['.github/workflows'],
        files: [{ path: '.github/workflows/ci.yml', content: 'name: CI\non: [push]\njobs: {}' }],
      });
      const report = await detector.analyzeProject(tmpDir);
      expect(report.detectedModules).toContain('cicd');
    });

    it('detects deep-linking module from app_links dependency', async () => {
      await createMockFlutterProject(tmpDir, {
        deps: { app_links: '^6.0.0' },
      });
      const report = await detector.analyzeProject(tmpDir);
      expect(report.detectedModules).toContain('deep-linking');
    });

    it('returns empty modules array for vanilla Flutter project', async () => {
      await createMockFlutterProject(tmpDir);
      const report = await detector.analyzeProject(tmpDir);
      // No extras detected — only flutter SDK dep present
      expect(report.detectedModules).toHaveLength(0);
    });
  });

  describe('Clean Architecture gap detection', () => {
    it('detects missing presentation layer in a feature', async () => {
      await createMockFlutterProject(tmpDir, {
        dirs: [
          'lib/features/home/domain',
          'lib/features/home/data',
          // Missing: lib/features/home/presentation
        ],
      });
      const report = await detector.analyzeProject(tmpDir);
      const homeGaps = report.cleanArchitectureGaps.filter((g) => g.includes('home'));
      expect(homeGaps.some((g) => g.includes('presentation'))).toBe(true);
    });

    it('detects missing domain layer in a feature', async () => {
      await createMockFlutterProject(tmpDir, {
        dirs: [
          // Missing: lib/features/profile/domain
          'lib/features/profile/data',
          'lib/features/profile/presentation',
        ],
      });
      const report = await detector.analyzeProject(tmpDir);
      const gaps = report.cleanArchitectureGaps.filter((g) => g.includes('profile'));
      expect(gaps.some((g) => g.includes('domain'))).toBe(true);
    });

    it('reports no gaps when all features have complete layers', async () => {
      await createMockFlutterProject(tmpDir, {
        dirs: [
          'lib/features/home/domain',
          'lib/features/home/data',
          'lib/features/home/presentation',
          'lib/features/profile/domain',
          'lib/features/profile/data',
          'lib/features/profile/presentation',
        ],
      });
      const report = await detector.analyzeProject(tmpDir);
      expect(report.cleanArchitectureGaps).toHaveLength(0);
    });
  });

  describe('analysis-only behavior (no file changes)', () => {
    it('does not modify pubspec.yaml during analysis', async () => {
      await createMockFlutterProject(tmpDir, {
        deps: { flutter_bloc: '^8.0.0' },
      });
      const pubspecBefore = await readFile(join(tmpDir, 'pubspec.yaml'), 'utf-8');
      const mainDartBefore = await readFile(join(tmpDir, 'lib', 'main.dart'), 'utf-8');

      await detector.analyzeProject(tmpDir);

      const pubspecAfter = await readFile(join(tmpDir, 'pubspec.yaml'), 'utf-8');
      const mainDartAfter = await readFile(join(tmpDir, 'lib', 'main.dart'), 'utf-8');

      expect(pubspecAfter).toBe(pubspecBefore);
      expect(mainDartAfter).toBe(mainDartBefore);
    });

    it('does not create maxsim.config.yaml or CLAUDE.md during analysis', async () => {
      await createMockFlutterProject(tmpDir, {
        deps: { flutter_bloc: '^8.0.0' },
      });

      await detector.analyzeProject(tmpDir);

      expect(await pathExists(join(tmpDir, 'maxsim.config.yaml'))).toBe(false);
      expect(await pathExists(join(tmpDir, 'CLAUDE.md'))).toBe(false);
      expect(await pathExists(join(tmpDir, '.claude'))).toBe(false);
    });

    it('does not create prd.json during analysis', async () => {
      await createMockFlutterProject(tmpDir);
      await detector.analyzeProject(tmpDir);
      expect(await pathExists(join(tmpDir, 'prd.json'))).toBe(false);
    });
  });
});

describe('Integration: migration difficulty assessment', () => {
  let tmpDir: string;
  let detector: ProjectDetector;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), 'migrate-difficulty-test-'));
    detector = new ProjectDetector();
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  it('assesses simple difficulty for a nearly-compliant project', async () => {
    await createMockFlutterProject(tmpDir, {
      deps: {
        flutter_riverpod: '^2.4.0',
        go_router: '^14.2.0',
      },
      dirs: [
        'lib/features/home/domain',
        'lib/features/home/data',
        'lib/features/home/presentation',
      ],
    });
    const report = await detector.analyzeProject(tmpDir);
    expect(report.migrationDifficulty).toBe('simple');
    expect(report.stateManagement).toBe('riverpod');
    expect(report.routing).toBe('go_router');
    expect(report.architecture).toBe('clean');
  });

  it('assesses complex difficulty for a legacy bloc project without clean arch', async () => {
    await createMockFlutterProject(tmpDir, {
      deps: { flutter_bloc: '^8.0.0' },
    });
    const report = await detector.analyzeProject(tmpDir);
    expect(report.migrationDifficulty).toBe('complex');
    expect(report.stateManagement).toBe('bloc');
  });

  it('assesses moderate difficulty for partial adoption', async () => {
    // Has riverpod + go_router, but no clean arch structure
    await createMockFlutterProject(tmpDir, {
      deps: {
        flutter_riverpod: '^2.4.0',
        go_router: '^14.0.0',
      },
      dirs: ['lib/screens', 'lib/models'],
    });
    const report = await detector.analyzeProject(tmpDir);
    expect(['moderate', 'complex']).toContain(report.migrationDifficulty);
  });
});

describe('Integration: comprehensive analysis of real-world-like project', () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), 'migrate-full-test-'));
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  it('generates complete analysis report for a legacy app with many modules', async () => {
    await createMockFlutterProject(tmpDir, {
      name: 'legacy_ecommerce_app',
      deps: {
        flutter_bloc: '^8.1.0',
        dio: '^5.4.0',
        firebase_auth: '^5.0.0',
        firebase_core: '^3.0.0',
        firebase_messaging: '^15.0.0',
        firebase_analytics: '^11.0.0',
        google_fonts: '^6.1.0',
        drift: '^2.14.0',
        sqlite3_flutter_libs: '^0.5.0',
      },
      dirs: [
        'lib/controllers',
        'lib/views',
        'lib/models',
        '.github/workflows',
      ],
      files: [
        { path: 'lib/l10n/app_en.arb', content: '{"@@locale": "en"}' },
        { path: '.github/workflows/ci.yml', content: 'name: CI\non: [push]' },
      ],
    });

    const detector = new ProjectDetector();
    const report = await detector.analyzeProject(tmpDir);

    expect(report.projectName).toBe('legacy_ecommerce_app');
    expect(report.architecture).toBe('mvc');
    expect(report.stateManagement).toBe('bloc');
    expect(report.routing).toBe('navigator');
    expect(report.migrationDifficulty).toBe('complex');

    expect(report.detectedModules).toContain('auth');
    expect(report.detectedModules).toContain('api');
    expect(report.detectedModules).toContain('theme');
    expect(report.detectedModules).toContain('push');
    expect(report.detectedModules).toContain('analytics');
    expect(report.detectedModules).toContain('database');
    expect(report.detectedModules).toContain('i18n');
    expect(report.detectedModules).toContain('cicd');

    expect(report.rawDependencies).toContain('flutter_bloc');
    expect(report.rawDependencies).toContain('dio');
    expect(report.rawDependencies).toContain('drift');

    expect(report.recommendations.length).toBeGreaterThan(0);
    expect(report.recommendations.some((r) => r.toLowerCase().includes('riverpod'))).toBe(true);
    expect(report.recommendations.some((r) => r.includes('go_router'))).toBe(true);
    expect(report.recommendations.some((r) => r.toLowerCase().includes('features/'))).toBe(true);
  });

  it('generates minimal report for a project already using maxsim conventions', async () => {
    await createMockFlutterProject(tmpDir, {
      name: 'modern_app',
      deps: {
        flutter_riverpod: '^2.4.0',
        go_router: '^14.2.0',
        freezed_annotation: '^2.4.0',
        google_fonts: '^6.1.0',
      },
      devDeps: {
        build_runner: '^2.4.0',
        freezed: '^2.4.0',
        riverpod_generator: '^2.3.0',
      },
      dirs: [
        'lib/core/router',
        'lib/core/theme',
        'lib/core/providers',
        'lib/features/home/domain',
        'lib/features/home/data',
        'lib/features/home/presentation',
        'lib/features/profile/domain',
        'lib/features/profile/data',
        'lib/features/profile/presentation',
      ],
    });

    const detector = new ProjectDetector();
    const report = await detector.analyzeProject(tmpDir);

    expect(report.stateManagement).toBe('riverpod');
    expect(report.routing).toBe('go_router');
    expect(report.architecture).toBe('clean');
    expect(report.migrationDifficulty).toBe('simple');
    expect(report.cleanArchitectureGaps).toHaveLength(0);

    // Should NOT recommend migrating away from riverpod or go_router
    const stateRecs = report.recommendations.filter(
      (r) => r.toLowerCase().includes('migrate') && r.toLowerCase().includes('riverpod'),
    );
    expect(stateRecs).toHaveLength(0);

    const routerRecs = report.recommendations.filter(
      (r) => r.toLowerCase().includes('migrate') && r.includes('go_router'),
    );
    expect(routerRecs).toHaveLength(0);
  });

  it('non-destructive: analysis does not modify any file in the project', async () => {
    await createMockFlutterProject(tmpDir, {
      deps: { provider: '^6.0.0', dio: '^5.0.0' },
      dirs: ['lib/screens', 'lib/models'],
    });

    const pubspecContent = await readFile(join(tmpDir, 'pubspec.yaml'), 'utf-8');
    const mainDartContent = await readFile(join(tmpDir, 'lib', 'main.dart'), 'utf-8');

    const detector = new ProjectDetector();
    await detector.analyzeProject(tmpDir);

    // All existing files unchanged
    expect(await readFile(join(tmpDir, 'pubspec.yaml'), 'utf-8')).toBe(pubspecContent);
    expect(await readFile(join(tmpDir, 'lib', 'main.dart'), 'utf-8')).toBe(mainDartContent);

    // No migration artifacts created
    expect(await pathExists(join(tmpDir, 'maxsim.config.yaml'))).toBe(false);
    expect(await pathExists(join(tmpDir, 'CLAUDE.md'))).toBe(false);
    expect(await pathExists(join(tmpDir, 'prd.json'))).toBe(false);
    expect(await pathExists(join(tmpDir, '.claude'))).toBe(false);
  });
});
