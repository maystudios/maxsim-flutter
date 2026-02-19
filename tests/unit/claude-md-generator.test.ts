import { generateClaudeMd } from '../../src/claude-setup/claude-md-generator.js';
import type { ProjectContext } from '../../src/core/context.js';

function makeContext(overrides: Partial<ProjectContext> = {}): ProjectContext {
  return {
    projectName: 'my_app',
    orgId: 'com.example',
    description: 'A test Flutter app',
    platforms: ['android', 'ios'],
    modules: {
      auth: false,
      api: false,
      database: false,
      i18n: false,
      theme: false,
      push: false,
      analytics: false,
      cicd: false,
      deepLinking: false,
    },
    scaffold: {
      dryRun: false,
      overwrite: 'ask',
      postProcessors: {
        dartFormat: true,
        flutterPubGet: true,
        buildRunner: true,
      },
    },
    claude: {
      enabled: true,
      agentTeams: false,
    },
    outputDir: '/tmp/my_app',
    rawConfig: {} as ProjectContext['rawConfig'],
    ...overrides,
  };
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
      expect(result).toContain('**Active modules:** Auth, API');
    });

    it('does not show active modules line when none enabled', () => {
      const result = generateClaudeMd(makeContext());
      expect(result).not.toContain('**Active modules:**');
    });
  });

  describe('tech stack section', () => {
    it('always includes core dependencies', () => {
      const result = generateClaudeMd(makeContext());
      expect(result).toContain('flutter_riverpod');
      expect(result).toContain('go_router');
      expect(result).toContain('freezed');
    });

    it('includes Dio when api module is enabled', () => {
      const ctx = makeContext({
        modules: { ...makeContext().modules, api: { baseUrl: 'https://api.test.com' } },
      });
      const result = generateClaudeMd(ctx);
      expect(result).toContain('Dio');
    });

    it('includes database engine when database module is enabled', () => {
      const ctx = makeContext({
        modules: { ...makeContext().modules, database: { engine: 'drift' } },
      });
      const result = generateClaudeMd(ctx);
      expect(result).toContain('Drift (SQLite)');
    });

    it('includes auth provider when auth module is enabled', () => {
      const ctx = makeContext({
        modules: { ...makeContext().modules, auth: { provider: 'supabase' } },
      });
      const result = generateClaudeMd(ctx);
      expect(result).toContain('Supabase Auth');
    });
  });

  describe('architecture rules section', () => {
    it('includes Clean Architecture layer descriptions', () => {
      const result = generateClaudeMd(makeContext());
      expect(result).toContain('## Architecture Rules (Clean Architecture)');
      expect(result).toContain('domain/');
      expect(result).toContain('data/');
      expect(result).toContain('presentation/');
    });

    it('includes import rules', () => {
      const result = generateClaudeMd(makeContext());
      expect(result).toContain('domain/` must NOT import from `data/`');
    });
  });

  describe('riverpod patterns section', () => {
    it('includes Riverpod provider types and conventions', () => {
      const result = generateClaudeMd(makeContext());
      expect(result).toContain('## Riverpod Patterns');
      expect(result).toContain('ref.watch()');
      expect(result).toContain('ref.read()');
      expect(result).toContain('AsyncNotifier');
    });
  });

  describe('go_router patterns section', () => {
    it('includes go_router conventions', () => {
      const result = generateClaudeMd(makeContext());
      expect(result).toContain('## go_router Patterns');
      expect(result).toContain('TypedGoRoute');
      expect(result).toContain('goNamed');
    });
  });

  describe('module-specific sections', () => {
    it('includes auth section when auth is enabled', () => {
      const ctx = makeContext({
        modules: { ...makeContext().modules, auth: { provider: 'firebase' } },
      });
      const result = generateClaudeMd(ctx);
      expect(result).toContain('## Auth Module');
      expect(result).toContain('Firebase Auth');
      expect(result).toContain('lib/features/auth/');
    });

    it('includes supabase-specific note for supabase auth', () => {
      const ctx = makeContext({
        modules: { ...makeContext().modules, auth: { provider: 'supabase' } },
      });
      const result = generateClaudeMd(ctx);
      expect(result).toContain('Supabase URL');
    });

    it('includes custom auth note', () => {
      const ctx = makeContext({
        modules: { ...makeContext().modules, auth: { provider: 'custom' } },
      });
      const result = generateClaudeMd(ctx);
      expect(result).toContain('custom auth');
    });

    it('includes API section with base URL when configured', () => {
      const ctx = makeContext({
        modules: { ...makeContext().modules, api: { baseUrl: 'https://api.example.com' } },
      });
      const result = generateClaudeMd(ctx);
      expect(result).toContain('## API Module');
      expect(result).toContain('https://api.example.com');
    });

    it('includes API section with env var note when no base URL', () => {
      const ctx = makeContext({
        modules: { ...makeContext().modules, api: {} },
      });
      const result = generateClaudeMd(ctx);
      expect(result).toContain('## API Module');
      expect(result).toContain('API_BASE_URL');
    });

    it('includes database section with engine name', () => {
      const ctx = makeContext({
        modules: { ...makeContext().modules, database: { engine: 'hive' } },
      });
      const result = generateClaudeMd(ctx);
      expect(result).toContain('## Database Module');
      expect(result).toContain('Hive');
    });

    it('includes i18n section with locales', () => {
      const ctx = makeContext({
        modules: {
          ...makeContext().modules,
          i18n: { defaultLocale: 'en', supportedLocales: ['en', 'de', 'fr'] },
        },
      });
      const result = generateClaudeMd(ctx);
      expect(result).toContain('## Internationalization (i18n) Module');
      expect(result).toContain('en');
      expect(result).toContain('en, de, fr');
    });

    it('includes theme section with dark mode enabled', () => {
      const ctx = makeContext({
        modules: {
          ...makeContext().modules,
          theme: { seedColor: '#FF5733', darkMode: true },
        },
      });
      const result = generateClaudeMd(ctx);
      expect(result).toContain('## Theme Module');
      expect(result).toContain('#FF5733');
      expect(result).toContain('Dark mode: Enabled');
    });

    it('includes theme section with dark mode disabled', () => {
      const ctx = makeContext({
        modules: {
          ...makeContext().modules,
          theme: { darkMode: false },
        },
      });
      const result = generateClaudeMd(ctx);
      expect(result).toContain('Dark mode: Disabled');
    });

    it('includes push section for firebase', () => {
      const ctx = makeContext({
        modules: { ...makeContext().modules, push: { provider: 'firebase' } },
      });
      const result = generateClaudeMd(ctx);
      expect(result).toContain('## Push Notifications Module');
      expect(result).toContain('Firebase Cloud Messaging');
    });

    it('includes push section for onesignal', () => {
      const ctx = makeContext({
        modules: { ...makeContext().modules, push: { provider: 'onesignal' } },
      });
      const result = generateClaudeMd(ctx);
      expect(result).toContain('OneSignal');
    });

    it('includes analytics section', () => {
      const ctx = makeContext({
        modules: { ...makeContext().modules, analytics: { enabled: true } },
      });
      const result = generateClaudeMd(ctx);
      expect(result).toContain('## Analytics Module');
      expect(result).toContain('AnalyticsService');
    });

    it('includes cicd section for github', () => {
      const ctx = makeContext({
        modules: { ...makeContext().modules, cicd: { provider: 'github' } },
      });
      const result = generateClaudeMd(ctx);
      expect(result).toContain('## CI/CD Module');
      expect(result).toContain('GitHub Actions');
      expect(result).toContain('.github/workflows/');
    });

    it('includes cicd section for gitlab', () => {
      const ctx = makeContext({
        modules: { ...makeContext().modules, cicd: { provider: 'gitlab' } },
      });
      const result = generateClaudeMd(ctx);
      expect(result).toContain('GitLab CI');
    });

    it('includes cicd section for bitbucket', () => {
      const ctx = makeContext({
        modules: { ...makeContext().modules, cicd: { provider: 'bitbucket' } },
      });
      const result = generateClaudeMd(ctx);
      expect(result).toContain('Bitbucket Pipelines');
    });

    it('includes deep linking section', () => {
      const ctx = makeContext({
        modules: { ...makeContext().modules, deepLinking: { scheme: 'myapp', host: 'example.com' } },
      });
      const result = generateClaudeMd(ctx);
      expect(result).toContain('## Deep Linking Module');
      expect(result).toContain('app_links');
    });

    it('does not include module sections for disabled modules', () => {
      const result = generateClaudeMd(makeContext());
      expect(result).not.toContain('## Auth Module');
      expect(result).not.toContain('## API Module');
      expect(result).not.toContain('## Database Module');
      expect(result).not.toContain('## Internationalization');
      expect(result).not.toContain('## Theme Module');
      expect(result).not.toContain('## Push Notifications');
      expect(result).not.toContain('## Analytics Module');
      expect(result).not.toContain('## CI/CD Module');
      expect(result).not.toContain('## Deep Linking Module');
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
      expect(result).toContain('flutter build');
    });
  });

  describe('agent teams workflow section', () => {
    it('is included when agentTeams is true', () => {
      const ctx = makeContext({ claude: { enabled: true, agentTeams: true } });
      const result = generateClaudeMd(ctx);
      expect(result).toContain('## Agent Teams Workflow');
      expect(result).toContain('Architect');
      expect(result).toContain('Builder');
      expect(result).toContain('Tester');
      expect(result).toContain('Reviewer');
    });

    it('is not included when agentTeams is false', () => {
      const ctx = makeContext({ claude: { enabled: true, agentTeams: false } });
      const result = generateClaudeMd(ctx);
      expect(result).not.toContain('## Agent Teams Workflow');
    });

    it('mentions active modules in teams context', () => {
      const ctx = makeContext({
        claude: { enabled: true, agentTeams: true },
        modules: {
          ...makeContext().modules,
          auth: { provider: 'firebase' },
          api: { baseUrl: 'https://api.test.com' },
        },
      });
      const result = generateClaudeMd(ctx);
      expect(result).toContain('Auth, API');
      expect(result).toContain('module boundaries');
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
      expect(result).toContain('fix:');
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

  describe('full generation with all modules', () => {
    it('generates complete CLAUDE.md with all modules enabled', () => {
      const ctx = makeContext({
        projectName: 'full_app',
        description: 'A fully-featured Flutter application',
        platforms: ['android', 'ios', 'web'],
        modules: {
          auth: { provider: 'firebase' },
          api: { baseUrl: 'https://api.full-app.com' },
          database: { engine: 'drift' },
          i18n: { defaultLocale: 'en', supportedLocales: ['en', 'de'] },
          theme: { seedColor: '#6750A4', darkMode: true },
          push: { provider: 'firebase' },
          analytics: { enabled: true },
          cicd: { provider: 'github' },
          deepLinking: { scheme: 'fullapp', host: 'full-app.com' },
        },
        claude: { enabled: true, agentTeams: true },
      });

      const result = generateClaudeMd(ctx);

      // All major sections present
      expect(result).toContain('# CLAUDE.md - full_app');
      expect(result).toContain('## Tech Stack');
      expect(result).toContain('## Architecture Rules');
      expect(result).toContain('## Riverpod Patterns');
      expect(result).toContain('## go_router Patterns');
      expect(result).toContain('## Auth Module');
      expect(result).toContain('## API Module');
      expect(result).toContain('## Database Module');
      expect(result).toContain('## Internationalization (i18n) Module');
      expect(result).toContain('## Theme Module');
      expect(result).toContain('## Push Notifications Module');
      expect(result).toContain('## Analytics Module');
      expect(result).toContain('## CI/CD Module');
      expect(result).toContain('## Deep Linking Module');
      expect(result).toContain('## Quality Gates');
      expect(result).toContain('## Build Commands');
      expect(result).toContain('## Agent Teams Workflow');
      expect(result).toContain('## Development Workflow');
    });
  });
});
