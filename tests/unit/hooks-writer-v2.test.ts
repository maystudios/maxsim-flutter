import { writeHooks } from '../../src/claude-setup/hooks-writer.js';
import { makeTestContext } from '../helpers/context-factory.js';
import { useTempDir } from '../helpers/temp-dir.js';
import { readFile, readdir, stat } from 'node:fs/promises';
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
    // Check owner execute bit (0o100) and group execute bit (0o010)
    expect(blockStat.mode & 0o111).toBeTruthy();
    expect(formatStat.mode & 0o111).toBeTruthy();
  });

  it('settings.local.json registers PreToolUse hook for Bash', async () => {
    await writeHooks(makeContext(), tmp.path);
    const content = JSON.parse(
      await readFile(join(tmp.path, '.claude', 'settings.local.json'), 'utf-8'),
    );
    expect(content.hooks.PreToolUse).toBeDefined();
    const bashHook = content.hooks.PreToolUse.find((h: { matcher?: string }) => h.matcher === 'Bash');
    expect(bashHook).toBeDefined();
    expect(bashHook.hooks[0].type).toBe('command');
    expect(bashHook.hooks[0].command).toContain('block-dangerous.sh');
  });

  it('settings.local.json registers PostToolUse hook for Edit|Write', async () => {
    await writeHooks(makeContext(), tmp.path);
    const content = JSON.parse(
      await readFile(join(tmp.path, '.claude', 'settings.local.json'), 'utf-8'),
    );
    expect(content.hooks.PostToolUse).toBeDefined();
    const editWriteHook = content.hooks.PostToolUse.find(
      (h: { matcher?: string }) => h.matcher === 'Edit|Write',
    );
    expect(editWriteHook).toBeDefined();
    expect(editWriteHook.hooks[0].type).toBe('command');
    expect(editWriteHook.hooks[0].command).toContain('format-dart.sh');
  });

  it('settings.local.json registers TaskCompleted hook with flutter analyze', async () => {
    await writeHooks(makeContext(), tmp.path);
    const content = JSON.parse(
      await readFile(join(tmp.path, '.claude', 'settings.local.json'), 'utf-8'),
    );
    expect(content.hooks.TaskCompleted).toBeDefined();
    const taskHook = content.hooks.TaskCompleted[0];
    expect(taskHook.hooks[0].command).toBe('flutter analyze && flutter test');
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
    // Should NOT contain exit 2 (never blocks)
    expect(content).not.toContain('exit 2');
  });
});

describe('P11-002: hook registrations with timeout', () => {
  const tmp = useTempDir('hooks-registration-test-');

  it('registers protect-secrets as PreToolUse hook on Read|Edit|Write', async () => {
    await writeHooks(makeContext(), tmp.path);
    const content = JSON.parse(
      await readFile(join(tmp.path, '.claude', 'settings.local.json'), 'utf-8'),
    );
    const secretsHook = content.hooks.PreToolUse.find(
      (h: { matcher?: string }) => h.matcher === 'Read|Edit|Write',
    );
    expect(secretsHook).toBeDefined();
    expect(secretsHook.hooks[0].type).toBe('command');
    expect(secretsHook.hooks[0].command).toContain('protect-secrets.sh');
  });

  it('protect-secrets hook entry has timeout of 5', async () => {
    await writeHooks(makeContext(), tmp.path);
    const content = JSON.parse(
      await readFile(join(tmp.path, '.claude', 'settings.local.json'), 'utf-8'),
    );
    const secretsHook = content.hooks.PreToolUse.find(
      (h: { matcher?: string }) => h.matcher === 'Read|Edit|Write',
    );
    expect(secretsHook.hooks[0].timeout).toBe(5);
  });

  it('registers notify-waiting as Notification hook on idle_prompt', async () => {
    await writeHooks(makeContext(), tmp.path);
    const content = JSON.parse(
      await readFile(join(tmp.path, '.claude', 'settings.local.json'), 'utf-8'),
    );
    expect(content.hooks.Notification).toBeDefined();
    const notifyHook = content.hooks.Notification.find(
      (h: { matcher?: string }) => h.matcher === 'idle_prompt',
    );
    expect(notifyHook).toBeDefined();
    expect(notifyHook.hooks[0].type).toBe('command');
    expect(notifyHook.hooks[0].command).toContain('notify-waiting.sh');
  });

  it('notify-waiting hook entry has timeout of 10', async () => {
    await writeHooks(makeContext(), tmp.path);
    const content = JSON.parse(
      await readFile(join(tmp.path, '.claude', 'settings.local.json'), 'utf-8'),
    );
    const notifyHook = content.hooks.Notification.find(
      (h: { matcher?: string }) => h.matcher === 'idle_prompt',
    );
    expect(notifyHook.hooks[0].timeout).toBe(10);
  });

  it('PreToolUse has both block-dangerous (Bash) and protect-secrets (Read|Edit|Write) entries', async () => {
    await writeHooks(makeContext(), tmp.path);
    const content = JSON.parse(
      await readFile(join(tmp.path, '.claude', 'settings.local.json'), 'utf-8'),
    );
    const matchers = content.hooks.PreToolUse.map((h: { matcher?: string }) => h.matcher);
    expect(matchers).toContain('Bash');
    expect(matchers).toContain('Read|Edit|Write');
    expect(content.hooks.PreToolUse).toHaveLength(2);
  });

  it('hooks directory contains exactly 4 scripts after writeHooks', async () => {
    await writeHooks(makeContext(), tmp.path);
    const entries = await readdir(join(tmp.path, '.claude', 'hooks'));
    expect(entries).toHaveLength(4);
    expect(entries.sort()).toEqual([
      'block-dangerous.sh',
      'format-dart.sh',
      'notify-waiting.sh',
      'protect-secrets.sh',
    ]);
  });

  it('settings.local.json is valid JSON after adding new hooks', async () => {
    await writeHooks(makeContext(), tmp.path);
    const raw = await readFile(join(tmp.path, '.claude', 'settings.local.json'), 'utf-8');
    expect(() => JSON.parse(raw)).not.toThrow();
  });
});
