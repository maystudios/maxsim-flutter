import { parseConfig } from '../../src/core/config/loader.js';
import { createProjectContext } from '../../src/core/context.js';

describe('create command - config building', () => {
  describe('parseConfig with project defaults', () => {
    it('builds valid config from minimal answers', () => {
      const config = parseConfig({
        project: { name: 'my_app', orgId: 'com.example' },
        platforms: ['android', 'ios'],
      });

      expect(config.project.name).toBe('my_app');
      expect(config.project.orgId).toBe('com.example');
      expect(config.platforms).toEqual(['android', 'ios']);
      expect(config.scaffold.dryRun).toBe(false);
    });

    it('accepts a description in project config', () => {
      const config = parseConfig({
        project: {
          name: 'my_app',
          orgId: 'com.example',
          description: 'My awesome app',
        },
      });

      expect(config.project.description).toBe('My awesome app');
    });

    it('sets dryRun from scaffold options', () => {
      const config = parseConfig({
        project: { name: 'my_app', orgId: 'com.example' },
        scaffold: { dryRun: true },
      });

      expect(config.scaffold.dryRun).toBe(true);
    });

    it('builds config with multiple platforms', () => {
      const config = parseConfig({
        project: { name: 'cross_app', orgId: 'com.example' },
        platforms: ['android', 'ios', 'web', 'macos'],
      });

      expect(config.platforms).toContain('android');
      expect(config.platforms).toContain('ios');
      expect(config.platforms).toContain('web');
      expect(config.platforms).toContain('macos');
    });

    it('defaults to android and ios platforms when not specified', () => {
      const config = parseConfig({
        project: { name: 'my_app', orgId: 'com.example' },
      });

      expect(config.platforms).toEqual(['android', 'ios']);
    });
  });

  describe('createProjectContext from config', () => {
    it('creates context with correct outputDir', () => {
      const config = parseConfig({
        project: { name: 'my_app', orgId: 'com.example' },
      });

      const outputDir = '/tmp/output/my_app';
      const context = createProjectContext(config, outputDir);

      expect(context.projectName).toBe('my_app');
      expect(context.orgId).toBe('com.example');
      expect(context.outputDir).toBe(outputDir);
    });

    it('maps scaffold config to context', () => {
      const config = parseConfig({
        project: { name: 'my_app', orgId: 'com.example' },
        scaffold: { dryRun: true, overwriteExisting: 'never' },
      });

      const context = createProjectContext(config, '/tmp/output');

      expect(context.scaffold.dryRun).toBe(true);
      expect(context.scaffold.overwrite).toBe('never');
    });

    it('maps platforms from config to context', () => {
      const config = parseConfig({
        project: { name: 'my_app', orgId: 'com.example' },
        platforms: ['android', 'web'],
      });

      const context = createProjectContext(config, '/tmp/output');

      expect(context.platforms).toEqual(['android', 'web']);
    });

    it('stores rawConfig reference', () => {
      const config = parseConfig({
        project: { name: 'my_app', orgId: 'com.example' },
      });

      const context = createProjectContext(config, '/tmp/output');

      expect(context.rawConfig).toBe(config);
    });
  });

  describe('yes flag defaults', () => {
    it('builds valid config with just a name using defaults', () => {
      const name = 'my_app';
      const config = parseConfig({
        project: { name, orgId: 'com.example' },
        scaffold: { dryRun: false },
      });

      expect(config.project.name).toBe('my_app');
      expect(config.project.orgId).toBe('com.example');
      expect(config.platforms).toEqual(['android', 'ios']);
    });
  });
});
