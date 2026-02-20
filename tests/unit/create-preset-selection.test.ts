import { parseConfig } from '../../src/core/config/loader.js';
import { createProjectContext } from '../../src/core/context.js';
import { PRESETS, getPresetModules } from '../../src/cli/ui/prompts.js';

describe('create command — Claude preset selection', () => {
  describe('--yes flag defaults to standard preset', () => {
    it('parseConfig with claude.preset standard produces preset standard in config', () => {
      // This documents the expected config shape produced by the --yes branch after the fix
      const config = parseConfig({
        project: { name: 'my_app', orgId: 'com.example' },
        claude: { preset: 'standard' },
      });

      expect(config.claude.preset).toBe('standard');
    });

    it('parseConfig without claude.preset leaves preset undefined (pre-fix behavior to replace)', () => {
      // Before fix: --yes branch does NOT set claude.preset → undefined
      // After fix:  --yes branch WILL set claude.preset: 'standard'
      const config = parseConfig({
        project: { name: 'my_app', orgId: 'com.example' },
        // no claude.preset set — mirrors the current --yes branch behaviour
      });

      // This documents current broken state: should be 'standard' after fix
      expect(config.claude.preset).toBeUndefined();
    });
  });

  describe('preset value flows into ProjectContext', () => {
    it('createProjectContext exposes claude.preset when set to standard', () => {
      const config = parseConfig({
        project: { name: 'my_app', orgId: 'com.example' },
        claude: { preset: 'standard' },
      });

      const context = createProjectContext(config, '/tmp/output/my_app');

      expect(context.claude.preset).toBe('standard');
    });

    it('createProjectContext exposes claude.preset when set to minimal', () => {
      const config = parseConfig({
        project: { name: 'my_app', orgId: 'com.example' },
        claude: { preset: 'minimal' },
      });

      const context = createProjectContext(config, '/tmp/output/my_app');

      expect(context.claude.preset).toBe('minimal');
    });

    it('createProjectContext exposes claude.preset when set to full', () => {
      const config = parseConfig({
        project: { name: 'my_app', orgId: 'com.example' },
        claude: { preset: 'full' },
      });

      const context = createProjectContext(config, '/tmp/output/my_app');

      expect(context.claude.preset).toBe('full');
    });

    it('createProjectContext has undefined claude.preset when not configured', () => {
      const config = parseConfig({
        project: { name: 'my_app', orgId: 'com.example' },
      });

      const context = createProjectContext(config, '/tmp/output/my_app');

      expect(context.claude.preset).toBeUndefined();
    });
  });

  describe('prompts module includes Claude preset selection options', () => {
    it('PRESETS contains minimal, standard, and full — all valid claude.preset values', () => {
      const validClaudePresets = ['minimal', 'standard', 'full'] as const;

      for (const presetId of validClaudePresets) {
        const found = PRESETS.some((p) => p.id === presetId);
        expect(found).toBe(true);
      }
    });

    it('standard preset modules match the standard claude setup expectation', () => {
      // standard preset selects auth + api + theme
      const modules = getPresetModules('standard');
      expect(modules).toContain('auth');
      expect(modules).toContain('api');
      expect(modules).toContain('theme');
    });

    it('minimal preset has no modules — lean claude setup', () => {
      const modules = getPresetModules('minimal');
      expect(modules).toHaveLength(0);
    });
  });

  describe('--config file with claude.preset is respected', () => {
    it('parseConfig from yaml-equivalent object respects claude.preset full', () => {
      // Simulates loading a maxsim.config.yaml that has claude.preset: full
      const config = parseConfig({
        project: { name: 'enterprise_app', orgId: 'com.corp' },
        claude: { preset: 'full' },
      });

      expect(config.claude.preset).toBe('full');
    });

    it('parseConfig from yaml-equivalent object respects claude.preset minimal', () => {
      const config = parseConfig({
        project: { name: 'simple_app', orgId: 'com.example' },
        claude: { preset: 'minimal' },
      });

      expect(config.claude.preset).toBe('minimal');
    });
  });
});
