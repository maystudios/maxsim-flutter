import { ModuleComposer, pickNewerVersion } from '../../src/modules/composer.js';
import type { ModuleManifest } from '../../src/types/module.js';
import type { ProjectContext } from '../../src/core/context.js';
import { makeTestContext } from '../helpers/context-factory.js';

function makeManifest(overrides: Partial<ModuleManifest> = {}): ModuleManifest {
  return {
    id: 'test-module',
    name: 'Test Module',
    description: 'A test module',
    requires: [],
    templateDir: 'templates/modules/test-module',
    ralphPhase: 2,
    contributions: {},
    ...overrides,
  };
}

function makeContext(overrides: Partial<Parameters<typeof makeTestContext>[0]> = {}) {
  return makeTestContext(overrides);
}

describe('pickNewerVersion', () => {
  it('picks the higher major version', () => {
    expect(pickNewerVersion('^1.0.0', '^2.0.0')).toBe('^2.0.0');
  });

  it('picks the higher minor version', () => {
    expect(pickNewerVersion('^2.3.0', '^2.6.1')).toBe('^2.6.1');
  });

  it('picks the higher patch version', () => {
    expect(pickNewerVersion('^2.6.0', '^2.6.1')).toBe('^2.6.1');
  });

  it('returns the first when versions are equal', () => {
    expect(pickNewerVersion('^1.0.0', '^1.0.0')).toBe('^1.0.0');
  });

  it('handles tilde prefix', () => {
    expect(pickNewerVersion('~1.2.0', '~1.3.0')).toBe('~1.3.0');
  });

  it('handles mixed prefixes (picks higher version regardless)', () => {
    expect(pickNewerVersion('^1.0.0', '~2.0.0')).toBe('~2.0.0');
  });

  it('handles versions with different segment lengths', () => {
    expect(pickNewerVersion('^1.0', '^1.0.1')).toBe('^1.0.1');
  });
});

describe('ModuleComposer', () => {
  let composer: ModuleComposer;
  let context: ProjectContext;

  beforeEach(() => {
    composer = new ModuleComposer();
    context = makeContext();
  });

  describe('compose()', () => {
    it('returns empty result for no modules', () => {
      const result = composer.compose([], context);

      expect(result.dependencies.size).toBe(0);
      expect(result.devDependencies.size).toBe(0);
      expect(result.providers).toHaveLength(0);
      expect(result.routes).toHaveLength(0);
      expect(result.envVars).toHaveLength(0);
    });

    it('collects dependencies from a single module', () => {
      const core = makeManifest({
        id: 'core',
        contributions: {
          pubspecDependencies: {
            'flutter_riverpod': '^2.6.1',
            'go_router': '^14.6.2',
          },
          pubspecDevDependencies: {
            'build_runner': '^2.4.13',
          },
        },
      });

      const result = composer.compose([core], context);

      expect(result.dependencies.get('flutter_riverpod')).toBe('^2.6.1');
      expect(result.dependencies.get('go_router')).toBe('^14.6.2');
      expect(result.devDependencies.get('build_runner')).toBe('^2.4.13');
    });

    it('merges dependencies from multiple modules', () => {
      const core = makeManifest({
        id: 'core',
        contributions: {
          pubspecDependencies: {
            'flutter_riverpod': '^2.6.1',
          },
        },
      });
      const api = makeManifest({
        id: 'api',
        contributions: {
          pubspecDependencies: {
            'dio': '^5.4.0',
          },
        },
      });

      const result = composer.compose([core, api], context);

      expect(result.dependencies.size).toBe(2);
      expect(result.dependencies.get('flutter_riverpod')).toBe('^2.6.1');
      expect(result.dependencies.get('dio')).toBe('^5.4.0');
    });

    it('deduplicates dependencies with newer version winning', () => {
      const moduleA = makeManifest({
        id: 'mod-a',
        contributions: {
          pubspecDependencies: {
            'json_annotation': '^4.8.0',
          },
        },
      });
      const moduleB = makeManifest({
        id: 'mod-b',
        contributions: {
          pubspecDependencies: {
            'json_annotation': '^4.9.0',
          },
        },
      });

      const result = composer.compose([moduleA, moduleB], context);

      expect(result.dependencies.get('json_annotation')).toBe('^4.9.0');
    });

    it('deduplicates dev dependencies with newer version winning', () => {
      const moduleA = makeManifest({
        id: 'mod-a',
        contributions: {
          pubspecDevDependencies: {
            'build_runner': '^2.3.0',
          },
        },
      });
      const moduleB = makeManifest({
        id: 'mod-b',
        contributions: {
          pubspecDevDependencies: {
            'build_runner': '^2.4.13',
          },
        },
      });

      const result = composer.compose([moduleA, moduleB], context);

      expect(result.devDependencies.get('build_runner')).toBe('^2.4.13');
    });

    it('keeps older version when it appears second', () => {
      const moduleA = makeManifest({
        id: 'mod-a',
        contributions: {
          pubspecDependencies: {
            'dio': '^5.4.0',
          },
        },
      });
      const moduleB = makeManifest({
        id: 'mod-b',
        contributions: {
          pubspecDependencies: {
            'dio': '^5.2.0',
          },
        },
      });

      const result = composer.compose([moduleA, moduleB], context);

      // ^5.4.0 is newer, so it wins even though ^5.2.0 was added second
      expect(result.dependencies.get('dio')).toBe('^5.4.0');
    });

    it('collects provider contributions', () => {
      const auth = makeManifest({
        id: 'auth',
        contributions: {
          providers: [
            { name: 'authRepositoryProvider', importPath: '../../features/auth/domain/auth_repository.dart' },
            { name: 'authStateProvider', importPath: '../../features/auth/presentation/auth_state.dart' },
          ],
        },
      });

      const result = composer.compose([auth], context);

      expect(result.providers).toHaveLength(2);
      expect(result.providers[0].name).toBe('authRepositoryProvider');
      expect(result.providers[1].name).toBe('authStateProvider');
    });

    it('collects providers from multiple modules', () => {
      const auth = makeManifest({
        id: 'auth',
        contributions: {
          providers: [
            { name: 'authProvider', importPath: '../../features/auth/auth.dart' },
          ],
        },
      });
      const api = makeManifest({
        id: 'api',
        contributions: {
          providers: [
            { name: 'apiClientProvider', importPath: '../../features/api/api_client.dart' },
          ],
        },
      });

      const result = composer.compose([auth, api], context);

      expect(result.providers).toHaveLength(2);
    });

    it('collects route contributions', () => {
      const auth = makeManifest({
        id: 'auth',
        contributions: {
          routes: [
            { path: '/login', name: 'login', importPath: '../../features/auth/presentation/login_page.dart' },
            { path: '/register', name: 'register', importPath: '../../features/auth/presentation/register_page.dart' },
          ],
        },
      });

      const result = composer.compose([auth], context);

      expect(result.routes).toHaveLength(2);
      expect(result.routes[0].path).toBe('/login');
      expect(result.routes[1].name).toBe('register');
    });

    it('collects environment variables', () => {
      const auth = makeManifest({
        id: 'auth',
        contributions: {
          envVars: ['FIREBASE_API_KEY', 'FIREBASE_PROJECT_ID'],
        },
      });

      const result = composer.compose([auth], context);

      expect(result.envVars).toContain('FIREBASE_API_KEY');
      expect(result.envVars).toContain('FIREBASE_PROJECT_ID');
    });

    it('deduplicates environment variables across modules', () => {
      const auth = makeManifest({
        id: 'auth',
        contributions: {
          envVars: ['FIREBASE_API_KEY', 'FIREBASE_PROJECT_ID'],
        },
      });
      const push = makeManifest({
        id: 'push',
        contributions: {
          envVars: ['FIREBASE_API_KEY', 'FCM_SERVER_KEY'],
        },
      });

      const result = composer.compose([auth, push], context);

      expect(result.envVars).toHaveLength(3);
      expect(result.envVars).toContain('FIREBASE_API_KEY');
      expect(result.envVars).toContain('FIREBASE_PROJECT_ID');
      expect(result.envVars).toContain('FCM_SERVER_KEY');
    });

    it('skips modules where isEnabled returns false', () => {
      const disabledModule = makeManifest({
        id: 'disabled',
        contributions: {
          pubspecDependencies: { 'some_dep': '^1.0.0' },
          providers: [{ name: 'disabledProvider', importPath: 'disabled.dart' }],
        },
        isEnabled: () => false,
      });
      const enabledModule = makeManifest({
        id: 'enabled',
        contributions: {
          pubspecDependencies: { 'other_dep': '^2.0.0' },
        },
      });

      const result = composer.compose([disabledModule, enabledModule], context);

      expect(result.dependencies.size).toBe(1);
      expect(result.dependencies.has('some_dep')).toBe(false);
      expect(result.dependencies.get('other_dep')).toBe('^2.0.0');
      expect(result.providers).toHaveLength(0);
    });

    it('includes modules where isEnabled returns true', () => {
      const mod = makeManifest({
        id: 'conditional',
        contributions: {
          pubspecDependencies: { 'cond_dep': '^1.0.0' },
        },
        isEnabled: () => true,
      });

      const result = composer.compose([mod], context);

      expect(result.dependencies.get('cond_dep')).toBe('^1.0.0');
    });

    it('includes modules without isEnabled predicate', () => {
      const mod = makeManifest({
        id: 'always',
        contributions: {
          pubspecDependencies: { 'always_dep': '^1.0.0' },
        },
      });

      const result = composer.compose([mod], context);

      expect(result.dependencies.get('always_dep')).toBe('^1.0.0');
    });

    it('handles modules with empty contributions', () => {
      const mod = makeManifest({
        id: 'empty',
        contributions: {},
      });

      const result = composer.compose([mod], context);

      expect(result.dependencies.size).toBe(0);
      expect(result.devDependencies.size).toBe(0);
      expect(result.providers).toHaveLength(0);
      expect(result.routes).toHaveLength(0);
      expect(result.envVars).toHaveLength(0);
    });

    it('composes a realistic multi-module scenario', () => {
      const core = makeManifest({
        id: 'core',
        contributions: {
          pubspecDependencies: {
            'flutter_riverpod': '^2.6.1',
            'go_router': '^14.6.2',
            'json_annotation': '^4.9.0',
          },
          pubspecDevDependencies: {
            'build_runner': '^2.4.13',
            'json_serializable': '^6.8.0',
          },
        },
      });
      const auth = makeManifest({
        id: 'auth',
        contributions: {
          pubspecDependencies: {
            'firebase_auth': '^5.3.1',
            'json_annotation': '^4.8.0', // older than core — core's should win
          },
          providers: [
            { name: 'authRepositoryProvider', importPath: '../../features/auth/domain/auth_repository.dart' },
          ],
          routes: [
            { path: '/login', name: 'login', importPath: '../../features/auth/presentation/login_page.dart' },
          ],
          envVars: ['FIREBASE_API_KEY'],
        },
      });
      const api = makeManifest({
        id: 'api',
        contributions: {
          pubspecDependencies: {
            'dio': '^5.4.0',
            'json_annotation': '^4.9.0', // same as core
          },
          pubspecDevDependencies: {
            'build_runner': '^2.4.13', // same as core
          },
          providers: [
            { name: 'apiClientProvider', importPath: '../../features/api/api_client.dart' },
          ],
          envVars: ['API_BASE_URL'],
        },
      });

      const result = composer.compose([core, auth, api], context);

      // Dependencies merged: 4 unique (flutter_riverpod, go_router, json_annotation, firebase_auth, dio)
      expect(result.dependencies.size).toBe(5);
      expect(result.dependencies.get('json_annotation')).toBe('^4.9.0'); // newer wins
      expect(result.dependencies.get('firebase_auth')).toBe('^5.3.1');
      expect(result.dependencies.get('dio')).toBe('^5.4.0');

      // Dev dependencies: 2 unique
      expect(result.devDependencies.size).toBe(2);

      // Providers from auth + api
      expect(result.providers).toHaveLength(2);

      // Routes from auth
      expect(result.routes).toHaveLength(1);
      expect(result.routes[0].path).toBe('/login');

      // Env vars from auth + api
      expect(result.envVars).toHaveLength(2);
      expect(result.envVars).toContain('FIREBASE_API_KEY');
      expect(result.envVars).toContain('API_BASE_URL');
    });
  });

  describe('formatPubspecDependencies()', () => {
    it('formats an empty map as empty string', () => {
      const result = composer.formatPubspecDependencies(new Map());
      expect(result).toBe('');
    });

    it('formats dependencies in alphabetical order', () => {
      const deps = new Map([
        ['go_router', '^14.6.2'],
        ['dio', '^5.4.0'],
        ['flutter_riverpod', '^2.6.1'],
      ]);

      const result = composer.formatPubspecDependencies(deps);

      expect(result).toBe(
        '  dio: ^5.4.0\n  flutter_riverpod: ^2.6.1\n  go_router: ^14.6.2',
      );
    });

    it('formats a single dependency', () => {
      const deps = new Map([['dio', '^5.4.0']]);
      const result = composer.formatPubspecDependencies(deps);
      expect(result).toBe('  dio: ^5.4.0');
    });
  });

  describe('generateAppProvidersBarrel()', () => {
    it('generates barrel with no additional providers', () => {
      const result = composer.generateAppProvidersBarrel([]);

      expect(result).toContain('// Barrel file for shared application providers.');
      expect(result).toContain("export '../router/app_router.dart';");
    });

    it('adds provider exports', () => {
      const providers = [
        { name: 'authRepositoryProvider', importPath: '../../features/auth/domain/auth_repository.dart' },
        { name: 'apiClientProvider', importPath: '../../features/api/api_client.dart' },
      ];

      const result = composer.generateAppProvidersBarrel(providers);

      expect(result).toContain("export '../../features/auth/domain/auth_repository.dart';");
      expect(result).toContain("export '../../features/api/api_client.dart';");
    });

    it('deduplicates provider exports by importPath', () => {
      const providers = [
        { name: 'providerA', importPath: '../../features/shared/shared.dart' },
        { name: 'providerB', importPath: '../../features/shared/shared.dart' },
      ];

      const result = composer.generateAppProvidersBarrel(providers);

      const occurrences = result.split("../../features/shared/shared.dart").length - 1;
      expect(occurrences).toBe(1);
    });

    it('does not duplicate the router export', () => {
      const providers = [
        { name: 'routerProvider', importPath: '../router/app_router.dart' },
      ];

      const result = composer.generateAppProvidersBarrel(providers);

      const occurrences = result.split("../router/app_router.dart").length - 1;
      expect(occurrences).toBe(1);
    });

    it('ends with a newline', () => {
      const result = composer.generateAppProvidersBarrel([]);
      expect(result.endsWith('\n')).toBe(true);
    });
  });
});
