import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { dump as yamlDump } from 'js-yaml';
import { jest } from '@jest/globals';

import { createListCommand, getModuleConfigDetails, printModuleTable } from '../../src/cli/commands/list.js';
import { parseConfig } from '../../src/core/config/loader.js';

describe('createListCommand', () => {
  it('creates a Command named "list"', () => {
    const cmd = createListCommand();
    expect(cmd.name()).toBe('list');
  });

  it('has --project-dir option', () => {
    const cmd = createListCommand();
    const option = cmd.options.find((o) => o.long === '--project-dir');
    expect(option).toBeDefined();
  });

  it('has a description', () => {
    const cmd = createListCommand();
    expect(cmd.description()).toContain('module');
  });
});

describe('getModuleConfigDetails', () => {
  it('returns auth provider when auth is enabled', () => {
    const config = parseConfig({
      project: { name: 'my_app', orgId: 'com.example' },
      modules: { auth: { enabled: true, provider: 'firebase' } },
    });
    const details = getModuleConfigDetails(config, 'auth');
    expect(details).toBe('provider: firebase');
  });

  it('returns empty string for auth when disabled', () => {
    const config = parseConfig({
      project: { name: 'my_app', orgId: 'com.example' },
      modules: { auth: false },
    });
    const details = getModuleConfigDetails(config, 'auth');
    expect(details).toBe('');
  });

  it('returns database engine', () => {
    const config = parseConfig({
      project: { name: 'my_app', orgId: 'com.example' },
      modules: { database: { enabled: true, engine: 'drift' } },
    });
    const details = getModuleConfigDetails(config, 'database');
    expect(details).toBe('engine: drift');
  });

  it('returns push provider', () => {
    const config = parseConfig({
      project: { name: 'my_app', orgId: 'com.example' },
      modules: { push: { enabled: true, provider: 'onesignal' } },
    });
    const details = getModuleConfigDetails(config, 'push');
    expect(details).toBe('provider: onesignal');
  });

  it('returns cicd provider', () => {
    const config = parseConfig({
      project: { name: 'my_app', orgId: 'com.example' },
      modules: { cicd: { enabled: true, provider: 'gitlab' } },
    });
    const details = getModuleConfigDetails(config, 'cicd');
    expect(details).toBe('provider: gitlab');
  });

  it('returns i18n locale', () => {
    const config = parseConfig({
      project: { name: 'my_app', orgId: 'com.example' },
      modules: { i18n: { enabled: true, defaultLocale: 'fr', supportedLocales: ['fr'] } },
    });
    const details = getModuleConfigDetails(config, 'i18n');
    expect(details).toBe('locale: fr');
  });

  it('returns empty string for analytics (no config keys)', () => {
    const config = parseConfig({
      project: { name: 'my_app', orgId: 'com.example' },
      modules: { analytics: { enabled: true } },
    });
    const details = getModuleConfigDetails(config, 'analytics');
    expect(details).toBe('');
  });

  it('returns empty string for theme with no seedColor', () => {
    const config = parseConfig({
      project: { name: 'my_app', orgId: 'com.example' },
      modules: { theme: { enabled: true } },
    });
    const details = getModuleConfigDetails(config, 'theme');
    expect(details).toBe('');
  });

  it('returns theme seedColor when set', () => {
    const config = parseConfig({
      project: { name: 'my_app', orgId: 'com.example' },
      modules: { theme: { enabled: true, seedColor: '#FF0000' } },
    });
    const details = getModuleConfigDetails(config, 'theme');
    expect(details).toBe('seed: #FF0000');
  });

  it('returns deep-linking scheme and host', () => {
    const config = parseConfig({
      project: { name: 'my_app', orgId: 'com.example' },
      modules: { 'deep-linking': { enabled: true, scheme: 'myapp', host: 'open' } },
    });
    const details = getModuleConfigDetails(config, 'deep-linking');
    expect(details).toBe('scheme: myapp, host: open');
  });

  it('returns empty string for unknown module id', () => {
    const config = parseConfig({
      project: { name: 'my_app', orgId: 'com.example' },
    });
    const details = getModuleConfigDetails(config, 'unknown-module');
    expect(details).toBe('');
  });

  it('returns api baseUrl when set', () => {
    const config = parseConfig({
      project: { name: 'my_app', orgId: 'com.example' },
      modules: { api: { enabled: true, baseUrl: 'https://api.example.com' } },
    });
    const details = getModuleConfigDetails(config, 'api');
    expect(details).toBe('baseUrl: https://api.example.com');
  });
});

describe('printModuleTable', () => {
  let consoleOutput: string[];
  let originalLog: typeof console.log;

  beforeEach(() => {
    consoleOutput = [];
    originalLog = console.log;
    console.log = (...args: unknown[]) => {
      consoleOutput.push(args.map(String).join(' '));
    };
  });

  afterEach(() => {
    console.log = originalLog;
  });

  it('prints a row for each of the 9 modules', () => {
    const config = parseConfig({
      project: { name: 'my_app', orgId: 'com.example' },
    });
    const enabledIds = new Set<string>();

    printModuleTable(config, enabledIds);

    const moduleIds = ['auth', 'api', 'database', 'i18n', 'theme', 'push', 'analytics', 'cicd', 'deep-linking'];
    for (const id of moduleIds) {
      const hasId = consoleOutput.some((line) => line.includes(id));
      expect(hasId).toBe(true);
    }
  });

  it('shows "enabled" for enabled modules and "disabled" for others', () => {
    const config = parseConfig({
      project: { name: 'my_app', orgId: 'com.example' },
      modules: {
        auth: { enabled: true, provider: 'firebase' },
        theme: { enabled: true },
      },
    });
    const enabledIds = new Set(['auth', 'theme']);

    printModuleTable(config, enabledIds);

    const output = consoleOutput.join('\n');
    expect(output).toContain('enabled');
    expect(output).toContain('disabled');
  });

  it('shows config details for enabled modules with config', () => {
    const config = parseConfig({
      project: { name: 'my_app', orgId: 'com.example' },
      modules: { auth: { enabled: true, provider: 'supabase' } },
    });
    const enabledIds = new Set(['auth']);

    printModuleTable(config, enabledIds);

    const output = consoleOutput.join('\n');
    expect(output).toContain('provider: supabase');
  });
});

describe('list command integration', () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), 'maxsim-list-test-'));
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  it('command exits with error when no config found', async () => {
    const cmd = createListCommand();
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(
      ((code?: string | number | null): never => {
        throw new Error(`process.exit(${code ?? 1}) called`);
      }) as typeof process.exit,
    );

    try {
      await expect(
        cmd.parseAsync(['--project-dir', tmpDir], { from: 'user' }),
      ).rejects.toThrow();
    } finally {
      exitSpy.mockRestore();
    }
  });

  it('command reads config and prints modules for a valid project', async () => {
    const config = {
      version: '1',
      project: { name: 'test_app', orgId: 'com.test' },
      modules: {
        auth: { enabled: true, provider: 'firebase' },
      },
    };
    await writeFile(join(tmpDir, 'maxsim.config.yaml'), yamlDump(config), 'utf-8');

    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    try {
      const cmd = createListCommand();
      await cmd.parseAsync(['--project-dir', tmpDir], { from: 'user' });

      const output = consoleSpy.mock.calls.map((c) => c.join(' ')).join('\n');
      expect(output).toContain('auth');
      expect(output).toContain('enabled');
    } finally {
      consoleSpy.mockRestore();
    }
  });
});
