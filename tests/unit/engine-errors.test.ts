import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { jest } from '@jest/globals';

const TEMPLATES_DIR = resolve('templates/core');

// Mock post-processors before importing the engine
const mockRunDartFormat = jest.fn<() => Promise<void>>();
const mockRunFlutterPubGet = jest.fn<() => Promise<void>>();
const mockRunBuildRunner = jest.fn<() => Promise<void>>();

jest.unstable_mockModule('../../src/scaffold/post-processors/dart-format.js', () => ({
  runDartFormat: mockRunDartFormat,
}));
jest.unstable_mockModule('../../src/scaffold/post-processors/flutter-pub-get.js', () => ({
  runFlutterPubGet: mockRunFlutterPubGet,
}));
jest.unstable_mockModule('../../src/scaffold/post-processors/build-runner.js', () => ({
  runBuildRunner: mockRunBuildRunner,
}));
jest.unstable_mockModule('../../src/claude-setup/index.js', () => ({
  runClaudeSetup: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
}));

// Dynamic import after mocks are registered
const { ScaffoldEngine } = await import('../../src/scaffold/engine.js');
import type { ProjectContext } from '../../src/core/context.js';

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
    outputDir: '/tmp/test-output',
    rawConfig: {} as ProjectContext['rawConfig'],
  };
  return { ...base, ...overrides };
}

describe('ScaffoldEngine post-processor error handling', () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), 'engine-err-test-'));
    jest.clearAllMocks();
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  it('returns empty postProcessorErrors when post-processors are disabled', async () => {
    const engine = new ScaffoldEngine({ templatesDir: TEMPLATES_DIR });
    const context = makeContext({ outputDir: tmpDir });

    const result = await engine.run(context);

    expect(result.postProcessorErrors).toEqual([]);
  });

  it('returns empty postProcessorErrors when all enabled post-processors succeed', async () => {
    mockRunDartFormat.mockResolvedValue(undefined);
    mockRunFlutterPubGet.mockResolvedValue(undefined);

    const engine = new ScaffoldEngine({ templatesDir: TEMPLATES_DIR });
    const context = makeContext({
      scaffold: {
        dryRun: false,
        overwrite: 'always',
        postProcessors: { dartFormat: true, flutterPubGet: true, buildRunner: false },
      },
      outputDir: tmpDir,
    });

    const result = await engine.run(context);

    expect(result.postProcessorErrors).toEqual([]);
    expect(result.postProcessorsRun).toContain('dart-format');
    expect(result.postProcessorsRun).toContain('flutter-pub-get');
  });

  it('captures dart format error in postProcessorErrors', async () => {
    mockRunDartFormat.mockRejectedValue(new Error('dart not found'));

    const engine = new ScaffoldEngine({ templatesDir: TEMPLATES_DIR });
    const context = makeContext({
      scaffold: {
        dryRun: false,
        overwrite: 'always',
        postProcessors: { dartFormat: true, flutterPubGet: false, buildRunner: false },
      },
      outputDir: tmpDir,
    });

    const result = await engine.run(context);

    expect(result.postProcessorErrors).toHaveLength(1);
    expect(result.postProcessorErrors[0]).toBe('dart format skipped: dart not found');
    expect(result.postProcessorsRun).not.toContain('dart-format');
  });

  it('captures flutter pub get error in postProcessorErrors', async () => {
    mockRunFlutterPubGet.mockRejectedValue(new Error('flutter not installed'));

    const engine = new ScaffoldEngine({ templatesDir: TEMPLATES_DIR });
    const context = makeContext({
      scaffold: {
        dryRun: false,
        overwrite: 'always',
        postProcessors: { dartFormat: false, flutterPubGet: true, buildRunner: false },
      },
      outputDir: tmpDir,
    });

    const result = await engine.run(context);

    expect(result.postProcessorErrors).toHaveLength(1);
    expect(result.postProcessorErrors[0]).toBe('flutter pub get failed: flutter not installed');
    expect(result.postProcessorsRun).not.toContain('flutter-pub-get');
  });

  it('captures build runner error in postProcessorErrors', async () => {
    mockRunBuildRunner.mockRejectedValue(new Error('build_runner unavailable'));

    const engine = new ScaffoldEngine({ templatesDir: TEMPLATES_DIR });
    const context = makeContext({
      scaffold: {
        dryRun: false,
        overwrite: 'always',
        postProcessors: { dartFormat: false, flutterPubGet: false, buildRunner: true },
      },
      outputDir: tmpDir,
    });

    const result = await engine.run(context);

    expect(result.postProcessorErrors).toHaveLength(1);
    expect(result.postProcessorErrors[0]).toBe('build_runner failed: build_runner unavailable');
    expect(result.postProcessorsRun).not.toContain('build-runner');
  });

  it('captures non-Error thrown value as string', async () => {
    mockRunDartFormat.mockRejectedValue('string error value');

    const engine = new ScaffoldEngine({ templatesDir: TEMPLATES_DIR });
    const context = makeContext({
      scaffold: {
        dryRun: false,
        overwrite: 'always',
        postProcessors: { dartFormat: true, flutterPubGet: false, buildRunner: false },
      },
      outputDir: tmpDir,
    });

    const result = await engine.run(context);

    expect(result.postProcessorErrors[0]).toContain('string error value');
  });

  it('does not run post-processors in dry-run mode and returns empty errors', async () => {
    const engine = new ScaffoldEngine({ templatesDir: TEMPLATES_DIR });
    const context = makeContext({
      scaffold: {
        dryRun: true,
        overwrite: 'always',
        postProcessors: { dartFormat: true, flutterPubGet: true, buildRunner: true },
      },
      outputDir: tmpDir,
    });

    const result = await engine.run(context);

    expect(result.postProcessorErrors).toEqual([]);
    expect(result.postProcessorsRun).toEqual([]);
    expect(mockRunDartFormat).not.toHaveBeenCalled();
  });

  it('accumulates errors from multiple failing post-processors', async () => {
    mockRunDartFormat.mockRejectedValue(new Error('dart missing'));
    mockRunFlutterPubGet.mockRejectedValue(new Error('flutter missing'));

    const engine = new ScaffoldEngine({ templatesDir: TEMPLATES_DIR });
    const context = makeContext({
      scaffold: {
        dryRun: false,
        overwrite: 'always',
        postProcessors: { dartFormat: true, flutterPubGet: true, buildRunner: false },
      },
      outputDir: tmpDir,
    });

    const result = await engine.run(context);

    expect(result.postProcessorErrors).toHaveLength(2);
    expect(result.postProcessorErrors[0]).toContain('dart format skipped');
    expect(result.postProcessorErrors[1]).toContain('flutter pub get failed');
    expect(result.postProcessorsRun).toEqual([]);
  });
});
