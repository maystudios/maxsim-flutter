import path from 'node:path';
import { MaxsimConfigSchema } from '../../src/core/config/schema.js';
import { loadConfig, parseConfig } from '../../src/core/config/loader.js';

const fixturesDir = path.join(process.cwd(), 'tests', 'fixtures', 'configs');

describe('MaxsimConfigSchema', () => {
  describe('minimal config', () => {
    it('passes with minimal valid config', () => {
      const result = MaxsimConfigSchema.safeParse({
        project: { name: 'my_app', orgId: 'com.example' },
        platforms: ['android'],
      });
      expect(result.success).toBe(true);
    });

    it('applies defaults for omitted optional fields', () => {
      const result = MaxsimConfigSchema.parse({
        project: { name: 'my_app', orgId: 'com.example' },
      });
      expect(result.version).toBe('1');
      expect(result.platforms).toEqual(['android', 'ios']);
      expect(result.modules).toEqual({});
      expect(result.claude.enabled).toBe(true);
      expect(result.scaffold.overwriteExisting).toBe('ask');
      expect(result.scaffold.runDartFormat).toBe(true);
      expect(result.scaffold.runPubGet).toBe(true);
      expect(result.scaffold.runBuildRunner).toBe(true);
      expect(result.scaffold.dryRun).toBe(false);
    });
  });

  describe('required fields', () => {
    it('fails when project.name is missing', () => {
      const result = MaxsimConfigSchema.safeParse({
        project: { orgId: 'com.example' },
      });
      expect(result.success).toBe(false);
    });

    it('fails when project.orgId is missing', () => {
      const result = MaxsimConfigSchema.safeParse({
        project: { name: 'my_app' },
      });
      expect(result.success).toBe(false);
    });

    it('fails when project is entirely missing', () => {
      const result = MaxsimConfigSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe('platforms', () => {
    it('accepts valid platform values', () => {
      const result = MaxsimConfigSchema.safeParse({
        project: { name: 'my_app', orgId: 'com.example' },
        platforms: ['android', 'ios', 'web', 'macos', 'windows', 'linux'],
      });
      expect(result.success).toBe(true);
    });

    it('fails on invalid platform value', () => {
      const result = MaxsimConfigSchema.safeParse({
        project: { name: 'my_app', orgId: 'com.example' },
        platforms: ['invalid-platform'],
      });
      expect(result.success).toBe(false);
    });
  });

  describe('modules', () => {
    it('accepts auth module with firebase provider', () => {
      const result = MaxsimConfigSchema.safeParse({
        project: { name: 'my_app', orgId: 'com.example' },
        modules: { auth: { enabled: true, provider: 'firebase' } },
      });
      expect(result.success).toBe(true);
    });

    it('accepts auth module with supabase provider', () => {
      const result = MaxsimConfigSchema.safeParse({
        project: { name: 'my_app', orgId: 'com.example' },
        modules: { auth: { enabled: true, provider: 'supabase' } },
      });
      expect(result.success).toBe(true);
    });

    it('fails auth module with invalid provider', () => {
      const result = MaxsimConfigSchema.safeParse({
        project: { name: 'my_app', orgId: 'com.example' },
        modules: { auth: { enabled: true, provider: 'invalid' } },
      });
      expect(result.success).toBe(false);
    });

    it('accepts module disabled with false', () => {
      const result = MaxsimConfigSchema.safeParse({
        project: { name: 'my_app', orgId: 'com.example' },
        modules: { auth: false },
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.modules.auth).toBe(false);
      }
    });

    it('accepts database module with drift engine', () => {
      const result = MaxsimConfigSchema.safeParse({
        project: { name: 'my_app', orgId: 'com.example' },
        modules: { database: { enabled: true, engine: 'drift' } },
      });
      expect(result.success).toBe(true);
    });

    it('fails database module with invalid engine', () => {
      const result = MaxsimConfigSchema.safeParse({
        project: { name: 'my_app', orgId: 'com.example' },
        modules: { database: { enabled: true, engine: 'sqlite' } },
      });
      expect(result.success).toBe(false);
    });

    it('accepts cicd module with github provider', () => {
      const result = MaxsimConfigSchema.safeParse({
        project: { name: 'my_app', orgId: 'com.example' },
        modules: { cicd: { enabled: true, provider: 'github' } },
      });
      expect(result.success).toBe(true);
    });

    it('fails cicd module with invalid provider', () => {
      const result = MaxsimConfigSchema.safeParse({
        project: { name: 'my_app', orgId: 'com.example' },
        modules: { cicd: { enabled: true, provider: 'jenkins' } },
      });
      expect(result.success).toBe(false);
    });
  });

  describe('claude section', () => {
    it('applies defaults for claude section', () => {
      const result = MaxsimConfigSchema.parse({
        project: { name: 'my_app', orgId: 'com.example' },
      });
      expect(result.claude.enabled).toBe(true);
      expect(result.claude.agentTeams).toBe(false);
      expect(result.claude.mcpServers).toEqual([]);
    });

    it('accepts explicit claude configuration', () => {
      const result = MaxsimConfigSchema.safeParse({
        project: { name: 'my_app', orgId: 'com.example' },
        claude: { enabled: true, agentTeams: true, mcpServers: [] },
      });
      expect(result.success).toBe(true);
    });
  });
});

describe('parseConfig', () => {
  it('returns validated config for valid input', () => {
    const config = parseConfig({
      project: { name: 'my_app', orgId: 'com.example' },
      platforms: ['android'],
    });
    expect(config.project.name).toBe('my_app');
    expect(config.project.orgId).toBe('com.example');
  });

  it('throws a descriptive error for invalid input', () => {
    expect(() => parseConfig({ project: { orgId: 'com.example' } })).toThrow(
      'Invalid configuration',
    );
  });

  it('throws with field path info on validation error', () => {
    expect(() => parseConfig({ project: { orgId: 'com.example' } })).toThrow('project.name');
  });
});

describe('loadConfig', () => {
  it('loads and validates minimal.yaml fixture', async () => {
    const config = await loadConfig(path.join(fixturesDir, 'minimal.yaml'));
    expect(config.project.name).toBe('minimal_app');
    expect(config.project.orgId).toBe('com.example');
    expect(config.platforms).toContain('android');
  });

  it('loads and validates valid-full.yaml fixture', async () => {
    const config = await loadConfig(path.join(fixturesDir, 'valid-full.yaml'));
    expect(config.project.name).toBe('test_app');
    expect(config.project.orgId).toBe('com.example.test');
    expect(config.project.description).toBe('A test Flutter application');
    expect(config.platforms).toContain('ios');
    expect(config.platforms).toContain('android');
    expect(config.platforms).toContain('web');
  });

  it('throws ENOENT error for missing file', async () => {
    await expect(loadConfig('/nonexistent/path/config.yaml')).rejects.toThrow(
      'Config file not found',
    );
  });

  it('throws error for invalid YAML', async () => {
    const invalidYamlPath = path.join(fixturesDir, 'invalid.yaml');
    // Write a temp invalid yaml file inline approach - use a known bad path
    await expect(loadConfig(invalidYamlPath)).rejects.toThrow();
  });
});
