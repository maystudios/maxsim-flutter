import { jest } from '@jest/globals';

// Create mock for execa
const mockExeca = jest.fn<(...args: unknown[]) => Promise<unknown>>();

// Register mock BEFORE importing the modules under test
jest.unstable_mockModule('execa', () => ({
  execa: mockExeca,
}));

// Dynamic imports AFTER mocks are registered
const { runBuildRunner } = await import('../../src/scaffold/post-processors/build-runner.js');
const { runDartFormat } = await import('../../src/scaffold/post-processors/dart-format.js');
const { runFlutterPubGet } = await import('../../src/scaffold/post-processors/flutter-pub-get.js');

describe('runBuildRunner', () => {
  beforeEach(() => {
    mockExeca.mockReset();
    mockExeca.mockResolvedValue({ stdout: '' });
  });

  it('calls dart run build_runner build with correct args', async () => {
    await runBuildRunner('/project');

    expect(mockExeca).toHaveBeenCalledWith(
      'dart',
      ['run', 'build_runner', 'build', '--delete-conflicting-outputs'],
      expect.objectContaining({ cwd: '/project' }),
    );
  });

  it('passes the project directory as cwd', async () => {
    await runBuildRunner('/my/custom/dir');

    const callArgs = mockExeca.mock.calls[0];
    expect((callArgs[2] as Record<string, unknown>).cwd).toBe('/my/custom/dir');
  });
});

describe('runDartFormat', () => {
  beforeEach(() => {
    mockExeca.mockReset();
    mockExeca.mockResolvedValue({ stdout: '' });
  });

  it('calls dart format . with correct args', async () => {
    await runDartFormat('/project');

    expect(mockExeca).toHaveBeenCalledWith(
      'dart',
      ['format', '.'],
      expect.objectContaining({ cwd: '/project' }),
    );
  });

  it('passes the project directory as cwd', async () => {
    await runDartFormat('/other/dir');

    const callArgs = mockExeca.mock.calls[0];
    expect((callArgs[2] as Record<string, unknown>).cwd).toBe('/other/dir');
  });
});

describe('runFlutterPubGet', () => {
  beforeEach(() => {
    mockExeca.mockReset();
    mockExeca.mockResolvedValue({ stdout: '' });
  });

  it('calls flutter pub get with correct args', async () => {
    await runFlutterPubGet('/project');

    expect(mockExeca).toHaveBeenCalledWith(
      'flutter',
      ['pub', 'get'],
      expect.objectContaining({ cwd: '/project' }),
    );
  });

  it('passes the project directory as cwd', async () => {
    await runFlutterPubGet('/another/dir');

    const callArgs = mockExeca.mock.calls[0];
    expect((callArgs[2] as Record<string, unknown>).cwd).toBe('/another/dir');
  });
});
