import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';

// Must set up mocks before any import of the module under test
const mockReadFile = jest.fn<() => Promise<string>>();
const mockWriteFile = jest.fn<() => Promise<void>>();
const mockMkdir = jest.fn<() => Promise<string | undefined>>();
const mockReadFileSync = jest.fn<() => string>();

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const jestAny = jest as any;

jestAny.unstable_mockModule('node:fs/promises', () => ({
  readFile: mockReadFile,
  writeFile: mockWriteFile,
  mkdir: mockMkdir,
}));

jestAny.unstable_mockModule('node:fs', () => ({
  readFileSync: mockReadFileSync,
}));

// Dynamic import AFTER mocks are registered
const { checkForUpdate } = await import('../../src/cli/version-check.js');

const STALE_TIMESTAMP = String(Date.now() - 25 * 60 * 60 * 1000); // 25 hours ago
const FRESH_TIMESTAMP = String(Date.now() - 1 * 60 * 60 * 1000);  // 1 hour ago

function mockFetch(version: string, ok = true): void {
  global.fetch = jest.fn<typeof fetch>().mockResolvedValueOnce({
    ok,
    json: async () => ({ version }),
  } as Response);
}

function mockFetchError(): void {
  global.fetch = jest.fn<typeof fetch>().mockRejectedValueOnce(new Error('Network error'));
}

describe('checkForUpdate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default: package.json returns version 0.1.0
    mockReadFileSync.mockReturnValue(JSON.stringify({ version: '0.1.0' }));
    // Default: mkdir and writeFile succeed
    mockMkdir.mockResolvedValue(undefined);
    mockWriteFile.mockResolvedValue(undefined);
  });

  afterEach(() => {
    delete (global as Record<string, unknown>).fetch;
  });

  it('returns null when check was done within the last 24 hours', async () => {
    mockReadFile.mockResolvedValueOnce(FRESH_TIMESTAMP);
    mockFetch('0.2.0');

    const result = await checkForUpdate();
    expect(result).toBeNull();
    // fetch should not have been called since the check is not due
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('returns newer version string when a newer version exists on npm', async () => {
    mockReadFile.mockRejectedValueOnce(new Error('ENOENT'));
    mockFetch('0.2.0');

    const result = await checkForUpdate();
    expect(result).toBe('0.2.0');
  });

  it('returns null when current version is already up to date', async () => {
    mockReadFile.mockRejectedValueOnce(new Error('ENOENT'));
    mockFetch('0.1.0'); // same as current

    const result = await checkForUpdate();
    expect(result).toBeNull();
  });

  it('returns null when registry version is older than current', async () => {
    mockReadFile.mockRejectedValueOnce(new Error('ENOENT'));
    mockFetch('0.0.9');

    const result = await checkForUpdate();
    expect(result).toBeNull();
  });

  it('returns null and does not throw when fetch fails with a network error', async () => {
    mockReadFile.mockRejectedValueOnce(new Error('ENOENT'));
    mockFetchError();

    await expect(checkForUpdate()).resolves.toBeNull();
  });

  it('returns null and does not throw when fetch returns non-ok response', async () => {
    mockReadFile.mockRejectedValueOnce(new Error('ENOENT'));
    mockFetch('0.2.0', false /* ok=false */);

    await expect(checkForUpdate()).resolves.toBeNull();
  });

  it('records the check timestamp after a successful fetch', async () => {
    mockReadFile.mockRejectedValueOnce(new Error('ENOENT'));
    mockFetch('0.2.0');

    await checkForUpdate();

    expect(mockMkdir).toHaveBeenCalled();
    expect(mockWriteFile).toHaveBeenCalledWith(
      expect.stringContaining('last-update-check'),
      expect.any(String),
      'utf-8',
    );
  });

  it('does not throw when recording the timestamp fails (mkdir error)', async () => {
    mockReadFile.mockRejectedValueOnce(new Error('ENOENT'));
    mockFetch('0.2.0');
    mockMkdir.mockRejectedValueOnce(new Error('EACCES'));

    await expect(checkForUpdate()).resolves.toBe('0.2.0');
  });

  it('handles stale cache file (older than 24 hours) by running the check', async () => {
    mockReadFile.mockResolvedValueOnce(STALE_TIMESTAMP);
    mockFetch('0.3.0');

    const result = await checkForUpdate();
    expect(result).toBe('0.3.0');
  });

  it('handles corrupt cache file content gracefully', async () => {
    mockReadFile.mockResolvedValueOnce('not-a-number');
    mockFetch('0.2.0');

    const result = await checkForUpdate();
    expect(result).toBe('0.2.0');
  });
});
