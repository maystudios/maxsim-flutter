import { generateArchitectureDoc } from '../../src/plan/architecture-generator.js';
import { makeTestContext } from '../helpers/context-factory.js';
import type { ProjectContext } from '../../src/core/context.js';

function makeArchContext(moduleOverrides: Partial<ProjectContext['modules']> = {}): ProjectContext {
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

describe('generateArchitectureDoc', () => {
  describe('document structure', () => {
    it('returns a markdown heading for architecture', () => {
      const result = generateArchitectureDoc(makeArchContext());
      expect(result).toContain('# Architecture');
    });

    it('ends with a newline', () => {
      const result = generateArchitectureDoc(makeArchContext());
      expect(result.endsWith('\n')).toBe(true);
    });

    it('includes tech stack section', () => {
      const result = generateArchitectureDoc(makeArchContext());
      expect(result).toContain('## Tech Stack');
    });

    it('includes module architecture section', () => {
      const result = generateArchitectureDoc(makeArchContext());
      expect(result).toContain('## Module Architecture');
    });

    it('includes provider tree section', () => {
      const result = generateArchitectureDoc(makeArchContext());
      expect(result).toContain('## Provider Tree');
    });

    it('includes navigation flow section', () => {
      const result = generateArchitectureDoc(makeArchContext());
      expect(result).toContain('## Navigation Flow');
    });
  });

  describe('tech stack — core entries always present', () => {
    it('always includes Flutter in tech stack', () => {
      const result = generateArchitectureDoc(makeArchContext());
      expect(result).toContain('Flutter');
    });

    it('always includes Riverpod in tech stack', () => {
      const result = generateArchitectureDoc(makeArchContext());
      expect(result).toContain('Riverpod');
    });

    it('always includes go_router in tech stack', () => {
      const result = generateArchitectureDoc(makeArchContext());
      expect(result).toContain('go_router');
    });
  });

  describe('tech stack — module-conditional entries', () => {
    it('includes Firebase when auth provider is firebase', () => {
      const result = generateArchitectureDoc(makeArchContext({ auth: { provider: 'firebase' } }));
      expect(result).toContain('Firebase');
    });

    it('includes Supabase when auth provider is supabase', () => {
      const result = generateArchitectureDoc(makeArchContext({ auth: { provider: 'supabase' } }));
      expect(result).toContain('Supabase');
    });

    it('includes Drift when database engine is drift', () => {
      const result = generateArchitectureDoc(makeArchContext({ database: { engine: 'drift' } }));
      expect(result).toContain('Drift');
    });

    it('includes Hive when database engine is hive', () => {
      const result = generateArchitectureDoc(makeArchContext({ database: { engine: 'hive' } }));
      expect(result).toContain('Hive');
    });

    it('includes Isar when database engine is isar', () => {
      const result = generateArchitectureDoc(makeArchContext({ database: { engine: 'isar' } }));
      expect(result).toContain('Isar');
    });
  });

  describe('provider tree ASCII diagram', () => {
    it('always includes ProviderScope as root', () => {
      const result = generateArchitectureDoc(makeArchContext());
      expect(result).toContain('ProviderScope');
    });

    it('always includes routerProvider', () => {
      const result = generateArchitectureDoc(makeArchContext());
      expect(result).toContain('routerProvider');
    });

    it('renders ASCII tree characters', () => {
      const result = generateArchitectureDoc(makeArchContext());
      const hasTreeChars =
        result.includes('└──') || result.includes('├──') || result.includes('│');
      expect(hasTreeChars).toBe(true);
    });

    it('includes authRepositoryProvider when auth is enabled', () => {
      const result = generateArchitectureDoc(makeArchContext({ auth: { provider: 'firebase' } }));
      expect(result).toContain('authRepositoryProvider');
    });

    it('does not include authRepositoryProvider when auth is disabled', () => {
      const result = generateArchitectureDoc(makeArchContext());
      expect(result).not.toContain('authRepositoryProvider');
    });

    it('includes dioClientProvider when api is enabled', () => {
      const result = generateArchitectureDoc(makeArchContext({ api: {} }));
      expect(result).toContain('dioClientProvider');
    });

    it('does not include dioClientProvider when api is disabled', () => {
      const result = generateArchitectureDoc(makeArchContext());
      expect(result).not.toContain('dioClientProvider');
    });

    it('includes databaseProvider when database is enabled', () => {
      const result = generateArchitectureDoc(makeArchContext({ database: { engine: 'drift' } }));
      expect(result).toContain('databaseProvider');
    });

    it('does not include databaseProvider when database is disabled', () => {
      const result = generateArchitectureDoc(makeArchContext());
      expect(result).not.toContain('databaseProvider');
    });

    it('includes analyticsServiceProvider when analytics is enabled', () => {
      const result = generateArchitectureDoc(makeArchContext({ analytics: { enabled: true } }));
      expect(result).toContain('analyticsServiceProvider');
    });

    it('includes pushTokenProvider when push is enabled', () => {
      const result = generateArchitectureDoc(makeArchContext({ push: { provider: 'firebase' } }));
      expect(result).toContain('pushTokenProvider');
    });
  });

  describe('navigation flow ASCII diagram', () => {
    it('always includes root route /', () => {
      const result = generateArchitectureDoc(makeArchContext());
      expect(result).toContain('/');
    });

    it('includes /login route when auth module is enabled', () => {
      const result = generateArchitectureDoc(makeArchContext({ auth: { provider: 'firebase' } }));
      expect(result).toContain('/login');
    });

    it('includes /register route when auth module is enabled', () => {
      const result = generateArchitectureDoc(makeArchContext({ auth: { provider: 'supabase' } }));
      expect(result).toContain('/register');
    });

    it('does not include /login when auth module is disabled', () => {
      const result = generateArchitectureDoc(makeArchContext());
      expect(result).not.toContain('/login');
    });
  });

  describe('database schema section', () => {
    it('includes database schema section when database module is enabled', () => {
      const result = generateArchitectureDoc(makeArchContext({ database: { engine: 'drift' } }));
      expect(result).toContain('## Database Schema');
    });

    it('does not include database schema section when database is disabled', () => {
      const result = generateArchitectureDoc(makeArchContext());
      expect(result).not.toContain('## Database Schema');
    });

    it('mentions drift engine in schema section', () => {
      const result = generateArchitectureDoc(makeArchContext({ database: { engine: 'drift' } }));
      const schemaStart = result.indexOf('## Database Schema');
      const schemaSection = result.slice(schemaStart);
      expect(schemaSection.toLowerCase()).toContain('drift');
    });

    it('mentions isar engine in schema section', () => {
      const result = generateArchitectureDoc(makeArchContext({ database: { engine: 'isar' } }));
      const schemaStart = result.indexOf('## Database Schema');
      const schemaSection = result.slice(schemaStart);
      expect(schemaSection.toLowerCase()).toContain('isar');
    });

    it('mentions hive engine in schema section', () => {
      const result = generateArchitectureDoc(makeArchContext({ database: { engine: 'hive' } }));
      const schemaStart = result.indexOf('## Database Schema');
      const schemaSection = result.slice(schemaStart);
      expect(schemaSection.toLowerCase()).toContain('hive');
    });
  });

  describe('module architecture overview', () => {
    it('lists auth module when auth is enabled', () => {
      const result = generateArchitectureDoc(makeArchContext({ auth: { provider: 'firebase' } }));
      const moduleStart = result.indexOf('## Module Architecture');
      const moduleSection = result.slice(moduleStart);
      expect(moduleSection).toContain('auth');
    });

    it('lists api module when api is enabled', () => {
      const result = generateArchitectureDoc(makeArchContext({ api: {} }));
      const moduleStart = result.indexOf('## Module Architecture');
      const moduleSection = result.slice(moduleStart);
      expect(moduleSection).toContain('api');
    });

    it('does not list disabled modules in architecture overview', () => {
      const result = generateArchitectureDoc(makeArchContext());
      const moduleStart = result.indexOf('## Module Architecture');
      const moduleSection = result.slice(moduleStart, result.indexOf('\n##', moduleStart + 5));
      // When no modules enabled, should say "core only" or similar, not list module names
      expect(moduleSection).not.toContain('authRepositoryProvider');
    });
  });

  describe('full modules scenario', () => {
    it('generates all sections when all modules are enabled', () => {
      const result = generateArchitectureDoc(
        makeArchContext({
          auth: { provider: 'firebase' },
          api: { baseUrl: 'https://api.example.com' },
          database: { engine: 'drift' },
          i18n: { defaultLocale: 'en', supportedLocales: ['en'] },
          theme: { darkMode: true },
          push: { provider: 'firebase' },
          analytics: { enabled: true },
          cicd: { provider: 'github' },
          deepLinking: { scheme: 'myapp', host: 'example.com' },
        }),
      );
      expect(result).toContain('## Tech Stack');
      expect(result).toContain('## Module Architecture');
      expect(result).toContain('## Provider Tree');
      expect(result).toContain('## Navigation Flow');
      expect(result).toContain('## Database Schema');
    });

    it('includes all conditional providers for all modules', () => {
      const result = generateArchitectureDoc(
        makeArchContext({
          auth: { provider: 'firebase' },
          api: { baseUrl: 'https://api.example.com' },
          database: { engine: 'drift' },
          push: { provider: 'firebase' },
          analytics: { enabled: true },
        }),
      );
      expect(result).toContain('authRepositoryProvider');
      expect(result).toContain('dioClientProvider');
      expect(result).toContain('databaseProvider');
      expect(result).toContain('pushTokenProvider');
      expect(result).toContain('analyticsServiceProvider');
    });

    it('includes all auth routes when auth is enabled alongside all modules', () => {
      const result = generateArchitectureDoc(
        makeArchContext({
          auth: { provider: 'firebase' },
          api: {},
          database: { engine: 'hive' },
        }),
      );
      expect(result).toContain('/login');
      expect(result).toContain('/register');
    });
  });

  describe('minimal scenario', () => {
    it('generates minimal document without database schema when no modules enabled', () => {
      const result = generateArchitectureDoc(makeArchContext());
      expect(result).not.toContain('## Database Schema');
    });

    it('generates valid document with only core sections when no modules enabled', () => {
      const result = generateArchitectureDoc(makeArchContext());
      expect(result).toContain('## Tech Stack');
      expect(result).toContain('## Module Architecture');
      expect(result).toContain('## Provider Tree');
      expect(result).toContain('## Navigation Flow');
    });
  });
});
