import { writeHooks } from '../../src/claude-setup/hooks-writer.js';
import { makeTestContext } from '../helpers/context-factory.js';
import { useTempDir } from '../helpers/temp-dir.js';
import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';

// ─── TeammateIdle conditional branch ─────────────────────────────────────

describe('writeHooks: TeammateIdle only when agentTeams is enabled', () => {
  const tmp = useTempDir('hooks-team-idle-edge-');

  it('omits TeammateIdle hook when agentTeams is false', async () => {
    const ctx = makeTestContext({ claude: { enabled: true, agentTeams: false } });
    await writeHooks(ctx, tmp.path);
    const content = JSON.parse(
      await readFile(join(tmp.path, '.claude', 'settings.local.json'), 'utf-8'),
    );
    expect(content.hooks.TeammateIdle).toBeUndefined();
  });

  it('includes TeammateIdle hook when agentTeams is true', async () => {
    const ctx = makeTestContext({ claude: { enabled: true, agentTeams: true } });
    await writeHooks(ctx, tmp.path);
    const content = JSON.parse(
      await readFile(join(tmp.path, '.claude', 'settings.local.json'), 'utf-8'),
    );
    expect(content.hooks.TeammateIdle).toBeDefined();
    expect(content.hooks.TeammateIdle).toHaveLength(1);
  });

  it('TeammateIdle hook runs git diff and git status command', async () => {
    const ctx = makeTestContext({ claude: { enabled: true, agentTeams: true } });
    await writeHooks(ctx, tmp.path);
    const content = JSON.parse(
      await readFile(join(tmp.path, '.claude', 'settings.local.json'), 'utf-8'),
    );
    const teamHook = content.hooks.TeammateIdle[0];
    expect(teamHook.hooks[0].command).toContain('git');
    expect(teamHook.hooks[0].command).toContain('git status');
  });

  it('omits TeammateIdle when claude config is disabled', async () => {
    const ctx = makeTestContext({ claude: { enabled: false, agentTeams: false } });
    await writeHooks(ctx, tmp.path);
    const content = JSON.parse(
      await readFile(join(tmp.path, '.claude', 'settings.local.json'), 'utf-8'),
    );
    expect(content.hooks.TeammateIdle).toBeUndefined();
  });
});

// ─── protect-secrets.sh content edge cases ───────────────────────────────

describe('protect-secrets.sh: JSON output structure', () => {
  const tmp = useTempDir('hooks-protect-secrets-edge-');

  async function getScript(): Promise<string> {
    await writeHooks(makeTestContext({ claude: { enabled: true, agentTeams: false } }), tmp.path);
    return readFile(join(tmp.path, '.claude', 'hooks', 'protect-secrets.sh'), 'utf-8');
  }

  it('emits hookSpecificOutput wrapper in JSON output', async () => {
    const content = await getScript();
    expect(content).toContain('hookSpecificOutput');
  });

  it('emits hookEventName field in JSON output', async () => {
    const content = await getScript();
    expect(content).toContain('hookEventName');
  });

  it('emits permissionDecisionReason field explaining why access is blocked', async () => {
    const content = await getScript();
    expect(content).toContain('permissionDecisionReason');
  });

  it('does NOT use exit 2 for blocking (uses JSON deny instead)', async () => {
    const content = await getScript();
    // protect-secrets uses JSON output format, not exit code 2
    expect(content).not.toContain('exit 2');
  });

  it('handles .env.* wildcard patterns (e.g. .env.production)', async () => {
    const content = await getScript();
    // The pattern *.env.* should match .env.production, .env.staging, etc.
    expect(content).toContain('.env.*');
  });

  it('has early exit 0 guard when no file_path found', async () => {
    const content = await getScript();
    // Should exit cleanly when no file path is in the tool input
    expect(content).toContain('exit 0');
  });

  it('handles .tool_input.path as fallback for file path extraction', async () => {
    const content = await getScript();
    expect(content).toContain('.tool_input.path');
  });
});

// ─── notify-waiting.sh content edge cases ────────────────────────────────

describe('notify-waiting.sh: cross-platform and non-blocking behavior', () => {
  const tmp = useTempDir('hooks-notify-edge-');

  async function getScript(): Promise<string> {
    await writeHooks(makeTestContext({ claude: { enabled: true, agentTeams: false } }), tmp.path);
    return readFile(join(tmp.path, '.claude', 'hooks', 'notify-waiting.sh'), 'utf-8');
  }

  it('uses command -v to detect platform tools before using them', async () => {
    const content = await getScript();
    expect(content).toContain('command -v');
  });

  it('runs notification commands in background (non-blocking via &)', async () => {
    const content = await getScript();
    // Background execution ensures hook never blocks Claude
    expect(content).toContain('&');
  });

  it('includes "Claude Code" as notification title', async () => {
    const content = await getScript();
    expect(content).toContain('Claude Code');
  });

  it('reads stdin (INPUT=$(cat))', async () => {
    const content = await getScript();
    expect(content).toContain('INPUT=$(cat)');
  });

  it('suppresses errors from notification commands (2>/dev/null)', async () => {
    const content = await getScript();
    // Notification failures should not cause hook failure
    expect(content).toContain('2>/dev/null');
  });
});

// ─── Hook timeout field presence/absence ─────────────────────────────────

describe('writeHooks: timeout field only on relevant hooks', () => {
  const tmp = useTempDir('hooks-timeout-edge-');

  async function getSettings() {
    await writeHooks(makeTestContext({ claude: { enabled: true, agentTeams: true } }), tmp.path);
    return JSON.parse(
      await readFile(join(tmp.path, '.claude', 'settings.local.json'), 'utf-8'),
    );
  }

  it('block-dangerous.sh hook has no timeout field', async () => {
    const content = await getSettings();
    const bashHook = content.hooks.PreToolUse.find((h: { matcher?: string }) => h.matcher === 'Bash');
    expect(bashHook.hooks[0].timeout).toBeUndefined();
  });

  it('format-dart.sh PostToolUse hook has no timeout field', async () => {
    const content = await getSettings();
    const editWriteHook = content.hooks.PostToolUse.find(
      (h: { matcher?: string }) => h.matcher === 'Edit|Write',
    );
    expect(editWriteHook.hooks[0].timeout).toBeUndefined();
  });

  it('TaskCompleted hook has no timeout field', async () => {
    const content = await getSettings();
    const taskHook = content.hooks.TaskCompleted[0];
    expect(taskHook.hooks[0].timeout).toBeUndefined();
  });

  it('protect-secrets hook has timeout of 5', async () => {
    const content = await getSettings();
    const secretsHook = content.hooks.PreToolUse.find(
      (h: { matcher?: string }) => h.matcher === 'Read|Edit|Write',
    );
    expect(secretsHook.hooks[0].timeout).toBe(5);
  });

  it('notify-waiting Notification hook has timeout of 10', async () => {
    const content = await getSettings();
    const notifyHook = content.hooks.Notification.find(
      (h: { matcher?: string }) => h.matcher === 'idle_prompt',
    );
    expect(notifyHook.hooks[0].timeout).toBe(10);
  });
});

// ─── settings.local.json structure completeness ───────────────────────────

describe('writeHooks: settings.local.json structure', () => {
  const tmp = useTempDir('hooks-settings-structure-');

  async function getSettings(agentTeams = true) {
    await writeHooks(makeTestContext({ claude: { enabled: true, agentTeams } }), tmp.path);
    return JSON.parse(
      await readFile(join(tmp.path, '.claude', 'settings.local.json'), 'utf-8'),
    );
  }

  it('settings.local.json has top-level "hooks" key', async () => {
    const content = await getSettings();
    expect(content).toHaveProperty('hooks');
  });

  it('settings.local.json contains all 5 event types when agentTeams is true', async () => {
    const content = await getSettings(true);
    expect(content.hooks).toHaveProperty('PreToolUse');
    expect(content.hooks).toHaveProperty('PostToolUse');
    expect(content.hooks).toHaveProperty('TaskCompleted');
    expect(content.hooks).toHaveProperty('Notification');
    expect(content.hooks).toHaveProperty('TeammateIdle');
  });

  it('settings.local.json contains exactly 4 event types when agentTeams is false', async () => {
    const content = await getSettings(false);
    const keys = Object.keys(content.hooks);
    expect(keys).toContain('PreToolUse');
    expect(keys).toContain('PostToolUse');
    expect(keys).toContain('TaskCompleted');
    expect(keys).toContain('Notification');
    expect(keys).not.toContain('TeammateIdle');
    expect(keys).toHaveLength(4);
  });

  it('all hook entries have type: "command"', async () => {
    const content = await getSettings();
    const allHookEntries = [
      ...content.hooks.PreToolUse,
      ...content.hooks.PostToolUse,
      ...content.hooks.TaskCompleted,
      ...content.hooks.Notification,
      ...content.hooks.TeammateIdle,
    ];
    for (const entry of allHookEntries) {
      for (const hook of entry.hooks) {
        expect(hook.type).toBe('command');
      }
    }
  });

  it('settings.local.json ends with newline', async () => {
    await writeHooks(makeTestContext({ claude: { enabled: true, agentTeams: false } }), tmp.path);
    const raw = await readFile(join(tmp.path, '.claude', 'settings.local.json'), 'utf-8');
    expect(raw.endsWith('\n')).toBe(true);
  });
});

// ─── writeHooks idempotency ───────────────────────────────────────────────

describe('writeHooks: idempotency', () => {
  const tmp = useTempDir('hooks-idempotent-');

  it('can be called twice on the same directory without throwing', async () => {
    const ctx = makeTestContext({ claude: { enabled: true, agentTeams: true } });
    await writeHooks(ctx, tmp.path);
    await expect(writeHooks(ctx, tmp.path)).resolves.not.toThrow();
  });

  it('second call still produces 4 scripts in hooks directory', async () => {
    const ctx = makeTestContext({ claude: { enabled: true, agentTeams: true } });
    await writeHooks(ctx, tmp.path);
    await writeHooks(ctx, tmp.path);
    const entries = await readdir(join(tmp.path, '.claude', 'hooks'));
    expect(entries).toHaveLength(4);
  });

  it('second call overwrites settings.local.json with valid JSON', async () => {
    const ctx = makeTestContext({ claude: { enabled: true, agentTeams: true } });
    await writeHooks(ctx, tmp.path);
    await writeHooks(ctx, tmp.path);
    const raw = await readFile(join(tmp.path, '.claude', 'settings.local.json'), 'utf-8');
    expect(() => JSON.parse(raw)).not.toThrow();
  });
});
