import { resolve } from 'node:path';
import { jest } from '@jest/globals';
import { makeWritableContext } from '../helpers/context-factory.js';
import { useTempDir } from '../helpers/temp-dir.js';

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

describe('ScaffoldEngine post-processor error handling', () => {
  const tmp = useTempDir('engine-err-test-');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns empty postProcessorErrors when post-processors are disabled', async () => {
    const engine = new ScaffoldEngine({ templatesDir: TEMPLATES_DIR });
    const context = makeWritableContext(tmp.path);

    const result = await engine.run(context);

    expect(result.postProcessorErrors).toEqual([]);
  });

  it('returns empty postProcessorErrors when all enabled post-processors succeed', async () => {
    mockRunDartFormat.mockResolvedValue(undefined);
    mockRunFlutterPubGet.mockResolvedValue(undefined);

    const engine = new ScaffoldEngine({ templatesDir: TEMPLATES_DIR });
    const context = makeWritableContext(tmp.path, {
      scaffold: {
        dryRun: false,
        overwrite: 'always',
        postProcessors: { dartFormat: true, flutterPubGet: true, buildRunner: false },
      },
    });

    const result = await engine.run(context);

    expect(result.postProcessorErrors).toEqual([]);
    expect(result.postProcessorsRun).toContain('dart-format');
    expect(result.postProcessorsRun).toContain('flutter-pub-get');
  });

  it('captures dart format error in postProcessorErrors', async () => {
    mockRunDartFormat.mockRejectedValue(new Error('dart not found'));

    const engine = new ScaffoldEngine({ templatesDir: TEMPLATES_DIR });
    const context = makeWritableContext(tmp.path, {
      scaffold: {
        dryRun: false,
        overwrite: 'always',
        postProcessors: { dartFormat: true, flutterPubGet: false, buildRunner: false },
      },
    });

    const result = await engine.run(context);

    expect(result.postProcessorErrors).toHaveLength(1);
    expect(result.postProcessorErrors[0]).toBe('dart format skipped: dart not found');
    expect(result.postProcessorsRun).not.toContain('dart-format');
  });

  it('captures flutter pub get error in postProcessorErrors', async () => {
    mockRunFlutterPubGet.mockRejectedValue(new Error('flutter not installed'));

    const engine = new ScaffoldEngine({ templatesDir: TEMPLATES_DIR });
    const context = makeWritableContext(tmp.path, {
      scaffold: {
        dryRun: false,
        overwrite: 'always',
        postProcessors: { dartFormat: false, flutterPubGet: true, buildRunner: false },
      },
    });

    const result = await engine.run(context);

    expect(result.postProcessorErrors).toHaveLength(1);
    expect(result.postProcessorErrors[0]).toBe('flutter pub get failed: flutter not installed');
    expect(result.postProcessorsRun).not.toContain('flutter-pub-get');
  });

  it('captures build runner error in postProcessorErrors', async () => {
    mockRunBuildRunner.mockRejectedValue(new Error('build_runner unavailable'));

    const engine = new ScaffoldEngine({ templatesDir: TEMPLATES_DIR });
    const context = makeWritableContext(tmp.path, {
      scaffold: {
        dryRun: false,
        overwrite: 'always',
        postProcessors: { dartFormat: false, flutterPubGet: false, buildRunner: true },
      },
    });

    const result = await engine.run(context);

    expect(result.postProcessorErrors).toHaveLength(1);
    expect(result.postProcessorErrors[0]).toBe('build_runner failed: build_runner unavailable');
    expect(result.postProcessorsRun).not.toContain('build-runner');
  });

  it('captures non-Error thrown value as string', async () => {
    mockRunDartFormat.mockRejectedValue('string error value');

    const engine = new ScaffoldEngine({ templatesDir: TEMPLATES_DIR });
    const context = makeWritableContext(tmp.path, {
      scaffold: {
        dryRun: false,
        overwrite: 'always',
        postProcessors: { dartFormat: true, flutterPubGet: false, buildRunner: false },
      },
    });

    const result = await engine.run(context);

    expect(result.postProcessorErrors[0]).toContain('string error value');
  });

  it('captures non-Error thrown value as string for flutter pub get', async () => {
    mockRunFlutterPubGet.mockRejectedValue('flutter-string-error');

    const engine = new ScaffoldEngine({ templatesDir: TEMPLATES_DIR });
    const context = makeWritableContext(tmp.path, {
      scaffold: {
        dryRun: false,
        overwrite: 'always',
        postProcessors: { dartFormat: false, flutterPubGet: true, buildRunner: false },
      },
    });

    const result = await engine.run(context);

    expect(result.postProcessorErrors[0]).toContain('flutter-string-error');
  });

  it('captures non-Error thrown value as string for build runner', async () => {
    mockRunBuildRunner.mockRejectedValue('build-runner-string-error');

    const engine = new ScaffoldEngine({ templatesDir: TEMPLATES_DIR });
    const context = makeWritableContext(tmp.path, {
      scaffold: {
        dryRun: false,
        overwrite: 'always',
        postProcessors: { dartFormat: false, flutterPubGet: false, buildRunner: true },
      },
    });

    const result = await engine.run(context);

    expect(result.postProcessorErrors[0]).toContain('build-runner-string-error');
  });

  it('does not run post-processors in dry-run mode and returns empty errors', async () => {
    const engine = new ScaffoldEngine({ templatesDir: TEMPLATES_DIR });
    const context = makeWritableContext(tmp.path, {
      scaffold: {
        dryRun: true,
        overwrite: 'always',
        postProcessors: { dartFormat: true, flutterPubGet: true, buildRunner: true },
      },
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
    const context = makeWritableContext(tmp.path, {
      scaffold: {
        dryRun: false,
        overwrite: 'always',
        postProcessors: { dartFormat: true, flutterPubGet: true, buildRunner: false },
      },
    });

    const result = await engine.run(context);

    expect(result.postProcessorErrors).toHaveLength(2);
    expect(result.postProcessorErrors[0]).toContain('dart format skipped');
    expect(result.postProcessorErrors[1]).toContain('flutter pub get failed');
    expect(result.postProcessorsRun).toEqual([]);
  });
});
