import { generateClaudeMd } from '../../src/claude-setup/claude-md-generator.js';
import { makeTestContext } from '../helpers/context-factory.js';

function makeContext(overrides: Partial<Parameters<typeof makeTestContext>[0]> = {}) {
  return makeTestContext({
    claude: { enabled: true, agentTeams: false },
    ...overrides,
  });
}

describe('generateClaudeMd', () => {
  describe('header section', () => {
    it('includes project name in title', () => {
      const result = generateClaudeMd(makeContext({ projectName: 'awesome_app' }));
      expect(result).toContain('# CLAUDE.md - awesome_app');
    });

    it('includes project description when provided', () => {
      const result = generateClaudeMd(makeContext({ description: 'My cool app' }));
      expect(result).toContain('My cool app');
    });

    it('lists platforms', () => {
      const result = generateClaudeMd(makeContext({ platforms: ['android', 'ios', 'web'] }));
      expect(result).toContain('android, ios, web');
    });

    it('lists active modules when present', () => {
      const ctx = makeContext({
        modules: {
          ...makeContext().modules,
          auth: { provider: 'firebase' },
          api: { baseUrl: 'https://api.example.com' },
        },
      });
      const result = generateClaudeMd(ctx);
      expect(result).toContain('**Active modules:** auth, api');
    });

    it('does not show active modules line when none enabled', () => {
      const result = generateClaudeMd(makeContext());
      expect(result).not.toContain('**Active modules:**');
    });
  });

  describe('rules section', () => {
    it('includes @-imports for all 5 core rule files', () => {
      const result = generateClaudeMd(makeContext());
      expect(result).toContain('@.claude/rules/architecture.md');
      expect(result).toContain('@.claude/rules/riverpod.md');
      expect(result).toContain('@.claude/rules/go-router.md');
      expect(result).toContain('@.claude/rules/testing.md');
      expect(result).toContain('@.claude/rules/security.md');
    });

    it('includes module @-import when module is enabled', () => {
      const ctx = makeContext({
        modules: { ...makeContext().modules, auth: { provider: 'firebase' } },
      });
      const result = generateClaudeMd(ctx);
      expect(result).toContain('@.claude/rules/auth.md');
    });

    it('omits module @-import when module is disabled', () => {
      const result = generateClaudeMd(makeContext());
      expect(result).not.toContain('@.claude/rules/auth.md');
      expect(result).not.toContain('@.claude/rules/api.md');
    });

    it('includes @-import for each enabled module', () => {
      const ctx = makeContext({
        modules: {
          ...makeContext().modules,
          api: { baseUrl: 'https://api.test.com' },
          database: { engine: 'drift' },
          i18n: { defaultLocale: 'en', supportedLocales: ['en'] },
          theme: { darkMode: true },
          push: { provider: 'firebase' },
          analytics: { enabled: true },
          cicd: { provider: 'github' },
          deepLinking: { scheme: 'myapp', host: 'example.com' },
        },
      });
      const result = generateClaudeMd(ctx);
      expect(result).toContain('@.claude/rules/api.md');
      expect(result).toContain('@.claude/rules/database.md');
      expect(result).toContain('@.claude/rules/i18n.md');
      expect(result).toContain('@.claude/rules/theme.md');
      expect(result).toContain('@.claude/rules/push.md');
      expect(result).toContain('@.claude/rules/analytics.md');
      expect(result).toContain('@.claude/rules/cicd.md');
      expect(result).toContain('@.claude/rules/deep-linking.md');
    });
  });

  describe('quality gates section', () => {
    it('includes flutter analyze and flutter test', () => {
      const result = generateClaudeMd(makeContext());
      expect(result).toContain('## Quality Gates');
      expect(result).toContain('flutter analyze');
      expect(result).toContain('flutter test');
      expect(result).toContain('dart format');
    });
  });

  describe('build commands section', () => {
    it('includes common Flutter commands', () => {
      const result = generateClaudeMd(makeContext());
      expect(result).toContain('## Build Commands');
      expect(result).toContain('flutter pub get');
      expect(result).toContain('flutter run');
    });
  });

  describe('agent teams workflow section', () => {
    it('is included when agentTeams is true', () => {
      const ctx = makeContext({ claude: { enabled: true, agentTeams: true } });
      const result = generateClaudeMd(ctx);
      expect(result).toContain('## Agent Teams Workflow');
    });

    it('is not included when agentTeams is false', () => {
      const ctx = makeContext({ claude: { enabled: true, agentTeams: false } });
      const result = generateClaudeMd(ctx);
      expect(result).not.toContain('## Agent Teams Workflow');
    });

    it('includes prd.json as task source', () => {
      const ctx = makeContext({ claude: { enabled: true, agentTeams: true } });
      const result = generateClaudeMd(ctx);
      expect(result).toContain('prd.json');
    });
  });

  describe('development workflow section', () => {
    it('includes commit convention', () => {
      const result = generateClaudeMd(makeContext());
      expect(result).toContain('## Development Workflow');
      expect(result).toContain('feat:');
    });

    it('includes file naming conventions', () => {
      const result = generateClaudeMd(makeContext());
      expect(result).toContain('snake_case.dart');
    });

    it('includes important paths', () => {
      const result = generateClaudeMd(makeContext());
      expect(result).toContain('app_router.dart');
      expect(result).toContain('app_providers.dart');
      expect(result).toContain('pubspec.yaml');
    });
  });

  describe('slim format constraints', () => {
    it('stays <= 100 lines with all modules enabled', () => {
      const ctx = makeContext({
        modules: {
          auth: { provider: 'firebase' },
          api: { baseUrl: 'https://api.example.com' },
          database: { engine: 'drift' },
          i18n: { defaultLocale: 'en', supportedLocales: ['en', 'de'] },
          theme: { seedColor: '#6750A4', darkMode: true },
          push: { provider: 'firebase' },
          analytics: { enabled: true },
          cicd: { provider: 'github' },
          deepLinking: { scheme: 'app', host: 'example.com' },
        },
        claude: { enabled: true, agentTeams: true },
      });
      const result = generateClaudeMd(ctx);
      expect(result.split('\n').length).toBeLessThanOrEqual(100);
    });

    it('does not include inline tech stack or architecture sections', () => {
      const result = generateClaudeMd(makeContext());
      expect(result).not.toContain('## Tech Stack');
      expect(result).not.toContain('## Architecture Rules');
      expect(result).not.toContain('## Riverpod Patterns');
      expect(result).not.toContain('## go_router Patterns');
    });
  });
});
