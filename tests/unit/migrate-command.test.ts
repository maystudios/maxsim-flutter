import { mkdtemp, rm, writeFile, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { createMigrateCommand, buildModuleConfig, detectOrgId } from '../../src/cli/commands/migrate.js';
import type { AnalysisReport } from '../../src/core/detector.js';

function makeReport(overrides: Partial<AnalysisReport> = {}): AnalysisReport {
  return {
    projectName: 'test_app',
    architecture: 'unknown',
    stateManagement: 'unknown',
    routing: 'navigator',
    detectedModules: [],
    cleanArchitectureGaps: [],
    recommendations: [],
    migrationDifficulty: 'simple',
    rawDependencies: [],
    ...overrides,
  };
}

describe('createMigrateCommand', () => {
  it('creates a Command named "migrate"', () => {
    const cmd = createMigrateCommand();
    expect(cmd.name()).toBe('migrate');
  });

  it('has --analysis-only option', () => {
    const cmd = createMigrateCommand();
    const option = cmd.options.find((o) => o.long === '--analysis-only');
    expect(option).toBeDefined();
  });

  it('has --yes option', () => {
    const cmd = createMigrateCommand();
    const option = cmd.options.find((o) => o.long === '--yes');
    expect(option).toBeDefined();
  });
});

describe('buildModuleConfig', () => {
  it('returns empty config when no modules detected', () => {
    const result = buildModuleConfig(makeReport());
    expect(Object.keys(result)).toHaveLength(0);
  });

  it('detects firebase auth from firebase_auth dependency', () => {
    const result = buildModuleConfig(makeReport({
      detectedModules: ['auth'],
      rawDependencies: ['firebase_auth', 'firebase_core'],
    }));
    expect(result.auth).toEqual({ enabled: true, provider: 'firebase' });
  });

  it('detects supabase auth from supabase_flutter dependency', () => {
    const result = buildModuleConfig(makeReport({
      detectedModules: ['auth'],
      rawDependencies: ['supabase_flutter'],
    }));
    expect(result.auth).toEqual({ enabled: true, provider: 'supabase' });
  });

  it('falls back to custom auth when neither firebase nor supabase found', () => {
    const result = buildModuleConfig(makeReport({
      detectedModules: ['auth'],
      rawDependencies: [],
    }));
    expect(result.auth).toEqual({ enabled: true, provider: 'custom' });
  });

  it('detects api module', () => {
    const result = buildModuleConfig(makeReport({
      detectedModules: ['api'],
      rawDependencies: ['dio'],
    }));
    expect(result.api).toEqual({ enabled: true });
  });

  it('detects drift database from drift dependency', () => {
    const result = buildModuleConfig(makeReport({
      detectedModules: ['database'],
      rawDependencies: ['drift'],
    }));
    expect(result.database).toEqual({ enabled: true, engine: 'drift' });
  });

  it('detects isar database from isar dependency', () => {
    const result = buildModuleConfig(makeReport({
      detectedModules: ['database'],
      rawDependencies: ['isar', 'isar_flutter_libs'],
    }));
    expect(result.database).toEqual({ enabled: true, engine: 'isar' });
  });

  it('falls back to hive database when neither drift nor isar found', () => {
    const result = buildModuleConfig(makeReport({
      detectedModules: ['database'],
      rawDependencies: ['hive', 'hive_flutter'],
    }));
    expect(result.database).toEqual({ enabled: true, engine: 'hive' });
  });

  it('detects firebase push from firebase_messaging dependency', () => {
    const result = buildModuleConfig(makeReport({
      detectedModules: ['push'],
      rawDependencies: ['firebase_messaging'],
    }));
    expect(result.push).toEqual({ enabled: true, provider: 'firebase' });
  });

  it('falls back to onesignal push when firebase_messaging not found', () => {
    const result = buildModuleConfig(makeReport({
      detectedModules: ['push'],
      rawDependencies: ['onesignal_flutter'],
    }));
    expect(result.push).toEqual({ enabled: true, provider: 'onesignal' });
  });

  it('detects multiple modules simultaneously', () => {
    const result = buildModuleConfig(makeReport({
      detectedModules: ['auth', 'api', 'i18n', 'theme', 'analytics', 'cicd', 'deep-linking'],
      rawDependencies: ['firebase_auth'],
    }));
    expect(result.auth).toBeDefined();
    expect(result.api).toBeDefined();
    expect(result.i18n).toBeDefined();
    expect(result.theme).toBeDefined();
    expect(result.analytics).toBeDefined();
    expect(result.cicd).toBeDefined();
    expect(result['deep-linking']).toBeDefined();
  });
});

describe('detectOrgId', () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), 'migrate-orgid-test-'));
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  it('extracts applicationId from build.gradle', async () => {
    const gradleDir = join(tmpDir, 'android', 'app');
    await mkdir(gradleDir, { recursive: true });
    await writeFile(
      join(gradleDir, 'build.gradle'),
      `android {
    defaultConfig {
        applicationId "com.mycompany.myapp"
        minSdkVersion 21
    }
}`,
      'utf-8',
    );

    const orgId = await detectOrgId(tmpDir, 'test_app');
    expect(orgId).toBe('com.mycompany.myapp');
  });

  it('extracts applicationId from build.gradle.kts', async () => {
    const gradleDir = join(tmpDir, 'android', 'app');
    await mkdir(gradleDir, { recursive: true });
    await writeFile(
      join(gradleDir, 'build.gradle.kts'),
      `android {
    defaultConfig {
        applicationId = "com.kts.myapp"
        minSdk = 21
    }
}`,
      'utf-8',
    );

    const orgId = await detectOrgId(tmpDir, 'test_app');
    expect(orgId).toBe('com.kts.myapp');
  });

  it('prefers build.gradle over build.gradle.kts', async () => {
    const gradleDir = join(tmpDir, 'android', 'app');
    await mkdir(gradleDir, { recursive: true });
    await writeFile(
      join(gradleDir, 'build.gradle'),
      'applicationId "com.gradle.app"',
      'utf-8',
    );
    await writeFile(
      join(gradleDir, 'build.gradle.kts'),
      'applicationId = "com.kts.app"',
      'utf-8',
    );

    const orgId = await detectOrgId(tmpDir, 'test_app');
    expect(orgId).toBe('com.gradle.app');
  });

  it('falls back to com.example.<projectName> when no gradle files exist', async () => {
    const orgId = await detectOrgId(tmpDir, 'my_flutter_app');
    expect(orgId).toBe('com.example.my_flutter_app');
  });

  it('falls back to com.example.<projectName> when gradle has no applicationId', async () => {
    const gradleDir = join(tmpDir, 'android', 'app');
    await mkdir(gradleDir, { recursive: true });
    await writeFile(
      join(gradleDir, 'build.gradle'),
      'android { defaultConfig { minSdkVersion 21 } }',
      'utf-8',
    );

    const orgId = await detectOrgId(tmpDir, 'test_app');
    expect(orgId).toBe('com.example.test_app');
  });
});
