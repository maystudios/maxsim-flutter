import { generatePrd } from '../../src/claude-setup/prd-generator.js';
import { makeTestContext } from '../helpers/context-factory.js';
import type { ProjectContext } from '../../src/core/context.js';

function makePrdContext(moduleOverrides: Partial<ProjectContext['modules']> = {}): ProjectContext {
  return makeTestContext({
    projectName: 'test_app',
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
      ...moduleOverrides,
    },
  });
}

function parsePrd(json: string) {
  return JSON.parse(json) as {
    version: string;
    project: string;
    stories: Array<{
      id: string;
      phase: number;
      priority: string;
      title: string;
      description: string;
      acceptanceCriteria: string[];
      passes: boolean;
    }>;
  };
}

describe('generatePrd', () => {
  describe('base structure', () => {
    it('returns valid JSON with version, project, and stories', () => {
      const result = generatePrd(makePrdContext());
      const prd = parsePrd(result);

      expect(prd.version).toBe('1.0.0');
      expect(prd.project).toBe('test_app');
      expect(Array.isArray(prd.stories)).toBe(true);
    });

    it('ends with a newline', () => {
      const result = generatePrd(makePrdContext());
      expect(result.endsWith('\n')).toBe(true);
    });

    it('assigns sequential IDs starting from S-001', () => {
      const prd = parsePrd(generatePrd(makePrdContext()));
      expect(prd.stories[0].id).toBe('S-001');
      expect(prd.stories[1].id).toBe('S-002');
    });

    it('all stories have passes: false', () => {
      const prd = parsePrd(generatePrd(makePrdContext()));
      for (const story of prd.stories) {
        expect(story.passes).toBe(false);
      }
    });
  });

  describe('phase 1 stories (always present)', () => {
    it('generates 4 phase-1 stories for base project', () => {
      const prd = parsePrd(generatePrd(makePrdContext()));
      const phase1 = prd.stories.filter((s) => s.phase === 1);
      expect(phase1).toHaveLength(4);
    });

    it('includes project name in home screen story', () => {
      const prd = parsePrd(generatePrd(makePrdContext()));
      const homeStory = prd.stories.find((s) => s.title.includes('home screen'));
      expect(homeStory?.title).toContain('test_app');
    });
  });

  describe('phase 2 stories — auth module', () => {
    it('generates auth story for firebase provider', () => {
      const prd = parsePrd(generatePrd(makePrdContext({ auth: { provider: 'firebase' } })));
      const authStory = prd.stories.find((s) => s.title.includes('authentication'));
      expect(authStory).toBeDefined();
      expect(authStory!.title).toContain('Firebase Auth');
      expect(authStory!.description).toContain('FirebaseAuthDataSource');
    });

    it('generates auth story for supabase provider', () => {
      const prd = parsePrd(generatePrd(makePrdContext({ auth: { provider: 'supabase' } })));
      const authStory = prd.stories.find((s) => s.title.includes('authentication'));
      expect(authStory!.title).toContain('Supabase Auth');
      expect(authStory!.description).toContain('SupabaseAuthDataSource');
    });

    it('generates auth story for custom provider', () => {
      const prd = parsePrd(generatePrd(makePrdContext({ auth: { provider: 'custom' } })));
      const authStory = prd.stories.find((s) => s.title.includes('authentication'));
      expect(authStory!.title).toContain('custom auth');
      expect(authStory!.description).toContain('CustomAuthDataSource');
    });
  });

  describe('phase 2 stories — api module', () => {
    it('generates API story with custom baseUrl', () => {
      const prd = parsePrd(generatePrd(makePrdContext({ api: { baseUrl: 'https://api.example.com' } })));
      const apiStory = prd.stories.find((s) => s.title.includes('API client'));
      expect(apiStory).toBeDefined();
      expect(apiStory!.description).toContain('https://api.example.com');
    });

    it('generates API story with fallback baseUrl when not provided', () => {
      const prd = parsePrd(generatePrd(makePrdContext({ api: {} })));
      const apiStory = prd.stories.find((s) => s.title.includes('API client'));
      expect(apiStory!.description).toContain('API_BASE_URL env variable');
    });
  });

  describe('phase 2 stories — database module', () => {
    it('generates database story for drift engine', () => {
      const prd = parsePrd(generatePrd(makePrdContext({ database: { engine: 'drift' } })));
      const dbStory = prd.stories.find((s) => s.title.includes('local database'));
      expect(dbStory!.title).toContain('Drift (SQLite)');
      const driftCriteria = dbStory!.acceptanceCriteria.find((c) => c.includes('AppDatabase'));
      expect(driftCriteria).toBeDefined();
    });

    it('generates database story for hive engine', () => {
      const prd = parsePrd(generatePrd(makePrdContext({ database: { engine: 'hive' } })));
      const dbStory = prd.stories.find((s) => s.title.includes('local database'));
      expect(dbStory!.title).toContain('Hive');
      const hiveCriteria = dbStory!.acceptanceCriteria.find((c) => c.includes('Hive'));
      expect(hiveCriteria).toBeDefined();
    });

    it('generates database story for isar engine', () => {
      const prd = parsePrd(generatePrd(makePrdContext({ database: { engine: 'isar' } })));
      const dbStory = prd.stories.find((s) => s.title.includes('local database'));
      expect(dbStory!.title).toContain('Isar');
    });
  });

  describe('phase 2 stories — i18n module', () => {
    it('generates i18n story with locale info', () => {
      const prd = parsePrd(generatePrd(makePrdContext({
        i18n: { defaultLocale: 'en', supportedLocales: ['en', 'de', 'fr'] },
      })));
      const i18nStory = prd.stories.find((s) => s.title.includes('internationalization'));
      expect(i18nStory).toBeDefined();
      expect(i18nStory!.description).toContain('en, de, fr');
      expect(i18nStory!.description).toContain('default: en');
    });
  });

  describe('phase 2 stories — theme module', () => {
    it('generates theme story with seed color and dark mode', () => {
      const prd = parsePrd(generatePrd(makePrdContext({
        theme: { seedColor: '#6750A4', darkMode: true },
      })));
      const themeStory = prd.stories.find((s) => s.title.includes('Material 3 theme'));
      expect(themeStory).toBeDefined();
      expect(themeStory!.description).toContain('seed color #6750A4');
      expect(themeStory!.description).toContain('Support both light and dark themes');
      const darkCriteria = themeStory!.acceptanceCriteria.find((c) => c.includes('AppTheme.dark()'));
      expect(darkCriteria).toBeDefined();
    });

    it('generates theme story without dark mode', () => {
      const prd = parsePrd(generatePrd(makePrdContext({
        theme: { darkMode: false },
      })));
      const themeStory = prd.stories.find((s) => s.title.includes('Material 3 theme'));
      expect(themeStory!.description).toContain('Light theme only');
      expect(themeStory!.description).toContain('default purple seed color');
      const lightCriteria = themeStory!.acceptanceCriteria.find((c) => c.includes('Light theme applied'));
      expect(lightCriteria).toBeDefined();
    });

    it('generates theme story with seedColor but no dark mode', () => {
      const prd = parsePrd(generatePrd(makePrdContext({
        theme: { seedColor: '#FF0000', darkMode: false },
      })));
      const themeStory = prd.stories.find((s) => s.title.includes('Material 3 theme'));
      expect(themeStory!.description).toContain('seed color #FF0000');
      expect(themeStory!.description).toContain('Light theme only');
    });
  });

  describe('phase 2 stories — push module', () => {
    it('generates push story for firebase provider', () => {
      const prd = parsePrd(generatePrd(makePrdContext({
        push: { provider: 'firebase' },
      })));
      const pushStory = prd.stories.find((s) => s.title.includes('push notifications'));
      expect(pushStory!.title).toContain('Firebase Cloud Messaging');
    });

    it('generates push story for onesignal provider', () => {
      const prd = parsePrd(generatePrd(makePrdContext({
        push: { provider: 'onesignal' },
      })));
      const pushStory = prd.stories.find((s) => s.title.includes('push notifications'));
      expect(pushStory!.title).toContain('OneSignal');
    });
  });

  describe('phase 2 stories — analytics module', () => {
    it('generates analytics story', () => {
      const prd = parsePrd(generatePrd(makePrdContext({
        analytics: { enabled: true },
      })));
      const analyticsStory = prd.stories.find((s) => s.title.includes('analytics'));
      expect(analyticsStory).toBeDefined();
      expect(analyticsStory!.phase).toBe(2);
    });
  });

  describe('phase 2 stories — cicd module', () => {
    it('generates cicd story for github provider', () => {
      const prd = parsePrd(generatePrd(makePrdContext({
        cicd: { provider: 'github' },
      })));
      const cicdStory = prd.stories.find((s) => s.title.includes('CI/CD'));
      expect(cicdStory!.title).toContain('Github');
      const criterion = cicdStory!.acceptanceCriteria.find((c) => c.includes('.github/workflows'));
      expect(criterion).toBeDefined();
    });

    it('generates cicd story for gitlab provider', () => {
      const prd = parsePrd(generatePrd(makePrdContext({
        cicd: { provider: 'gitlab' },
      })));
      const cicdStory = prd.stories.find((s) => s.title.includes('CI/CD'));
      expect(cicdStory!.title).toContain('Gitlab');
      const criterion = cicdStory!.acceptanceCriteria.find((c) => c.includes('.gitlab-ci.yml'));
      expect(criterion).toBeDefined();
    });

    it('generates cicd story for bitbucket provider', () => {
      const prd = parsePrd(generatePrd(makePrdContext({
        cicd: { provider: 'bitbucket' },
      })));
      const cicdStory = prd.stories.find((s) => s.title.includes('CI/CD'));
      expect(cicdStory!.title).toContain('Bitbucket');
      const criterion = cicdStory!.acceptanceCriteria.find((c) => c.includes('bitbucket-pipelines.yml'));
      expect(criterion).toBeDefined();
    });
  });

  describe('phase 2 stories — deep linking module', () => {
    it('generates deep linking story with scheme and host', () => {
      const prd = parsePrd(generatePrd(makePrdContext({
        deepLinking: { scheme: 'myapp', host: 'example.com' },
      })));
      const dlStory = prd.stories.find((s) => s.title.includes('deep linking'));
      expect(dlStory).toBeDefined();
      expect(dlStory!.description).toContain('myapp://example.com');
      const schemeCriterion = dlStory!.acceptanceCriteria.find((c) => c.includes('myapp://'));
      expect(schemeCriterion).toBeDefined();
      const hostCriterion = dlStory!.acceptanceCriteria.find((c) => c.includes('example.com'));
      expect(hostCriterion).toBeDefined();
    });

    it('generates deep linking story without scheme and host', () => {
      const prd = parsePrd(generatePrd(makePrdContext({
        deepLinking: {},
      })));
      const dlStory = prd.stories.find((s) => s.title.includes('deep linking'));
      expect(dlStory!.description).toContain('app://example.com');
      const schemeCriterion = dlStory!.acceptanceCriteria.find((c) => c.includes('Deep link scheme is configured'));
      expect(schemeCriterion).toBeDefined();
      const hostCriterion = dlStory!.acceptanceCriteria.find((c) => c.includes('Host is configured in platform'));
      expect(hostCriterion).toBeDefined();
    });

    it('generates deep linking story with only scheme', () => {
      const prd = parsePrd(generatePrd(makePrdContext({
        deepLinking: { scheme: 'myapp' },
      })));
      const dlStory = prd.stories.find((s) => s.title.includes('deep linking'));
      // Without host, the link example falls back
      expect(dlStory!.description).toContain('app://example.com');
      const schemeCriterion = dlStory!.acceptanceCriteria.find((c) => c.includes('myapp://'));
      expect(schemeCriterion).toBeDefined();
    });
  });

  describe('phase 3 stories', () => {
    it('generates integration test story with module names when modules are enabled', () => {
      const prd = parsePrd(generatePrd(makePrdContext({
        auth: { provider: 'firebase' },
        api: { baseUrl: 'https://api.test.com' },
        database: { engine: 'drift' },
      })));
      const phase3 = prd.stories.filter((s) => s.phase === 3);
      const integrationStory = phase3.find((s) => s.title.includes('integration tests'));
      expect(integrationStory!.description).toContain('auth, api, database');
    });

    it('generates integration test story with basic flow when no modules enabled', () => {
      const prd = parsePrd(generatePrd(makePrdContext()));
      const integrationStory = prd.stories.find((s) => s.title.includes('integration tests'));
      expect(integrationStory!.description).toContain('Test home screen navigation and basic app flows');
    });

    it('always generates final quality audit story', () => {
      const prd = parsePrd(generatePrd(makePrdContext()));
      const auditStory = prd.stories.find((s) => s.title.includes('quality audit'));
      expect(auditStory).toBeDefined();
      expect(auditStory!.phase).toBe(3);
    });
  });

  describe('multi-module scenarios', () => {
    it('generates correct number of stories for all modules enabled', () => {
      const prd = parsePrd(generatePrd(makePrdContext({
        auth: { provider: 'firebase' },
        api: { baseUrl: 'https://api.test.com' },
        database: { engine: 'drift' },
        i18n: { defaultLocale: 'en', supportedLocales: ['en'] },
        theme: { seedColor: '#000', darkMode: true },
        push: { provider: 'firebase' },
        analytics: { enabled: true },
        cicd: { provider: 'github' },
        deepLinking: { scheme: 'app', host: 'test.com' },
      })));

      // 4 phase-1 + 9 phase-2 (one per module) + 2 phase-3 = 15
      expect(prd.stories).toHaveLength(15);
    });

    it('IDs remain sequential regardless of module count', () => {
      const prd = parsePrd(generatePrd(makePrdContext({
        auth: { provider: 'firebase' },
        theme: { darkMode: true },
      })));

      for (let i = 0; i < prd.stories.length; i++) {
        expect(prd.stories[i].id).toBe(`S-${String(i + 1).padStart(3, '0')}`);
      }
    });
  });
});
