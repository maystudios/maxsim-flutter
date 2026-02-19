import { createProjectContext } from '../../src/core/context.js';
import { parseConfig } from '../../src/core/config/loader.js';

/**
 * Helper to build a MaxsimConfig via parseConfig with minimal boilerplate.
 */
function buildConfig(modulesOverrides: Record<string, unknown> = {}, extras: Record<string, unknown> = {}) {
  return parseConfig({
    project: { name: 'test_app', orgId: 'com.example', description: 'Test app' },
    modules: modulesOverrides,
    ...extras,
  });
}

describe('createProjectContext', () => {
  describe('core project info', () => {
    it('maps project name from config', () => {
      const config = buildConfig();
      const ctx = createProjectContext(config, '/out');
      expect(ctx.projectName).toBe('test_app');
    });

    it('maps orgId from config', () => {
      const config = buildConfig();
      const ctx = createProjectContext(config, '/out');
      expect(ctx.orgId).toBe('com.example');
    });

    it('maps description from config', () => {
      const config = buildConfig();
      const ctx = createProjectContext(config, '/out');
      expect(ctx.description).toBe('Test app');
    });

    it('defaults description to empty string when not provided', () => {
      const config = parseConfig({
        project: { name: 'test_app', orgId: 'com.example' },
      });
      const ctx = createProjectContext(config, '/out');
      expect(ctx.description).toBe('');
    });

    it('maps outputDir from parameter', () => {
      const config = buildConfig();
      const ctx = createProjectContext(config, '/custom/output');
      expect(ctx.outputDir).toBe('/custom/output');
    });

    it('preserves rawConfig reference', () => {
      const config = buildConfig();
      const ctx = createProjectContext(config, '/out');
      expect(ctx.rawConfig).toBe(config);
    });
  });

  describe('platforms', () => {
    it('defaults to android and ios', () => {
      const config = buildConfig();
      const ctx = createProjectContext(config, '/out');
      expect(ctx.platforms).toEqual(['android', 'ios']);
    });

    it('maps custom platforms from config', () => {
      const config = parseConfig({
        project: { name: 'test_app', orgId: 'com.example' },
        platforms: ['android', 'ios', 'web', 'macos'],
      });
      const ctx = createProjectContext(config, '/out');
      expect(ctx.platforms).toEqual(['android', 'ios', 'web', 'macos']);
    });
  });

  describe('modules — all disabled by default', () => {
    it('disables all modules when none configured', () => {
      const config = buildConfig();
      const ctx = createProjectContext(config, '/out');
      expect(ctx.modules.auth).toBe(false);
      expect(ctx.modules.api).toBe(false);
      expect(ctx.modules.database).toBe(false);
      expect(ctx.modules.i18n).toBe(false);
      expect(ctx.modules.theme).toBe(false);
      expect(ctx.modules.push).toBe(false);
      expect(ctx.modules.analytics).toBe(false);
      expect(ctx.modules.cicd).toBe(false);
      expect(ctx.modules.deepLinking).toBe(false);
    });
  });

  describe('auth module', () => {
    it('resolves firebase auth', () => {
      const config = buildConfig({ auth: { enabled: true, provider: 'firebase' } });
      const ctx = createProjectContext(config, '/out');
      expect(ctx.modules.auth).toEqual({ provider: 'firebase' });
    });

    it('resolves supabase auth', () => {
      const config = buildConfig({ auth: { enabled: true, provider: 'supabase' } });
      const ctx = createProjectContext(config, '/out');
      expect(ctx.modules.auth).toEqual({ provider: 'supabase' });
    });

    it('returns false when auth is explicitly disabled', () => {
      const config = buildConfig({ auth: { enabled: false } });
      const ctx = createProjectContext(config, '/out');
      expect(ctx.modules.auth).toBe(false);
    });

    it('returns false when auth is set to false', () => {
      const config = buildConfig({ auth: false });
      const ctx = createProjectContext(config, '/out');
      expect(ctx.modules.auth).toBe(false);
    });
  });

  describe('api module', () => {
    it('resolves api with baseUrl', () => {
      const config = buildConfig({ api: { enabled: true, baseUrl: 'https://api.test.com' } });
      const ctx = createProjectContext(config, '/out');
      expect(ctx.modules.api).toEqual({ baseUrl: 'https://api.test.com' });
    });

    it('resolves api without baseUrl', () => {
      const config = buildConfig({ api: { enabled: true } });
      const ctx = createProjectContext(config, '/out');
      expect(ctx.modules.api).toEqual({ baseUrl: undefined });
    });

    it('returns false when api is disabled', () => {
      const config = buildConfig({ api: { enabled: false } });
      const ctx = createProjectContext(config, '/out');
      expect(ctx.modules.api).toBe(false);
    });
  });

  describe('database module', () => {
    it('resolves drift database', () => {
      const config = buildConfig({ database: { enabled: true, engine: 'drift' } });
      const ctx = createProjectContext(config, '/out');
      expect(ctx.modules.database).toEqual({ engine: 'drift' });
    });

    it('resolves hive database', () => {
      const config = buildConfig({ database: { enabled: true, engine: 'hive' } });
      const ctx = createProjectContext(config, '/out');
      expect(ctx.modules.database).toEqual({ engine: 'hive' });
    });

    it('returns false when database is disabled', () => {
      const config = buildConfig({ database: false });
      const ctx = createProjectContext(config, '/out');
      expect(ctx.modules.database).toBe(false);
    });
  });

  describe('i18n module', () => {
    it('resolves i18n with locales', () => {
      const config = buildConfig({ i18n: { enabled: true, defaultLocale: 'de', supportedLocales: ['de', 'en'] } });
      const ctx = createProjectContext(config, '/out');
      expect(ctx.modules.i18n).toEqual({ defaultLocale: 'de', supportedLocales: ['de', 'en'] });
    });

    it('returns false when i18n is disabled', () => {
      const config = buildConfig({ i18n: { enabled: false } });
      const ctx = createProjectContext(config, '/out');
      expect(ctx.modules.i18n).toBe(false);
    });
  });

  describe('theme module', () => {
    it('resolves theme with dark mode', () => {
      const config = buildConfig({ theme: { enabled: true, seedColor: '#FF0000', darkMode: true } });
      const ctx = createProjectContext(config, '/out');
      expect(ctx.modules.theme).toEqual({ seedColor: '#FF0000', darkMode: true });
    });

    it('returns false when theme is disabled', () => {
      const config = buildConfig({ theme: false });
      const ctx = createProjectContext(config, '/out');
      expect(ctx.modules.theme).toBe(false);
    });
  });

  describe('push module', () => {
    it('resolves firebase push', () => {
      const config = buildConfig({ push: { enabled: true, provider: 'firebase' } });
      const ctx = createProjectContext(config, '/out');
      expect(ctx.modules.push).toEqual({ provider: 'firebase' });
    });

    it('resolves onesignal push', () => {
      const config = buildConfig({ push: { enabled: true, provider: 'onesignal' } });
      const ctx = createProjectContext(config, '/out');
      expect(ctx.modules.push).toEqual({ provider: 'onesignal' });
    });

    it('returns false when push is disabled', () => {
      const config = buildConfig({ push: { enabled: false } });
      const ctx = createProjectContext(config, '/out');
      expect(ctx.modules.push).toBe(false);
    });
  });

  describe('analytics module', () => {
    it('resolves analytics when enabled', () => {
      const config = buildConfig({ analytics: { enabled: true } });
      const ctx = createProjectContext(config, '/out');
      expect(ctx.modules.analytics).toEqual({ enabled: true });
    });

    it('returns false when analytics is disabled', () => {
      const config = buildConfig({ analytics: { enabled: false } });
      const ctx = createProjectContext(config, '/out');
      expect(ctx.modules.analytics).toBe(false);
    });
  });

  describe('cicd module', () => {
    it('resolves github cicd', () => {
      const config = buildConfig({ cicd: { enabled: true, provider: 'github' } });
      const ctx = createProjectContext(config, '/out');
      expect(ctx.modules.cicd).toEqual({ provider: 'github' });
    });

    it('resolves gitlab cicd', () => {
      const config = buildConfig({ cicd: { enabled: true, provider: 'gitlab' } });
      const ctx = createProjectContext(config, '/out');
      expect(ctx.modules.cicd).toEqual({ provider: 'gitlab' });
    });

    it('returns false when cicd is disabled', () => {
      const config = buildConfig({ cicd: false });
      const ctx = createProjectContext(config, '/out');
      expect(ctx.modules.cicd).toBe(false);
    });
  });

  describe('deep-linking module', () => {
    it('resolves deep linking with scheme and host', () => {
      const config = buildConfig({ 'deep-linking': { enabled: true, scheme: 'myapp', host: 'example.com' } });
      const ctx = createProjectContext(config, '/out');
      expect(ctx.modules.deepLinking).toEqual({ scheme: 'myapp', host: 'example.com' });
    });

    it('returns false when deep-linking is disabled', () => {
      const config = buildConfig({ 'deep-linking': false });
      const ctx = createProjectContext(config, '/out');
      expect(ctx.modules.deepLinking).toBe(false);
    });
  });

  describe('multiple modules simultaneously', () => {
    it('resolves multiple enabled modules at once', () => {
      const config = buildConfig({
        auth: { enabled: true, provider: 'firebase' },
        api: { enabled: true, baseUrl: 'https://api.test.com' },
        theme: { enabled: true, darkMode: true },
        i18n: { enabled: true, defaultLocale: 'en', supportedLocales: ['en', 'de'] },
      });
      const ctx = createProjectContext(config, '/out');

      expect(ctx.modules.auth).toEqual({ provider: 'firebase' });
      expect(ctx.modules.api).toEqual({ baseUrl: 'https://api.test.com' });
      expect(ctx.modules.theme).toEqual({ seedColor: undefined, darkMode: true });
      expect(ctx.modules.i18n).toEqual({ defaultLocale: 'en', supportedLocales: ['en', 'de'] });
      // Others remain false
      expect(ctx.modules.database).toBe(false);
      expect(ctx.modules.push).toBe(false);
    });
  });

  describe('scaffold settings', () => {
    it('maps scaffold settings from config', () => {
      const config = buildConfig({}, { scaffold: { dryRun: true, overwriteExisting: 'never' } });
      const ctx = createProjectContext(config, '/out');
      expect(ctx.scaffold.dryRun).toBe(true);
      expect(ctx.scaffold.overwrite).toBe('never');
    });

    it('maps post-processor settings', () => {
      const config = buildConfig({}, { scaffold: { runDartFormat: false, runPubGet: false, runBuildRunner: false } });
      const ctx = createProjectContext(config, '/out');
      expect(ctx.scaffold.postProcessors.dartFormat).toBe(false);
      expect(ctx.scaffold.postProcessors.flutterPubGet).toBe(false);
      expect(ctx.scaffold.postProcessors.buildRunner).toBe(false);
    });

    it('defaults post-processors to true', () => {
      const config = buildConfig();
      const ctx = createProjectContext(config, '/out');
      expect(ctx.scaffold.postProcessors.dartFormat).toBe(true);
      expect(ctx.scaffold.postProcessors.flutterPubGet).toBe(true);
      expect(ctx.scaffold.postProcessors.buildRunner).toBe(true);
    });
  });

  describe('claude settings', () => {
    it('maps claude enabled and agentTeams', () => {
      const config = buildConfig({}, { claude: { enabled: true, agentTeams: true } });
      const ctx = createProjectContext(config, '/out');
      expect(ctx.claude.enabled).toBe(true);
      expect(ctx.claude.agentTeams).toBe(true);
    });

    it('defaults claude enabled to true and agentTeams to false', () => {
      const config = buildConfig();
      const ctx = createProjectContext(config, '/out');
      expect(ctx.claude.enabled).toBe(true);
      expect(ctx.claude.agentTeams).toBe(false);
    });
  });
});
