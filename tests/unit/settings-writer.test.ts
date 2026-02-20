import { writeSettings } from '../../src/claude-setup/settings-writer.js';
import { makeTestContext } from '../helpers/context-factory.js';
import { useTempDir } from '../helpers/temp-dir.js';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

function makeContext(overrides: Partial<Parameters<typeof makeTestContext>[0]> = {}) {
  return makeTestContext({
    claude: { enabled: true, agentTeams: true },
    ...overrides,
  });
}

const sampleHooksConfig = {
  hooks: {
    PreToolUse: [
      {
        matcher: 'Bash',
        hooks: [{ type: 'command' as const, command: '.claude/hooks/block-dangerous.sh' }],
      },
    ],
    PostToolUse: [
      {
        matcher: 'Edit|Write',
        hooks: [{ type: 'command' as const, command: '.claude/hooks/format-dart.sh' }],
      },
    ],
  },
};

describe('writeSettings — settings.json (team-shared)', () => {
  const tmp = useTempDir('settings-writer-test-');

  it('generates .claude/settings.json', async () => {
    await writeSettings(makeContext(), tmp.path, sampleHooksConfig);
    const raw = await readFile(join(tmp.path, '.claude', 'settings.json'), 'utf-8');
    expect(raw).toBeTruthy();
  });

  it('settings.json is valid JSON', async () => {
    await writeSettings(makeContext(), tmp.path, sampleHooksConfig);
    const raw = await readFile(join(tmp.path, '.claude', 'settings.json'), 'utf-8');
    expect(() => JSON.parse(raw)).not.toThrow();
  });

  it('settings.json contains $schema field', async () => {
    await writeSettings(makeContext(), tmp.path, sampleHooksConfig);
    const content = JSON.parse(
      await readFile(join(tmp.path, '.claude', 'settings.json'), 'utf-8'),
    );
    expect(content.$schema).toBe('https://json.schemastore.org/claude-code-settings.json');
  });

  it('settings.json contains permissions.deny array', async () => {
    await writeSettings(makeContext(), tmp.path, sampleHooksConfig);
    const content = JSON.parse(
      await readFile(join(tmp.path, '.claude', 'settings.json'), 'utf-8'),
    );
    expect(content.permissions).toBeDefined();
    expect(content.permissions.deny).toBeInstanceOf(Array);
    expect(content.permissions.deny.length).toBeGreaterThan(0);
  });

  it('deny rules include Read(./.env) and Edit(./.env)', async () => {
    await writeSettings(makeContext(), tmp.path, sampleHooksConfig);
    const content = JSON.parse(
      await readFile(join(tmp.path, '.claude', 'settings.json'), 'utf-8'),
    );
    expect(content.permissions.deny).toContain('Read(./.env)');
    expect(content.permissions.deny).toContain('Edit(./.env)');
  });

  it('deny rules include Read(./.env.*) and Edit(./.env.*)', async () => {
    await writeSettings(makeContext(), tmp.path, sampleHooksConfig);
    const content = JSON.parse(
      await readFile(join(tmp.path, '.claude', 'settings.json'), 'utf-8'),
    );
    expect(content.permissions.deny).toContain('Read(./.env.*)');
    expect(content.permissions.deny).toContain('Edit(./.env.*)');
  });

  it('deny rules include Read(./credentials*)', async () => {
    await writeSettings(makeContext(), tmp.path, sampleHooksConfig);
    const content = JSON.parse(
      await readFile(join(tmp.path, '.claude', 'settings.json'), 'utf-8'),
    );
    expect(content.permissions.deny).toContain('Read(./credentials*)');
  });

  it('deny rules include Read(./secrets*)', async () => {
    await writeSettings(makeContext(), tmp.path, sampleHooksConfig);
    const content = JSON.parse(
      await readFile(join(tmp.path, '.claude', 'settings.json'), 'utf-8'),
    );
    expect(content.permissions.deny).toContain('Read(./secrets*)');
  });

  it('deny rules include Read(./**/*.pem)', async () => {
    await writeSettings(makeContext(), tmp.path, sampleHooksConfig);
    const content = JSON.parse(
      await readFile(join(tmp.path, '.claude', 'settings.json'), 'utf-8'),
    );
    expect(content.permissions.deny).toContain('Read(./**/*.pem)');
  });

  it('deny rules include Read(./**/*.key)', async () => {
    await writeSettings(makeContext(), tmp.path, sampleHooksConfig);
    const content = JSON.parse(
      await readFile(join(tmp.path, '.claude', 'settings.json'), 'utf-8'),
    );
    expect(content.permissions.deny).toContain('Read(./**/*.key)');
  });

  it('deny rules include Bash(rm -rf *) and Bash(sudo *)', async () => {
    await writeSettings(makeContext(), tmp.path, sampleHooksConfig);
    const content = JSON.parse(
      await readFile(join(tmp.path, '.claude', 'settings.json'), 'utf-8'),
    );
    expect(content.permissions.deny).toContain('Bash(rm -rf *)');
    expect(content.permissions.deny).toContain('Bash(sudo *)');
  });

  it('settings.json contains hooks section when hooksConfig provided', async () => {
    await writeSettings(makeContext(), tmp.path, sampleHooksConfig);
    const content = JSON.parse(
      await readFile(join(tmp.path, '.claude', 'settings.json'), 'utf-8'),
    );
    expect(content.hooks).toBeDefined();
    expect(content.hooks.PreToolUse).toBeDefined();
  });

  it('settings.json omits hooks section when hooksConfig is undefined', async () => {
    await writeSettings(makeContext(), tmp.path, undefined);
    const content = JSON.parse(
      await readFile(join(tmp.path, '.claude', 'settings.json'), 'utf-8'),
    );
    expect(content.hooks).toBeUndefined();
  });

  it('settings.json includes CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS env when agentTeams is true', async () => {
    await writeSettings(
      makeContext({ claude: { enabled: true, agentTeams: true } }),
      tmp.path,
      sampleHooksConfig,
    );
    const content = JSON.parse(
      await readFile(join(tmp.path, '.claude', 'settings.json'), 'utf-8'),
    );
    expect(content.env).toBeDefined();
    expect(content.env.CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS).toBe('1');
  });

  it('settings.json omits env section when agentTeams is false', async () => {
    await writeSettings(
      makeContext({ claude: { enabled: true, agentTeams: false } }),
      tmp.path,
      sampleHooksConfig,
    );
    const content = JSON.parse(
      await readFile(join(tmp.path, '.claude', 'settings.json'), 'utf-8'),
    );
    expect(content.env).toBeUndefined();
  });
});

describe('writeSettings — settings.local.json (personal)', () => {
  const tmp = useTempDir('settings-writer-local-test-');

  it('generates .claude/settings.local.json', async () => {
    await writeSettings(makeContext(), tmp.path, sampleHooksConfig);
    const raw = await readFile(join(tmp.path, '.claude', 'settings.local.json'), 'utf-8');
    expect(raw).toBeTruthy();
  });

  it('settings.local.json is valid JSON', async () => {
    await writeSettings(makeContext(), tmp.path, sampleHooksConfig);
    const raw = await readFile(join(tmp.path, '.claude', 'settings.local.json'), 'utf-8');
    expect(() => JSON.parse(raw)).not.toThrow();
  });

  it('settings.local.json contains permissions.allow array', async () => {
    await writeSettings(makeContext(), tmp.path, sampleHooksConfig);
    const content = JSON.parse(
      await readFile(join(tmp.path, '.claude', 'settings.local.json'), 'utf-8'),
    );
    expect(content.permissions).toBeDefined();
    expect(content.permissions.allow).toBeInstanceOf(Array);
    expect(content.permissions.allow.length).toBeGreaterThan(0);
  });

  it('allow rules include Bash(flutter *) and Bash(dart *)', async () => {
    await writeSettings(makeContext(), tmp.path, sampleHooksConfig);
    const content = JSON.parse(
      await readFile(join(tmp.path, '.claude', 'settings.local.json'), 'utf-8'),
    );
    expect(content.permissions.allow).toContain('Bash(flutter *)');
    expect(content.permissions.allow).toContain('Bash(dart *)');
  });

  it('allow rules include Bash(git diff *), Bash(git status), Bash(git log *)', async () => {
    await writeSettings(makeContext(), tmp.path, sampleHooksConfig);
    const content = JSON.parse(
      await readFile(join(tmp.path, '.claude', 'settings.local.json'), 'utf-8'),
    );
    expect(content.permissions.allow).toContain('Bash(git diff *)');
    expect(content.permissions.allow).toContain('Bash(git status)');
    expect(content.permissions.allow).toContain('Bash(git log *)');
  });

  it('allow rules include Read(./lib/**) and Read(./test/**)', async () => {
    await writeSettings(makeContext(), tmp.path, sampleHooksConfig);
    const content = JSON.parse(
      await readFile(join(tmp.path, '.claude', 'settings.local.json'), 'utf-8'),
    );
    expect(content.permissions.allow).toContain('Read(./lib/**)');
    expect(content.permissions.allow).toContain('Read(./test/**)');
  });

  it('allow rules include Edit(./lib/**) and Edit(./test/**)', async () => {
    await writeSettings(makeContext(), tmp.path, sampleHooksConfig);
    const content = JSON.parse(
      await readFile(join(tmp.path, '.claude', 'settings.local.json'), 'utf-8'),
    );
    expect(content.permissions.allow).toContain('Edit(./lib/**)');
    expect(content.permissions.allow).toContain('Edit(./test/**)');
  });

  it('settings.local.json does NOT contain hooks', async () => {
    await writeSettings(makeContext(), tmp.path, sampleHooksConfig);
    const content = JSON.parse(
      await readFile(join(tmp.path, '.claude', 'settings.local.json'), 'utf-8'),
    );
    expect(content.hooks).toBeUndefined();
  });

  it('settings.local.json does NOT contain deny permissions', async () => {
    await writeSettings(makeContext(), tmp.path, sampleHooksConfig);
    const content = JSON.parse(
      await readFile(join(tmp.path, '.claude', 'settings.local.json'), 'utf-8'),
    );
    expect(content.permissions.deny).toBeUndefined();
  });
});
