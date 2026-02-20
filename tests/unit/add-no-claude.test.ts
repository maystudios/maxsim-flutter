import { jest } from '@jest/globals';
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { dump as yamlDump } from 'js-yaml';
import { useTempDir } from '../helpers/temp-dir.js';

// ── Mock factories (declared before unstable_mockModule calls) ─────────────

const mockLogInfo = jest.fn();
const mockRunClaudeSetup = jest.fn<() => Promise<void>>();
const mockLoadConfig = jest.fn<() => Promise<Record<string, unknown>>>();
const mockParseConfig = jest.fn<() => Record<string, unknown>>();
const mockCreateProjectContext = jest.fn<() => Record<string, unknown>>();

const mockRegistryLoadAll = jest.fn<() => Promise<void>>();
const mockRegistryGetAllOptionalIds = jest.fn<() => string[]>();
const mockRegistryHas = jest.fn<(id: string) => boolean>();
const mockRegistryGet = jest.fn<() => Record<string, unknown>>();

const mockResolverResolve = jest.fn<() => Record<string, unknown>>();
const mockWriteAll = jest.fn<() => Promise<Record<string, unknown>>>();
const mockCollectAndRenderTemplates = jest.fn<() => Promise<unknown[]>>();
const mockProcessPubspecPartial = jest.fn<() => Promise<Record<string, unknown>>>();

// ── ESM mocks (BEFORE dynamic import) ──────────────────────────────────────

jest.unstable_mockModule('@clack/prompts', () => ({
  intro: jest.fn(),
  log: {
    info: mockLogInfo,
    success: jest.fn(),
    warn: jest.fn(),
    step: jest.fn(),
    error: jest.fn(),
  },
  outro: jest.fn(),
  isCancel: jest.fn().mockReturnValue(false),
  select: jest.fn(),
  cancel: jest.fn(),
  text: jest.fn(),
  confirm: jest.fn(),
}));

jest.unstable_mockModule('../../src/core/config/loader.js', () => ({
  loadConfig: mockLoadConfig,
  parseConfig: mockParseConfig,
}));

jest.unstable_mockModule('../../src/core/context.js', () => ({
  createProjectContext: mockCreateProjectContext,
}));

jest.unstable_mockModule('../../src/claude-setup/index.js', () => ({
  runClaudeSetup: mockRunClaudeSetup,
}));

jest.unstable_mockModule('../../src/modules/registry.js', () => ({
  ModuleRegistry: jest.fn().mockImplementation(() => ({
    loadAll: mockRegistryLoadAll,
    getAllOptionalIds: mockRegistryGetAllOptionalIds,
    has: mockRegistryHas,
    get: mockRegistryGet,
  })),
}));

jest.unstable_mockModule('../../src/modules/resolver.js', () => ({
  ModuleResolver: jest.fn().mockImplementation(() => ({
    resolve: mockResolverResolve,
  })),
}));

jest.unstable_mockModule('../../src/scaffold/renderer.js', () => ({
  TemplateRenderer: jest.fn().mockImplementation(() => ({})),
}));

jest.unstable_mockModule('../../src/scaffold/file-writer.js', () => ({
  FileWriter: jest.fn().mockImplementation(() => ({
    writeAll: mockWriteAll,
  })),
}));

jest.unstable_mockModule('../../src/scaffold/template-helpers.js', () => ({
  buildTemplateContext: jest.fn().mockReturnValue({}),
  collectAndRenderTemplates: mockCollectAndRenderTemplates,
  processPubspecPartial: mockProcessPubspecPartial,
}));

jest.unstable_mockModule('../../src/cli/ui/spinner.js', () => ({
  createSpinner: jest.fn().mockReturnValue({
    start: jest.fn(),
    succeed: jest.fn(),
  }),
}));

// ── Dynamic import AFTER mocks ─────────────────────────────────────────────

const { createAddCommand } = await import('../../src/cli/commands/add.js');

// ── Helpers ────────────────────────────────────────────────────────────────

function setupMocksForSuccessfulAdd(): void {
  mockRunClaudeSetup.mockResolvedValue(undefined);
  mockRegistryLoadAll.mockResolvedValue(undefined);
  mockRegistryGetAllOptionalIds.mockReturnValue(['theme', 'api', 'auth']);
  mockRegistryHas.mockReturnValue(true);
  mockRegistryGet.mockReturnValue({
    id: 'theme',
    name: 'Theme',
    requires: [],
    questions: [],
    alwaysIncluded: false,
  });
  mockResolverResolve.mockReturnValue({
    ordered: [{ id: 'theme', alwaysIncluded: false }],
  });
  mockWriteAll.mockResolvedValue({ written: [], skipped: [] });
  mockCollectAndRenderTemplates.mockResolvedValue([]);
  mockProcessPubspecPartial.mockResolvedValue({
    deps: new Map(),
    devDeps: new Map(),
    flutter: {},
  });
  mockLoadConfig.mockResolvedValue({
    project: { name: 'test_app', orgId: 'com.example' },
    modules: {},
  });
  mockParseConfig.mockReturnValue({
    project: { name: 'test_app', orgId: 'com.example' },
    modules: { theme: { enabled: true } },
  });
  mockCreateProjectContext.mockReturnValue({
    projectName: 'test_app',
    claude: { enabled: true },
  });
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe('add command — --no-claude flag behavior', () => {
  const tmp = useTempDir('add-no-claude-');

  let mockProcessExit: ReturnType<typeof jest.spyOn>;

  beforeEach(async () => {
    jest.clearAllMocks();
    mockProcessExit = jest.spyOn(process, 'exit').mockImplementation(
      (() => {}) as typeof process.exit,
    );

    // Create real maxsim.config.yaml in temp dir
    const configYaml = yamlDump({
      project: { name: 'test_app', orgId: 'com.example' },
      modules: {},
    });
    await writeFile(join(tmp.path, 'maxsim.config.yaml'), configYaml, 'utf-8');

    setupMocksForSuccessfulAdd();
  });

  afterEach(() => {
    mockProcessExit.mockRestore();
  });

  it('skips Claude setup regeneration when --no-claude is passed', async () => {
    const cmd = createAddCommand();
    await cmd.parseAsync(
      ['theme', '--project-dir', tmp.path, '--no-claude'],
      { from: 'user' },
    );

    expect(mockRunClaudeSetup).not.toHaveBeenCalled();
  });

  it('regenerates Claude setup by default when --no-claude is not passed', async () => {
    const cmd = createAddCommand();
    await cmd.parseAsync(
      ['theme', '--project-dir', tmp.path],
      { from: 'user' },
    );

    expect(mockRunClaudeSetup).toHaveBeenCalled();
  });

  it('omits Claude regeneration message in dry-run when --no-claude is passed', async () => {
    const cmd = createAddCommand();
    await cmd.parseAsync(
      ['theme', '--project-dir', tmp.path, '--dry-run', '--no-claude'],
      { from: 'user' },
    );

    const allInfoCalls = mockLogInfo.mock.calls.flat() as string[];
    expect(allInfoCalls.some((arg) => arg.includes('CLAUDE.md'))).toBe(false);
  });
});
