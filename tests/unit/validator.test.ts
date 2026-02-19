import { jest } from '@jest/globals';

// Create mock for execa
const mockExeca = jest.fn<(...args: unknown[]) => Promise<unknown>>();

// Register mock BEFORE importing the module under test
jest.unstable_mockModule('execa', () => ({
  execa: mockExeca,
}));

// Dynamic import AFTER mocks are registered
const { validateEnvironment } = await import('../../src/core/validator.js');

describe('validateEnvironment', () => {
  beforeEach(() => {
    mockExeca.mockReset();
  });

  it('returns valid when all tools are installed', async () => {
    mockExeca.mockResolvedValue({ stdout: '' });

    const result = await validateEnvironment();

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.warnings).toHaveLength(0);
  });

  it('reports error when flutter is not installed', async () => {
    mockExeca
      .mockRejectedValueOnce(new Error('not found'))  // flutter
      .mockResolvedValueOnce({ stdout: '' })           // dart
      .mockResolvedValueOnce({ stdout: '' });           // git

    const result = await validateEnvironment();

    expect(result.valid).toBe(false);
    expect(result.errors).toContain('flutter is not installed or not found in PATH');
  });

  it('reports error when dart is not installed', async () => {
    mockExeca
      .mockResolvedValueOnce({ stdout: '' })            // flutter
      .mockRejectedValueOnce(new Error('not found'))    // dart
      .mockResolvedValueOnce({ stdout: '' });            // git

    const result = await validateEnvironment();

    expect(result.valid).toBe(false);
    expect(result.errors).toContain('dart is not installed or not found in PATH');
  });

  it('reports error when git is not installed', async () => {
    mockExeca
      .mockResolvedValueOnce({ stdout: '' })            // flutter
      .mockResolvedValueOnce({ stdout: '' })            // dart
      .mockRejectedValueOnce(new Error('not found'));    // git

    const result = await validateEnvironment();

    expect(result.valid).toBe(false);
    expect(result.errors).toContain('git is not installed or not found in PATH');
  });

  it('reports multiple errors when multiple tools are missing', async () => {
    mockExeca.mockRejectedValue(new Error('not found'));

    const result = await validateEnvironment();

    expect(result.valid).toBe(false);
    expect(result.errors).toHaveLength(3);
    expect(result.errors).toContain('flutter is not installed or not found in PATH');
    expect(result.errors).toContain('dart is not installed or not found in PATH');
    expect(result.errors).toContain('git is not installed or not found in PATH');
  });
});
