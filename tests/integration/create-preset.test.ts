import { jest } from '@jest/globals';

const mockPromptForPreset = jest.fn<() => Promise<string>>();
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockPromptForProjectCreation = jest.fn<(defaults?: any, options?: any) => Promise<Record<string, unknown>>>();
const mockPromptForModuleConfig = jest.fn<() => Promise<Record<string, unknown>>>();
const mockValidateEnvironment = jest.fn<() => Promise<{ valid: boolean; errors: string[] }>>();
const mockEngineRun = jest.fn<() => Promise<{
  filesWritten: string[];
  filesSkipped: string[];
  postProcessorsRun: string[];
  postProcessorErrors: string[];
}>>();

jest.unstable_mockModule('../../src/cli/ui/prompts.js', () => ({
  promptForPreset: mockPromptForPreset,
  promptForProjectCreation: mockPromptForProjectCreation,
  promptForModuleConfig: mockPromptForModuleConfig,
  getPresetModules: (id: string) => {
    if (id === 'standard') return ['auth', 'api', 'theme'];
    if (id === 'full') return ['auth', 'api', 'theme', 'database', 'i18n', 'push', 'analytics', 'cicd', 'deep-linking'];
    return [];
  },
  PRESETS: [],
}));

jest.unstable_mockModule('../../src/core/validator.js', () => ({
  validateEnvironment: mockValidateEnvironment,
}));

jest.unstable_mockModule('../../src/scaffold/engine.js', () => ({
  ScaffoldEngine: jest.fn().mockImplementation(() => ({ run: mockEngineRun })),
}));

const { createCreateCommand } = await import('../../src/cli/commands/create.js');

describe('create command preset integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockValidateEnvironment.mockResolvedValue({ valid: true, errors: [] });
    mockEngineRun.mockResolvedValue({
      filesWritten: ['lib/main.dart'],
      filesSkipped: [],
      postProcessorsRun: [],
      postProcessorErrors: [],
    });
    mockPromptForModuleConfig.mockResolvedValue({ enabled: true });
  });

  it('standard preset skips module multiselect and passes auth/api/theme to config', async () => {
    mockPromptForPreset.mockResolvedValue('standard');
    mockPromptForProjectCreation.mockImplementation(async (_defaults, options) => {
      expect(options?.skipModules).toBe(true);
      expect(options?.defaultModules).toEqual(['auth', 'api', 'theme']);
      return {
        projectName: 'test_app',
        orgId: 'com.test',
        description: 'Test',
        platforms: ['android'],
        modules: ['auth', 'api', 'theme'],
      };
    });

    const cmd = createCreateCommand();
    await cmd.parseAsync(['node', 'maxsim', 'test_app']);

    expect(mockPromptForPreset).toHaveBeenCalledTimes(1);
    expect(mockPromptForProjectCreation).toHaveBeenCalledTimes(1);
  });

  it('custom preset passes skipModules=false so multiselect is shown', async () => {
    mockPromptForPreset.mockResolvedValue('custom');
    mockPromptForProjectCreation.mockImplementation(async (_defaults, options) => {
      expect(options?.skipModules).toBe(false);
      return {
        projectName: 'test_app',
        orgId: 'com.test',
        description: 'Test',
        platforms: ['android'],
        modules: ['database'],
      };
    });

    const cmd = createCreateCommand();
    await cmd.parseAsync(['node', 'maxsim', 'test_app']);

    expect(mockPromptForPreset).toHaveBeenCalledTimes(1);
  });

  it('minimal preset pre-fills empty module list', async () => {
    mockPromptForPreset.mockResolvedValue('minimal');
    mockPromptForProjectCreation.mockImplementation(async (_defaults, options) => {
      expect(options?.skipModules).toBe(true);
      expect(options?.defaultModules).toEqual([]);
      return {
        projectName: 'test_app',
        orgId: 'com.test',
        description: 'Test',
        platforms: ['android'],
        modules: [],
      };
    });

    const cmd = createCreateCommand();
    await cmd.parseAsync(['node', 'maxsim', 'test_app']);

    expect(mockEngineRun).toHaveBeenCalledTimes(1);
  });

  it('--yes flag skips preset prompt entirely', async () => {
    const cmd = createCreateCommand();
    await cmd.parseAsync(['node', 'maxsim', 'test_app', '--yes', '--org', 'com.test']);

    expect(mockPromptForPreset).not.toHaveBeenCalled();
    expect(mockPromptForProjectCreation).not.toHaveBeenCalled();
    expect(mockEngineRun).toHaveBeenCalledTimes(1);
  });
});
