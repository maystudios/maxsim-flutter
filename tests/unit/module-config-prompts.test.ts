/**
 * Tests for promptForModuleConfig() — per-module interactive configuration.
 * Uses ESM mocking to control @clack/prompts.select responses.
 */
import { jest } from '@jest/globals';

const mockSelect = jest.fn<() => Promise<unknown>>();
const mockCancel = jest.fn();
const mockIsCancel = jest.fn<(value: unknown) => boolean>();

jest.unstable_mockModule('@clack/prompts', () => ({
  select: mockSelect,
  text: jest.fn(),
  multiselect: jest.fn(),
  group: jest.fn(),
  cancel: mockCancel,
  isCancel: mockIsCancel,
  intro: jest.fn(),
  outro: jest.fn(),
  log: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    success: jest.fn(),
  },
}));

const { promptForModuleConfig, promptForPreset } = await import('../../src/cli/ui/prompts.js');

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

describe('promptForPreset', () => {
  let mockProcessExit: ReturnType<typeof jest.spyOn>;

  beforeEach(() => {
    mockSelect.mockReset();
    mockCancel.mockReset();
    mockIsCancel.mockReset();
    mockProcessExit = jest.spyOn(process, 'exit').mockImplementation((() => {}) as typeof process.exit);
  });

  afterEach(() => {
    mockProcessExit.mockRestore();
  });

  it('returns the selected PresetId when user picks a preset (no cancel)', async () => {
    mockSelect.mockResolvedValueOnce('standard');
    mockIsCancel.mockReturnValueOnce(false);

    const result = await promptForPreset();

    expect(result).toBe('standard');
    expect(mockCancel).not.toHaveBeenCalled();
  });

  it('calls p.cancel and process.exit(0) when user cancels preset selection (isCancel=true)', async () => {
    mockSelect.mockResolvedValueOnce(Symbol('cancel'));
    mockIsCancel.mockReturnValueOnce(true);

    await promptForPreset();

    expect(mockCancel).toHaveBeenCalledWith('Project creation cancelled.');
    expect(mockProcessExit).toHaveBeenCalledWith(0);
  });

  it('presents all 4 PRESETS as select options', async () => {
    mockSelect.mockResolvedValueOnce('minimal');
    mockIsCancel.mockReturnValueOnce(false);

    await promptForPreset();

    const selectArg = (mockSelect.mock.calls[0] as unknown as [{ options: Array<{ value: string }> }])[0];
    const values = selectArg.options.map((o) => o.value);
    expect(values).toEqual(['minimal', 'standard', 'full', 'custom']);
  });
});
