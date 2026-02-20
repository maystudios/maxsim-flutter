/**
 * Tests for promptForModuleConfig() — per-module interactive configuration.
 * Uses ESM mocking to control @clack/prompts.select responses.
 */
import { jest } from '@jest/globals';

const mockSelect = jest.fn<() => Promise<unknown>>();

jest.unstable_mockModule('@clack/prompts', () => ({
  select: mockSelect,
  text: jest.fn(),
  multiselect: jest.fn(),
  group: jest.fn(),
  cancel: jest.fn(),
  intro: jest.fn(),
  outro: jest.fn(),
  log: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    success: jest.fn(),
  },
}));

const { promptForModuleConfig } = await import('../../src/cli/ui/prompts.js');

describe('promptForModuleConfig', () => {
  beforeEach(() => {
    mockSelect.mockReset();
  });

  describe('auth module', () => {
    it('returns firebase provider config when user selects firebase', async () => {
      mockSelect.mockResolvedValueOnce('firebase');
      const result = await promptForModuleConfig('auth');
      expect(result).toEqual({ enabled: true, provider: 'firebase' });
      expect(mockSelect).toHaveBeenCalledWith(
        expect.objectContaining({ message: expect.stringContaining('Auth') }),
      );
    });

    it('returns supabase provider config when user selects supabase', async () => {
      mockSelect.mockResolvedValueOnce('supabase');
      const result = await promptForModuleConfig('auth');
      expect(result).toEqual({ enabled: true, provider: 'supabase' });
    });

    it('returns custom provider config when user selects custom', async () => {
      mockSelect.mockResolvedValueOnce('custom');
      const result = await promptForModuleConfig('auth');
      expect(result).toEqual({ enabled: true, provider: 'custom' });
    });
  });

  describe('push module', () => {
    it('returns firebase provider config when user selects firebase', async () => {
      mockSelect.mockResolvedValueOnce('firebase');
      const result = await promptForModuleConfig('push');
      expect(result).toEqual({ enabled: true, provider: 'firebase' });
    });

    it('returns onesignal provider config when user selects onesignal', async () => {
      mockSelect.mockResolvedValueOnce('onesignal');
      const result = await promptForModuleConfig('push');
      expect(result).toEqual({ enabled: true, provider: 'onesignal' });
    });
  });

  describe('database module', () => {
    it('returns drift engine config when user selects drift', async () => {
      mockSelect.mockResolvedValueOnce('drift');
      const result = await promptForModuleConfig('database');
      expect(result).toEqual({ enabled: true, engine: 'drift' });
    });

    it('returns isar engine config when user selects isar', async () => {
      mockSelect.mockResolvedValueOnce('isar');
      const result = await promptForModuleConfig('database');
      expect(result).toEqual({ enabled: true, engine: 'isar' });
    });
  });

  describe('modules without specific config', () => {
    it('returns enabled: true for api without prompting', async () => {
      const result = await promptForModuleConfig('api');
      expect(result).toEqual({ enabled: true });
      expect(mockSelect).not.toHaveBeenCalled();
    });

    it('returns enabled: true for unknown module without prompting', async () => {
      const result = await promptForModuleConfig('theme');
      expect(result).toEqual({ enabled: true });
      expect(mockSelect).not.toHaveBeenCalled();
    });
  });
});
