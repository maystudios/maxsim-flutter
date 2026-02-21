import { writeHooks } from '../../src/claude-setup/hooks-writer.js';
import { makeTestContext } from '../helpers/context-factory.js';
import { useTempDir } from '../helpers/temp-dir.js';
import { readFile, readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';

function makeContext(overrides: Partial<Parameters<typeof makeTestContext>[0]> = {}) {
  return makeTestContext({
    claude: { enabled: true, agentTeams: false },
    ...overrides,
  });
}

// ─── P11-008: quality-gate-task.sh script ───────────────────────────────────

describe('P11-008: quality-gate-task.sh script', () => {
  const tmp = useTempDir('hooks-quality-gate-task-');

  it('quality-gate-task.sh exists in .claude/hooks/', async () => {
    await writeHooks(makeContext(), tmp.path);
    const entries = await readdir(join(tmp.path, '.claude', 'hooks'));
    expect(entries).toContain('quality-gate-task.sh');
  });

  it('quality-gate-task.sh starts with a bash shebang', async () => {
    await writeHooks(makeContext(), tmp.path);
    const content = await readFile(join(tmp.path, '.claude', 'hooks', 'quality-gate-task.sh'), 'utf-8');
    expect(content.startsWith('#!/bin/bash') || content.startsWith('#!/usr/bin/env bash')).toBe(true);
  });

  it('quality-gate-task.sh has executable permissions (mode 0o755)', async () => {
    await writeHooks(makeContext(), tmp.path);
    const fileStat = await stat(join(tmp.path, '.claude', 'hooks', 'quality-gate-task.sh'));
    expect(fileStat.mode & 0o111).toBeTruthy();
  });

  it('quality-gate-task.sh reads JSON stdin', async () => {
    await writeHooks(makeContext(), tmp.path);
    const content = await readFile(join(tmp.path, '.claude', 'hooks', 'quality-gate-task.sh'), 'utf-8');
    expect(content).toContain('TASK_JSON=$(cat)');
  });

  it('quality-gate-task.sh checks for implementation task pattern', async () => {
    await writeHooks(makeContext(), tmp.path);
    const content = await readFile(join(tmp.path, '.claude', 'hooks', 'quality-gate-task.sh'), 'utf-8');
    // Should check for story ID pattern like P\d+- or S-\d+
    expect(content).toMatch(/P\\d|S-\\d|implementation/i);
  });

  it('quality-gate-task.sh outputs quality reminder checks', async () => {
    await writeHooks(makeContext(), tmp.path);
    const content = await readFile(join(tmp.path, '.claude', 'hooks', 'quality-gate-task.sh'), 'utf-8');
    expect(content).toContain('flutter analyze');
    expect(content).toContain('flutter test');
  });

  it('quality-gate-task.sh exits 2 on quality failure (blocking hook)', async () => {
    await writeHooks(makeContext(), tmp.path);
    const content = await readFile(join(tmp.path, '.claude', 'hooks', 'quality-gate-task.sh'), 'utf-8');
    expect(content).toContain('exit 2');
    expect(content).toContain('exit 0');
  });
});

// ─── P11-008: TaskCompleted hook uses script reference ──────────────────────

describe('P11-008: TaskCompleted hook config', () => {
  const tmp = useTempDir('hooks-task-completed-config-');

  it('TaskCompleted hook command references quality-gate-task.sh', async () => {
    const result = await writeHooks(makeContext(), tmp.path);
    const taskHook = result.config.hooks.TaskCompleted![0];
    expect(taskHook.hooks[0].command).toContain('quality-gate-task.sh');
  });

  it('TaskCompleted hook has timeout of 120', async () => {
    const result = await writeHooks(makeContext(), tmp.path);
    const taskHook = result.config.hooks.TaskCompleted![0];
    expect(taskHook.hooks[0].timeout).toBe(120);
  });

  it('TaskCompleted hook no longer uses inline flutter analyze command', async () => {
    const result = await writeHooks(makeContext(), tmp.path);
    const taskHook = result.config.hooks.TaskCompleted![0];
    expect(taskHook.hooks[0].command).not.toBe('flutter analyze && flutter test');
  });
});

// ─── P11-008: hooks directory updated count ─────────────────────────────────

describe('P11-008: hooks directory has 7 scripts', () => {
  const tmp = useTempDir('hooks-count-7-');

  it('hooks directory contains exactly 7 scripts', async () => {
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
