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
