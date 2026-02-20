import { jest } from '@jest/globals';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { useTempDir } from '../helpers/temp-dir.js';

// ── Mock factories (must be declared before unstable_mockModule calls) ─────────

const mockIntro = jest.fn();
const mockLogInfo = jest.fn();
const mockLogStep = jest.fn();
const mockLogSuccess = jest.fn();
const mockLogError = jest.fn();
const mockOutro = jest.fn();
const mockConfirm = jest.fn<() => Promise<boolean | symbol>>();
const mockCancel = jest.fn();
const mockIsCancel = jest.fn<(value: unknown) => boolean>();

const mockFindProjectRoot = jest.fn<() => Promise<string | null>>();
const mockLoadConfig = jest.fn<() => Promise<Record<string, unknown>>>();
const mockParseConfig = jest.fn<(raw: unknown) => Record<string, unknown>>();
const mockCreateProjectContext = jest.fn<() => Record<string, unknown>>();
const mockRunClaudeSetup = jest.fn<() => Promise<{ filesWritten: string[] }>>();

// ── ESM mocks: must be registered BEFORE dynamic import ───────────────────────

jest.unstable_mockModule('@clack/prompts', () => ({
  intro: mockIntro,
  log: {
    info: mockLogInfo,
    step: mockLogStep,
    success: mockLogSuccess,
    error: mockLogError,
  },
  outro: mockOutro,
  confirm: mockConfirm,
  cancel: mockCancel,
  isCancel: mockIsCancel,
}));

jest.unstable_mockModule('../../src/cli/commands/add.js', () => ({
  findProjectRoot: mockFindProjectRoot,
}));

jest.unstable_mockModule('../../src/core/config/loader.js', () => ({
  loadConfig: mockLoadConfig,
  parseConfig: mockParseConfig,
}));

jest.unstable_mockModule('../../src/core/context.js', () => ({
  createProjectContext: mockCreateProjectContext,
}));

jest.unstable_mockModule('../../src/claude-setup/setup-orchestrator.js', () => ({
  runClaudeSetup: mockRunClaudeSetup,
}));

// ── Dynamic import AFTER mocks ────────────────────────────────────────────────

const { createUpgradeCommand } = await import('../../src/cli/commands/upgrade.js');

// ── Shared test helpers ───────────────────────────────────────────────────────

function setupValidProjectMocks(projectRoot: string): void {
  mockFindProjectRoot.mockResolvedValue(projectRoot);
  mockLoadConfig.mockResolvedValue({});
  mockParseConfig.mockReturnValue({ project: { name: 'test_app', orgId: 'com.example' }, modules: {} });
  mockCreateProjectContext.mockReturnValue({ projectName: 'test_app' });
  mockRunClaudeSetup.mockResolvedValue({ filesWritten: ['CLAUDE.md'] });
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('runUpgrade — via command action (mocked deps)', () => {
  const tmp = useTempDir('upgrade-run-test-');

  let mockProcessExit: ReturnType<typeof jest.spyOn>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockIsCancel.mockReturnValue(false);
    mockProcessExit = jest.spyOn(process, 'exit').mockImplementation((() => {
      // no-op so tests don't actually exit
    }) as typeof process.exit);
  });

  afterEach(() => {
    mockProcessExit.mockRestore();
  });

  // ── Error path ────────────────────────────────────────────────────────────

  it('calls p.log.error and process.exit(1) when findProjectRoot returns null', async () => {
    mockFindProjectRoot.mockResolvedValue(null);

    const cmd = createUpgradeCommand();
    await cmd.parseAsync(['--yes'], { from: 'user' });

    expect(mockLogError).toHaveBeenCalledWith(expect.stringContaining('maxsim.config.yaml'));
    expect(mockProcessExit).toHaveBeenCalledWith(1);
  });

  it('calls p.log.error and process.exit(1) when loadConfig throws', async () => {
    mockFindProjectRoot.mockResolvedValue(tmp.path);
    mockLoadConfig.mockRejectedValue(new Error('ENOENT: no such file'));

    const cmd = createUpgradeCommand();
    await cmd.parseAsync(['--yes'], { from: 'user' });

    expect(mockLogError).toHaveBeenCalledWith(expect.stringContaining('ENOENT'));
    expect(mockProcessExit).toHaveBeenCalledWith(1);
  });

  it('calls p.log.error with String(err) when a non-Error value is thrown', async () => {
    // Simulate a non-Error rejection (e.g., a plain string thrown by some lib)
    mockFindProjectRoot.mockRejectedValue('plain string error — not an Error instance');

    const cmd = createUpgradeCommand();
    await cmd.parseAsync(['--yes'], { from: 'user' });

    expect(mockLogError).toHaveBeenCalledWith('plain string error — not an Error instance');
    expect(mockProcessExit).toHaveBeenCalledWith(1);
  });

  // ── Dry-run path ──────────────────────────────────────────────────────────

  it('calls p.outro("Dry run complete") and skips runClaudeSetup in --dry-run mode', async () => {
    setupValidProjectMocks(tmp.path);

    const cmd = createUpgradeCommand();
    await cmd.parseAsync(['--dry-run'], { from: 'user' });

    expect(mockOutro).toHaveBeenCalledWith(expect.stringContaining('Dry run complete'));
    expect(mockRunClaudeSetup).not.toHaveBeenCalled();
  });

  it('shows prd.json in dry-run listing when --regenerate-prd is passed', async () => {
    setupValidProjectMocks(tmp.path);

    const cmd = createUpgradeCommand();
    await cmd.parseAsync(['--dry-run', '--regenerate-prd'], { from: 'user' });

    const stepArgs = mockLogStep.mock.calls.flat() as string[];
    expect(stepArgs.some((arg) => arg.includes('prd.json'))).toBe(true);
  });

  it('shows agents backup listing in dry-run when agents dir has .md files', async () => {
    const projectRoot = join(tmp.path, 'proj-dry');
    const agentsDir = join(projectRoot, '.claude', 'agents');
    await mkdir(agentsDir, { recursive: true });
    await writeFile(join(agentsDir, 'flutter-architect.md'), '# Arch', 'utf-8');

    setupValidProjectMocks(projectRoot);

    const cmd = createUpgradeCommand();
    await cmd.parseAsync(['--dry-run'], { from: 'user' });

    // Step should mention the .md → .md.bak file
    const stepArgs = mockLogStep.mock.calls.flat() as string[];
    expect(stepArgs.some((arg) => arg.includes('flutter-architect.md'))).toBe(true);
  });

  it('shows "(no existing agent files found)" in dry-run when agents dir is missing', async () => {
    setupValidProjectMocks(tmp.path);

    const cmd = createUpgradeCommand();
    await cmd.parseAsync(['--dry-run'], { from: 'user' });

    const stepArgs = mockLogStep.mock.calls.flat() as string[];
    expect(stepArgs.some((arg) => arg.includes('no existing agent files found'))).toBe(true);
  });

  // ── Happy path (--yes) ────────────────────────────────────────────────────

  it('calls runClaudeSetup and p.outro("Upgrade complete") with --yes flag', async () => {
    setupValidProjectMocks(tmp.path);

    const cmd = createUpgradeCommand();
    await cmd.parseAsync(['--yes'], { from: 'user' });

    expect(mockRunClaudeSetup).toHaveBeenCalled();
    expect(mockOutro).toHaveBeenCalledWith('Upgrade complete!');
  });

  it('passes { skipPrd: true } to runClaudeSetup by default (without --regenerate-prd)', async () => {
    setupValidProjectMocks(tmp.path);

    const cmd = createUpgradeCommand();
    await cmd.parseAsync(['--yes'], { from: 'user' });

    expect(mockRunClaudeSetup).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      { skipPrd: true },
    );
  });

  it('passes { skipPrd: false } to runClaudeSetup when --regenerate-prd is passed', async () => {
    setupValidProjectMocks(tmp.path);

    const cmd = createUpgradeCommand();
    await cmd.parseAsync(['--yes', '--regenerate-prd'], { from: 'user' });

    expect(mockRunClaudeSetup).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      { skipPrd: false },
    );
  });

  it('logs backup count info when agent .md files exist before upgrade', async () => {
    const projectRoot = join(tmp.path, 'proj-bak');
    const agentsDir = join(projectRoot, '.claude', 'agents');
    await mkdir(agentsDir, { recursive: true });
    await writeFile(join(agentsDir, 'flutter-architect.md'), '# OLD', 'utf-8');

    setupValidProjectMocks(projectRoot);

    const cmd = createUpgradeCommand();
    await cmd.parseAsync(['--yes'], { from: 'user' });

    const infoArgs = mockLogInfo.mock.calls.flat() as string[];
    expect(infoArgs.some((arg) => arg.includes('Backed up'))).toBe(true);
  });

  // ── Confirmation prompt path (no --yes) ──────────────────────────────────

  it('cancels and calls process.exit(0) when user declines confirmation', async () => {
    setupValidProjectMocks(tmp.path);
    mockConfirm.mockResolvedValue(false);
    mockIsCancel.mockReturnValue(false);

    const cmd = createUpgradeCommand();
    await cmd.parseAsync([], { from: 'user' });

    expect(mockCancel).toHaveBeenCalledWith('Upgrade cancelled.');
    expect(mockProcessExit).toHaveBeenCalledWith(0);
  });

  it('cancels and calls process.exit(0) when user presses Ctrl+C (isCancel returns true)', async () => {
    setupValidProjectMocks(tmp.path);
    mockConfirm.mockResolvedValue(Symbol('cancel'));
    mockIsCancel.mockReturnValue(true);

    const cmd = createUpgradeCommand();
    await cmd.parseAsync([], { from: 'user' });

    expect(mockCancel).toHaveBeenCalledWith('Upgrade cancelled.');
    expect(mockProcessExit).toHaveBeenCalledWith(0);
  });

  it('proceeds with upgrade when user confirms interactively', async () => {
    setupValidProjectMocks(tmp.path);
    mockConfirm.mockResolvedValue(true);
    mockIsCancel.mockReturnValue(false);

    const cmd = createUpgradeCommand();
    await cmd.parseAsync([], { from: 'user' });

    expect(mockRunClaudeSetup).toHaveBeenCalled();
    expect(mockOutro).toHaveBeenCalledWith('Upgrade complete!');
  });
});
