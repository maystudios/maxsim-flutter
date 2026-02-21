import { writeSettings } from '../../src/claude-setup/settings-writer.js';
import { makeTestContext } from '../helpers/context-factory.js';
import { useTempDir } from '../helpers/temp-dir.js';
import { readFile, mkdir, stat } from 'node:fs/promises';
import { join } from 'node:path';

const sampleHooksConfig = {
  hooks: {
    PreToolUse: [
      {
        matcher: 'Bash',
        hooks: [{ type: 'command' as const, command: '.claude/hooks/block-dangerous.sh' }],
      },
      {
        matcher: 'Read|Edit|Write',
        hooks: [{ type: 'command' as const, command: '.claude/hooks/protect-secrets.sh', timeout: 5 }],
      },
    ],
    PostToolUse: [
      {
        matcher: 'Edit|Write',
        hooks: [{ type: 'command' as const, command: '.claude/hooks/format-dart.sh' }],
      },
    ],
    Notification: [
      {
        matcher: 'idle_prompt',
        hooks: [{ type: 'command' as const, command: '.claude/hooks/notify-waiting.sh', timeout: 10 }],
      },
    ],
    TaskCompleted: [
      {
        hooks: [{ type: 'command' as const, command: '.claude/hooks/quality-gate-task.sh', timeout: 60 }],
      },
    ],
  },
};

// ─── settings.json strict deny-only ──────────────────────────────────────

describe('settings.json: deny-only, no allow rules', () => {
  const tmp = useTempDir('settings-deny-only-edge-');

  async function getSettings() {
    await writeSettings(makeTestContext({ claude: { enabled: true, agentTeams: true } }), tmp.path, sampleHooksConfig);
    return JSON.parse(await readFile(join(tmp.path, '.claude', 'settings.json'), 'utf-8'));
  }

  it('settings.json does NOT have permissions.allow', async () => {
    const content = await getSettings();
    expect(content.permissions.allow).toBeUndefined();
  });

  it('settings.json deny list has exactly 13 rules', async () => {
    const content = await getSettings();
    expect(content.permissions.deny).toHaveLength(13);
  });

  it('settings.json deny rules cover all .env variants', async () => {
    const content = await getSettings();
    const deny = content.permissions.deny as string[];
    expect(deny).toContain('Read(./.env)');
    expect(deny).toContain('Read(./.env.*)');
    expect(deny).toContain('Edit(./.env)');
    expect(deny).toContain('Edit(./.env.*)');
  });

  it('settings.json deny rules cover credential and secret files', async () => {
    const content = await getSettings();
    const deny = content.permissions.deny as string[];
    expect(deny).toContain('Read(./credentials*)');
    expect(deny).toContain('Read(./secrets*)');
  });

  it('settings.json deny rules cover certificate and key files', async () => {
    const content = await getSettings();
    const deny = content.permissions.deny as string[];
    expect(deny).toContain('Read(./**/*.pem)');
    expect(deny).toContain('Read(./**/*.key)');
  });

  it('settings.json deny rules cover dangerous bash commands', async () => {
    const content = await getSettings();
    const deny = content.permissions.deny as string[];
    expect(deny).toContain('Bash(rm -rf *)');
    expect(deny).toContain('Bash(sudo *)');
  });
});

// ─── settings.local.json strict allow-only ────────────────────────────────

describe('settings.local.json: allow-only, no shared config', () => {
  const tmp = useTempDir('settings-allow-only-edge-');

  async function getLocal(agentTeams = true) {
    await writeSettings(
      makeTestContext({ claude: { enabled: true, agentTeams } }),
      tmp.path,
      sampleHooksConfig,
    );
    return JSON.parse(await readFile(join(tmp.path, '.claude', 'settings.local.json'), 'utf-8'));
  }

  it('settings.local.json does NOT have $schema field', async () => {
    const content = await getLocal();
    expect(content.$schema).toBeUndefined();
  });

  it('settings.local.json does NOT have env field even when agentTeams is true', async () => {
    const content = await getLocal(true);
    expect(content.env).toBeUndefined();
  });

  it('settings.local.json does NOT have env field when agentTeams is false', async () => {
    const content = await getLocal(false);
    expect(content.env).toBeUndefined();
  });

  it('settings.local.json allow list has exactly 11 rules', async () => {
    const content = await getLocal();
    expect(content.permissions.allow).toHaveLength(11);
  });

  it('settings.local.json does NOT have hooks field', async () => {
    const content = await getLocal();
    expect(content.hooks).toBeUndefined();
  });

  it('settings.local.json does NOT have permissions.deny', async () => {
    const content = await getLocal();
    expect(content.permissions.deny).toBeUndefined();
  });
});

// ─── Hooks config preservation ────────────────────────────────────────────

describe('settings.json: full hooks config preserved', () => {
  const tmp = useTempDir('settings-hooks-preserved-edge-');

  async function getSettings() {
    await writeSettings(
      makeTestContext({ claude: { enabled: true, agentTeams: true } }),
      tmp.path,
      sampleHooksConfig,
    );
    return JSON.parse(await readFile(join(tmp.path, '.claude', 'settings.json'), 'utf-8'));
  }

  it('settings.json hooks includes PostToolUse from hooksConfig', async () => {
    const content = await getSettings();
    expect(content.hooks.PostToolUse).toBeDefined();
    expect(content.hooks.PostToolUse[0].matcher).toBe('Edit|Write');
  });

  it('settings.json hooks includes Notification from hooksConfig', async () => {
    const content = await getSettings();
    expect(content.hooks.Notification).toBeDefined();
    expect(content.hooks.Notification[0].matcher).toBe('idle_prompt');
  });

  it('settings.json hooks includes TaskCompleted from hooksConfig', async () => {
    const content = await getSettings();
    expect(content.hooks.TaskCompleted).toBeDefined();
    expect(content.hooks.TaskCompleted[0].hooks[0].command).toContain('quality-gate-task.sh');
  });

  it('settings.json hooks preserves timeout values from hooksConfig', async () => {
    const content = await getSettings();
    const secretsHook = content.hooks.PreToolUse.find(
      (h: { matcher?: string }) => h.matcher === 'Read|Edit|Write',
    );
    expect(secretsHook.hooks[0].timeout).toBe(5);
  });

  it('settings.json without hooksConfig has no hooks key', async () => {
    await writeSettings(
      makeTestContext({ claude: { enabled: true, agentTeams: false } }),
      tmp.path,
      undefined,
    );
    const content = JSON.parse(await readFile(join(tmp.path, '.claude', 'settings.json'), 'utf-8'));
    expect(content.hooks).toBeUndefined();
  });
});

// ─── File format ──────────────────────────────────────────────────────────

describe('writeSettings: file format', () => {
  const tmp = useTempDir('settings-format-edge-');

  it('settings.json ends with newline', async () => {
    await writeSettings(makeTestContext({ claude: { enabled: true, agentTeams: false } }), tmp.path, sampleHooksConfig);
    const raw = await readFile(join(tmp.path, '.claude', 'settings.json'), 'utf-8');
    expect(raw.endsWith('\n')).toBe(true);
  });

  it('settings.local.json ends with newline', async () => {
    await writeSettings(makeTestContext({ claude: { enabled: true, agentTeams: false } }), tmp.path, sampleHooksConfig);
    const raw = await readFile(join(tmp.path, '.claude', 'settings.local.json'), 'utf-8');
    expect(raw.endsWith('\n')).toBe(true);
  });

  it('settings.json is pretty-printed (contains indentation)', async () => {
    await writeSettings(makeTestContext({ claude: { enabled: true, agentTeams: false } }), tmp.path, sampleHooksConfig);
    const raw = await readFile(join(tmp.path, '.claude', 'settings.json'), 'utf-8');
    // Pretty-printed JSON contains newlines and spaces
    expect(raw).toContain('\n');
    expect(raw).toContain('  ');
  });

  it('settings.local.json is pretty-printed (contains indentation)', async () => {
    await writeSettings(makeTestContext({ claude: { enabled: true, agentTeams: false } }), tmp.path, sampleHooksConfig);
    const raw = await readFile(join(tmp.path, '.claude', 'settings.local.json'), 'utf-8');
    expect(raw).toContain('\n');
    expect(raw).toContain('  ');
  });
});

// ─── env conditional ─────────────────────────────────────────────────────

describe('settings.json: env field always includes AUTOCOMPACT', () => {
  const tmp = useTempDir('settings-env-edge-');

  it('env includes AUTOCOMPACT when agentTeams is false', async () => {
    await writeSettings(
      makeTestContext({ claude: { enabled: false, agentTeams: false } }),
      tmp.path,
      sampleHooksConfig,
    );
    const content = JSON.parse(await readFile(join(tmp.path, '.claude', 'settings.json'), 'utf-8'));
    expect(content.env).toBeDefined();
    expect(content.env.CLAUDE_AUTOCOMPACT_PCT_OVERRIDE).toBe('70');
  });

  it('env includes both AUTOCOMPACT and AGENT_TEAMS when agentTeams is true', async () => {
    await writeSettings(
      makeTestContext({ claude: { enabled: false, agentTeams: true } }),
      tmp.path,
      sampleHooksConfig,
    );
    const content = JSON.parse(await readFile(join(tmp.path, '.claude', 'settings.json'), 'utf-8'));
    expect(content.env?.CLAUDE_AUTOCOMPACT_PCT_OVERRIDE).toBe('70');
    expect(content.env?.CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS).toBe('1');
  });

  it('env does NOT include AGENT_TEAMS when agentTeams is false', async () => {
    await writeSettings(
      makeTestContext({ claude: { enabled: true, agentTeams: false } }),
      tmp.path,
      sampleHooksConfig,
    );
    const content = JSON.parse(await readFile(join(tmp.path, '.claude', 'settings.json'), 'utf-8'));
    expect(content.env.CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS).toBeUndefined();
  });
});

// ─── Directory creation ───────────────────────────────────────────────────

describe('writeSettings: creates .claude directory if missing', () => {
  const tmp = useTempDir('settings-dir-creation-edge-');

  it('creates .claude/ directory when it does not exist', async () => {
    // Use a sub-directory that definitely does not have .claude/
    const subDir = join(tmp.path, 'new_project');
    await mkdir(subDir, { recursive: true });
    await writeSettings(makeTestContext(), subDir, sampleHooksConfig);
    const dirStat = await stat(join(subDir, '.claude'));
    expect(dirStat.isDirectory()).toBe(true);
  });

  it('both settings files exist after creation', async () => {
    const subDir = join(tmp.path, 'another_project');
    await mkdir(subDir, { recursive: true });
    await writeSettings(makeTestContext(), subDir, undefined);
    const settingsStat = await stat(join(subDir, '.claude', 'settings.json'));
    const localStat = await stat(join(subDir, '.claude', 'settings.local.json'));
    expect(settingsStat.isFile()).toBe(true);
    expect(localStat.isFile()).toBe(true);
  });
});

// ─── Idempotency ─────────────────────────────────────────────────────────

describe('writeSettings: idempotency', () => {
  const tmp = useTempDir('settings-idempotent-edge-');

  it('can be called twice without throwing', async () => {
    const ctx = makeTestContext({ claude: { enabled: true, agentTeams: true } });
    await writeSettings(ctx, tmp.path, sampleHooksConfig);
    await expect(writeSettings(ctx, tmp.path, sampleHooksConfig)).resolves.not.toThrow();
  });

  it('second call produces valid JSON in both files', async () => {
    const ctx = makeTestContext({ claude: { enabled: true, agentTeams: true } });
    await writeSettings(ctx, tmp.path, sampleHooksConfig);
    await writeSettings(ctx, tmp.path, sampleHooksConfig);
    const settings = await readFile(join(tmp.path, '.claude', 'settings.json'), 'utf-8');
    const local = await readFile(join(tmp.path, '.claude', 'settings.local.json'), 'utf-8');
    expect(() => JSON.parse(settings)).not.toThrow();
    expect(() => JSON.parse(local)).not.toThrow();
  });

  it('second call with different hooksConfig overwrites hooks in settings.json', async () => {
    const ctx = makeTestContext({ claude: { enabled: true, agentTeams: false } });
    await writeSettings(ctx, tmp.path, sampleHooksConfig);
    await writeSettings(ctx, tmp.path, undefined);
    const content = JSON.parse(await readFile(join(tmp.path, '.claude', 'settings.json'), 'utf-8'));
    expect(content.hooks).toBeUndefined();
  });
});
