import { writeHooks } from '../../src/claude-setup/hooks-writer.js';
import { makeTestContext } from '../helpers/context-factory.js';
import { useTempDir } from '../helpers/temp-dir.js';
import { readFile, readdir, stat, access } from 'node:fs/promises';
import { join } from 'node:path';

function makeContext(overrides: Partial<Parameters<typeof makeTestContext>[0]> = {}) {
  return makeTestContext({
    claude: { enabled: true, agentTeams: true },
    ...overrides,
  });
}

describe('writeHooks v2 — shell script generation', () => {
  const tmp = useTempDir('hooks-writer-v2-test-');

  it('creates .claude/hooks/ directory', async () => {
    await writeHooks(makeContext(), tmp.path);
    const hooksDir = join(tmp.path, '.claude', 'hooks');
    const dirStat = await stat(hooksDir);
    expect(dirStat.isDirectory()).toBe(true);
  });

  it('block-dangerous.sh exists in .claude/hooks/', async () => {
    await writeHooks(makeContext(), tmp.path);
    const hooksDir = join(tmp.path, '.claude', 'hooks');
    const entries = await readdir(hooksDir);
    expect(entries).toContain('block-dangerous.sh');
  });

  it('format-dart.sh exists in .claude/hooks/', async () => {
    await writeHooks(makeContext(), tmp.path);
    const hooksDir = join(tmp.path, '.claude', 'hooks');
    const entries = await readdir(hooksDir);
    expect(entries).toContain('format-dart.sh');
  });

  it('block-dangerous.sh starts with a bash shebang', async () => {
    await writeHooks(makeContext(), tmp.path);
    const content = await readFile(join(tmp.path, '.claude', 'hooks', 'block-dangerous.sh'), 'utf-8');
    expect(content.startsWith('#!/bin/bash') || content.startsWith('#!/usr/bin/env bash')).toBe(true);
  });

  it('format-dart.sh starts with a bash shebang', async () => {
    await writeHooks(makeContext(), tmp.path);
    const content = await readFile(join(tmp.path, '.claude', 'hooks', 'format-dart.sh'), 'utf-8');
    expect(content.startsWith('#!/bin/bash') || content.startsWith('#!/usr/bin/env bash')).toBe(true);
  });

  it('block-dangerous.sh contains rm -rf pattern check', async () => {
    await writeHooks(makeContext(), tmp.path);
    const content = await readFile(join(tmp.path, '.claude', 'hooks', 'block-dangerous.sh'), 'utf-8');
    expect(content).toContain('rm -rf');
  });

  it('block-dangerous.sh checks for --no-verify pattern', async () => {
    await writeHooks(makeContext(), tmp.path);
    const content = await readFile(join(tmp.path, '.claude', 'hooks', 'block-dangerous.sh'), 'utf-8');
    expect(content).toContain('--no-verify');
  });

  it('block-dangerous.sh checks for --force pattern', async () => {
    await writeHooks(makeContext(), tmp.path);
    const content = await readFile(join(tmp.path, '.claude', 'hooks', 'block-dangerous.sh'), 'utf-8');
    expect(content).toContain('--force');
  });

  it('block-dangerous.sh checks for git reset --hard', async () => {
    await writeHooks(makeContext(), tmp.path);
    const content = await readFile(join(tmp.path, '.claude', 'hooks', 'block-dangerous.sh'), 'utf-8');
    expect(content).toContain('reset --hard');
  });

  it('block-dangerous.sh checks for git clean -f', async () => {
    await writeHooks(makeContext(), tmp.path);
    const content = await readFile(join(tmp.path, '.claude', 'hooks', 'block-dangerous.sh'), 'utf-8');
    expect(content).toContain('clean -f');
  });

  it('block-dangerous.sh exits with code 2 when blocking', async () => {
    await writeHooks(makeContext(), tmp.path);
    const content = await readFile(join(tmp.path, '.claude', 'hooks', 'block-dangerous.sh'), 'utf-8');
    expect(content).toContain('exit 2');
  });

  it('format-dart.sh contains dart format invocation', async () => {
    await writeHooks(makeContext(), tmp.path);
    const content = await readFile(join(tmp.path, '.claude', 'hooks', 'format-dart.sh'), 'utf-8');
    expect(content).toContain('dart format');
  });

  it('format-dart.sh checks for .dart file extension', async () => {
    await writeHooks(makeContext(), tmp.path);
    const content = await readFile(join(tmp.path, '.claude', 'hooks', 'format-dart.sh'), 'utf-8');
    expect(content).toContain('.dart');
  });

  it('shell scripts have executable permissions (mode 0o755)', async () => {
    await writeHooks(makeContext(), tmp.path);
    const blockStat = await stat(join(tmp.path, '.claude', 'hooks', 'block-dangerous.sh'));
    const formatStat = await stat(join(tmp.path, '.claude', 'hooks', 'format-dart.sh'));
    expect(blockStat.mode & 0o111).toBeTruthy();
    expect(formatStat.mode & 0o111).toBeTruthy();
  });
});

describe('writeHooks v2 — returns HooksResult', () => {
  const tmp = useTempDir('hooks-result-test-');

  it('returns HooksResult with scripts array', async () => {
    const result = await writeHooks(makeContext(), tmp.path);
    expect(result.scripts).toBeInstanceOf(Array);
    expect(result.scripts.length).toBeGreaterThan(0);
  });

  it('returns HooksResult with config object containing hooks', async () => {
    const result = await writeHooks(makeContext(), tmp.path);
    expect(result.config).toBeDefined();
    expect(result.config.hooks).toBeDefined();
  });

  it('no longer creates settings.local.json', async () => {
    await writeHooks(makeContext(), tmp.path);
    const settingsPath = join(tmp.path, '.claude', 'settings.local.json');
    await expect(access(settingsPath)).rejects.toThrow();
  });

  it('returned config registers PreToolUse hook for Bash', async () => {
    const result = await writeHooks(makeContext(), tmp.path);
    expect(result.config.hooks.PreToolUse).toBeDefined();
    const bashHook = result.config.hooks.PreToolUse!.find(
      (h: { matcher?: string }) => h.matcher === 'Bash',
    );
    expect(bashHook).toBeDefined();
    expect(bashHook!.hooks[0].type).toBe('command');
    expect(bashHook!.hooks[0].command).toContain('block-dangerous.sh');
  });

  it('returned config registers PostToolUse hook for Edit|Write', async () => {
    const result = await writeHooks(makeContext(), tmp.path);
    expect(result.config.hooks.PostToolUse).toBeDefined();
    const editWriteHook = result.config.hooks.PostToolUse!.find(
      (h: { matcher?: string }) => h.matcher === 'Edit|Write',
    );
    expect(editWriteHook).toBeDefined();
    expect(editWriteHook!.hooks[0].command).toContain('format-dart.sh');
  });

  it('returned config registers TaskCompleted hook with quality-gate-task.sh', async () => {
    const result = await writeHooks(makeContext(), tmp.path);
    expect(result.config.hooks.TaskCompleted).toBeDefined();
    const taskHook = result.config.hooks.TaskCompleted![0];
    expect(taskHook.hooks[0].command).toContain('quality-gate-task.sh');
  });

  it('returned config includes TeammateIdle when agentTeams is true', async () => {
    const result = await writeHooks(
      makeContext({ claude: { enabled: true, agentTeams: true } }),
      tmp.path,
    );
    expect(result.config.hooks.TeammateIdle).toBeDefined();
    expect(result.config.hooks.TeammateIdle!).toHaveLength(1);
  });

  it('returned config excludes TeammateIdle when agentTeams is false', async () => {
    const result = await writeHooks(
      makeContext({ claude: { enabled: true, agentTeams: false } }),
      tmp.path,
    );
    expect(result.config.hooks.TeammateIdle).toBeUndefined();
  });
});

describe('P11-002: protect-secrets.sh script', () => {
  const tmp = useTempDir('hooks-protect-secrets-test-');

  it('protect-secrets.sh exists in .claude/hooks/', async () => {
    await writeHooks(makeContext(), tmp.path);
    const entries = await readdir(join(tmp.path, '.claude', 'hooks'));
    expect(entries).toContain('protect-secrets.sh');
  });

  it('protect-secrets.sh starts with a bash shebang', async () => {
    await writeHooks(makeContext(), tmp.path);
    const content = await readFile(join(tmp.path, '.claude', 'hooks', 'protect-secrets.sh'), 'utf-8');
    expect(content.startsWith('#!/bin/bash') || content.startsWith('#!/usr/bin/env bash')).toBe(true);
  });

  it('protect-secrets.sh has executable permissions (mode 0o755)', async () => {
    await writeHooks(makeContext(), tmp.path);
    const fileStat = await stat(join(tmp.path, '.claude', 'hooks', 'protect-secrets.sh'));
    expect(fileStat.mode & 0o111).toBeTruthy();
  });

  it('protect-secrets.sh contains .env pattern check', async () => {
    await writeHooks(makeContext(), tmp.path);
    const content = await readFile(join(tmp.path, '.claude', 'hooks', 'protect-secrets.sh'), 'utf-8');
    expect(content).toContain('.env');
  });

  it('protect-secrets.sh contains .pem pattern check', async () => {
    await writeHooks(makeContext(), tmp.path);
    const content = await readFile(join(tmp.path, '.claude', 'hooks', 'protect-secrets.sh'), 'utf-8');
    expect(content).toContain('.pem');
  });

  it('protect-secrets.sh contains .key pattern check', async () => {
    await writeHooks(makeContext(), tmp.path);
    const content = await readFile(join(tmp.path, '.claude', 'hooks', 'protect-secrets.sh'), 'utf-8');
    expect(content).toContain('.key');
  });

  it('protect-secrets.sh contains credentials pattern check', async () => {
    await writeHooks(makeContext(), tmp.path);
    const content = await readFile(join(tmp.path, '.claude', 'hooks', 'protect-secrets.sh'), 'utf-8');
    expect(content).toContain('credentials');
  });

  it('protect-secrets.sh contains secrets pattern check', async () => {
    await writeHooks(makeContext(), tmp.path);
    const content = await readFile(join(tmp.path, '.claude', 'hooks', 'protect-secrets.sh'), 'utf-8');
    expect(content).toContain('secrets');
  });

  it('protect-secrets.sh uses JSON decision output format with permissionDecision', async () => {
    await writeHooks(makeContext(), tmp.path);
    const content = await readFile(join(tmp.path, '.claude', 'hooks', 'protect-secrets.sh'), 'utf-8');
    expect(content).toContain('permissionDecision');
    expect(content).toContain('deny');
  });

  it('protect-secrets.sh uses jq to extract file_path from stdin', async () => {
    await writeHooks(makeContext(), tmp.path);
    const content = await readFile(join(tmp.path, '.claude', 'hooks', 'protect-secrets.sh'), 'utf-8');
    expect(content).toContain('jq');
    expect(content).toContain('file_path');
  });
});

describe('P11-002: notify-waiting.sh script', () => {
  const tmp = useTempDir('hooks-notify-waiting-test-');

  it('notify-waiting.sh exists in .claude/hooks/', async () => {
    await writeHooks(makeContext(), tmp.path);
    const entries = await readdir(join(tmp.path, '.claude', 'hooks'));
    expect(entries).toContain('notify-waiting.sh');
  });

  it('notify-waiting.sh starts with a bash shebang', async () => {
    await writeHooks(makeContext(), tmp.path);
    const content = await readFile(join(tmp.path, '.claude', 'hooks', 'notify-waiting.sh'), 'utf-8');
    expect(content.startsWith('#!/bin/bash') || content.startsWith('#!/usr/bin/env bash')).toBe(true);
  });

  it('notify-waiting.sh has executable permissions (mode 0o755)', async () => {
    await writeHooks(makeContext(), tmp.path);
    const fileStat = await stat(join(tmp.path, '.claude', 'hooks', 'notify-waiting.sh'));
    expect(fileStat.mode & 0o111).toBeTruthy();
  });

  it('notify-waiting.sh contains osascript for macOS notifications', async () => {
    await writeHooks(makeContext(), tmp.path);
    const content = await readFile(join(tmp.path, '.claude', 'hooks', 'notify-waiting.sh'), 'utf-8');
    expect(content).toContain('osascript');
  });

  it('notify-waiting.sh contains notify-send for Linux notifications', async () => {
    await writeHooks(makeContext(), tmp.path);
    const content = await readFile(join(tmp.path, '.claude', 'hooks', 'notify-waiting.sh'), 'utf-8');
    expect(content).toContain('notify-send');
  });

  it('notify-waiting.sh contains powershell for Windows/WSL notifications', async () => {
    await writeHooks(makeContext(), tmp.path);
    const content = await readFile(join(tmp.path, '.claude', 'hooks', 'notify-waiting.sh'), 'utf-8');
    expect(content).toContain('powershell');
  });

  it('notify-waiting.sh always exits 0', async () => {
    await writeHooks(makeContext(), tmp.path);
    const content = await readFile(join(tmp.path, '.claude', 'hooks', 'notify-waiting.sh'), 'utf-8');
    expect(content).toContain('exit 0');
    expect(content).not.toContain('exit 2');
  });
});

describe('P11-002: hook config with timeout (via returned config)', () => {
  const tmp = useTempDir('hooks-config-test-');

  it('returned config registers protect-secrets as PreToolUse hook on Read|Edit|Write', async () => {
    const result = await writeHooks(makeContext(), tmp.path);
    const secretsHook = result.config.hooks.PreToolUse!.find(
      (h: { matcher?: string }) => h.matcher === 'Read|Edit|Write',
    );
    expect(secretsHook).toBeDefined();
    expect(secretsHook!.hooks[0].type).toBe('command');
    expect(secretsHook!.hooks[0].command).toContain('protect-secrets.sh');
  });

  it('protect-secrets hook entry has timeout of 5', async () => {
    const result = await writeHooks(makeContext(), tmp.path);
    const secretsHook = result.config.hooks.PreToolUse!.find(
      (h: { matcher?: string }) => h.matcher === 'Read|Edit|Write',
    );
    expect(secretsHook!.hooks[0].timeout).toBe(5);
  });

  it('returned config registers notify-waiting as Notification hook on idle_prompt', async () => {
    const result = await writeHooks(makeContext(), tmp.path);
    expect(result.config.hooks.Notification).toBeDefined();
    const notifyHook = result.config.hooks.Notification!.find(
      (h: { matcher?: string }) => h.matcher === 'idle_prompt',
    );
    expect(notifyHook).toBeDefined();
    expect(notifyHook!.hooks[0].command).toContain('notify-waiting.sh');
  });

  it('notify-waiting hook entry has timeout of 10', async () => {
    const result = await writeHooks(makeContext(), tmp.path);
    const notifyHook = result.config.hooks.Notification!.find(
      (h: { matcher?: string }) => h.matcher === 'idle_prompt',
    );
    expect(notifyHook!.hooks[0].timeout).toBe(10);
  });

  it('PreToolUse has both block-dangerous (Bash) and protect-secrets (Read|Edit|Write) entries', async () => {
    const result = await writeHooks(makeContext(), tmp.path);
    const matchers = result.config.hooks.PreToolUse!.map(
      (h: { matcher?: string }) => h.matcher,
    );
    expect(matchers).toContain('Bash');
    expect(matchers).toContain('Read|Edit|Write');
    expect(result.config.hooks.PreToolUse!).toHaveLength(2);
  });

  it('hooks directory contains exactly 7 scripts after writeHooks', async () => {
    await writeHooks(makeContext(), tmp.path);
    const entries = await readdir(join(tmp.path, '.claude', 'hooks'));
    expect(entries).toHaveLength(7);
    expect(entries.sort()).toEqual([
      'block-dangerous.sh',
      'context-monitor.sh',
      'format-dart.sh',
      'notify-waiting.sh',
      'precompact-preserve.sh',
      'protect-secrets.sh',
      'quality-gate-task.sh',
    ]);
  });
});

// ─── P12-007: precompact-preserve.sh script ─────────────────────────────

describe('P12-007: precompact-preserve.sh script', () => {
  const tmp = useTempDir('hooks-precompact-test-');

  it('precompact-preserve.sh exists in .claude/hooks/', async () => {
    await writeHooks(makeContext(), tmp.path);
    const entries = await readdir(join(tmp.path, '.claude', 'hooks'));
    expect(entries).toContain('precompact-preserve.sh');
  });

  it('precompact-preserve.sh starts with a bash shebang', async () => {
    await writeHooks(makeContext(), tmp.path);
    const content = await readFile(join(tmp.path, '.claude', 'hooks', 'precompact-preserve.sh'), 'utf-8');
    expect(content.startsWith('#!/bin/bash') || content.startsWith('#!/usr/bin/env bash')).toBe(true);
  });

  it('precompact-preserve.sh contains git diff --name-only', async () => {
    await writeHooks(makeContext(), tmp.path);
    const content = await readFile(join(tmp.path, '.claude', 'hooks', 'precompact-preserve.sh'), 'utf-8');
    expect(content).toContain('git diff --name-only');
  });

  it('precompact-preserve.sh contains git branch --show-current', async () => {
    await writeHooks(makeContext(), tmp.path);
    const content = await readFile(join(tmp.path, '.claude', 'hooks', 'precompact-preserve.sh'), 'utf-8');
    expect(content).toContain('git branch --show-current');
  });

  it('precompact-preserve.sh contains git log for recent commits', async () => {
    await writeHooks(makeContext(), tmp.path);
    const content = await readFile(join(tmp.path, '.claude', 'hooks', 'precompact-preserve.sh'), 'utf-8');
    expect(content).toContain('git log');
  });

  it('precompact-preserve.sh has executable permissions', async () => {
    await writeHooks(makeContext(), tmp.path);
    const fileStat = await stat(join(tmp.path, '.claude', 'hooks', 'precompact-preserve.sh'));
    expect(fileStat.mode & 0o111).toBeTruthy();
  });

  it('returned config includes PreCompact hook entry', async () => {
    const result = await writeHooks(makeContext(), tmp.path);
    expect(result.config.hooks.PreCompact).toBeDefined();
    expect(result.config.hooks.PreCompact).toHaveLength(1);
    expect(result.config.hooks.PreCompact![0].hooks[0].command).toContain('precompact-preserve.sh');
  });

  it('precompact-preserve.sh always exits 0', async () => {
    await writeHooks(makeContext(), tmp.path);
    const content = await readFile(join(tmp.path, '.claude', 'hooks', 'precompact-preserve.sh'), 'utf-8');
    expect(content).toContain('exit 0');
    expect(content).not.toContain('exit 2');
  });
});

// ─── P12-008: quality-gate-task.sh blocking behavior ────────────────────

describe('P12-008: quality-gate-task.sh blocks task completion', () => {
  const tmp = useTempDir('hooks-quality-gate-blocking-');

  it('quality-gate-task.sh contains exit 2 for blocking', async () => {
    await writeHooks(makeContext(), tmp.path);
    const content = await readFile(join(tmp.path, '.claude', 'hooks', 'quality-gate-task.sh'), 'utf-8');
    expect(content).toContain('exit 2');
  });

  it('quality-gate-task.sh runs flutter analyze', async () => {
    await writeHooks(makeContext(), tmp.path);
    const content = await readFile(join(tmp.path, '.claude', 'hooks', 'quality-gate-task.sh'), 'utf-8');
    expect(content).toContain('flutter analyze');
  });

  it('quality-gate-task.sh runs flutter test', async () => {
    await writeHooks(makeContext(), tmp.path);
    const content = await readFile(join(tmp.path, '.claude', 'hooks', 'quality-gate-task.sh'), 'utf-8');
    expect(content).toContain('flutter test');
  });

  it('quality-gate-task.sh only triggers for implementation tasks', async () => {
    await writeHooks(makeContext(), tmp.path);
    const content = await readFile(join(tmp.path, '.claude', 'hooks', 'quality-gate-task.sh'), 'utf-8');
    expect(content).toContain('P[0-9]+-');
  });

  it('TaskCompleted hook timeout is 120', async () => {
    const result = await writeHooks(makeContext(), tmp.path);
    const taskHook = result.config.hooks.TaskCompleted![0];
    expect(taskHook.hooks[0].timeout).toBe(120);
  });
});

// ─── P12-009: context-monitor.sh script ─────────────────────────────────

describe('P12-009: context-monitor.sh script', () => {
  const tmp = useTempDir('hooks-context-monitor-test-');

  it('context-monitor.sh exists in .claude/hooks/', async () => {
    await writeHooks(makeContext(), tmp.path);
    const entries = await readdir(join(tmp.path, '.claude', 'hooks'));
    expect(entries).toContain('context-monitor.sh');
  });

  it('context-monitor.sh starts with a bash shebang', async () => {
    await writeHooks(makeContext(), tmp.path);
    const content = await readFile(join(tmp.path, '.claude', 'hooks', 'context-monitor.sh'), 'utf-8');
    expect(content.startsWith('#!/bin/bash') || content.startsWith('#!/usr/bin/env bash')).toBe(true);
  });

  it('context-monitor.sh is advisory only (exit 0, no exit 2)', async () => {
    await writeHooks(makeContext(), tmp.path);
    const content = await readFile(join(tmp.path, '.claude', 'hooks', 'context-monitor.sh'), 'utf-8');
    expect(content).toContain('exit 0');
    expect(content).not.toContain('exit 2');
  });

  it('context-monitor.sh recommends /clear or subagent delegation', async () => {
    await writeHooks(makeContext(), tmp.path);
    const content = await readFile(join(tmp.path, '.claude', 'hooks', 'context-monitor.sh'), 'utf-8');
    expect(content).toContain('/clear');
  });

  it('context-monitor.sh has executable permissions', async () => {
    await writeHooks(makeContext(), tmp.path);
    const fileStat = await stat(join(tmp.path, '.claude', 'hooks', 'context-monitor.sh'));
    expect(fileStat.mode & 0o111).toBeTruthy();
  });

  it('returned config includes Stop hook entry for context-monitor', async () => {
    const result = await writeHooks(makeContext(), tmp.path);
    expect(result.config.hooks.Stop).toBeDefined();
    expect(result.config.hooks.Stop).toHaveLength(1);
    expect(result.config.hooks.Stop![0].hooks[0].command).toContain('context-monitor.sh');
  });
});
