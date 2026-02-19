import { ModuleRegistry } from '../../src/modules/registry.js';
import { ModuleResolver } from '../../src/modules/resolver.js';
import type { ModuleManifest } from '../../src/types/module.js';

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

function setupRegistry(...manifests: ModuleManifest[]): ModuleRegistry {
  const registry = new ModuleRegistry();
  for (const m of manifests) {
    registry.register(m);
  }
  return registry;
}

describe('ModuleResolver', () => {
  describe('valid resolution order', () => {
    it('resolves a single module with no dependencies', () => {
      const core = makeManifest({ id: 'core', alwaysIncluded: true });
      const registry = setupRegistry(core);
      const resolver = new ModuleResolver(registry);

      const result = resolver.resolve([]);

      expect(result.ordered).toHaveLength(1);
      expect(result.ordered[0].id).toBe('core');
    });

    it('includes always-included modules automatically', () => {
      const core = makeManifest({ id: 'core', alwaysIncluded: true });
      const auth = makeManifest({ id: 'auth', requires: ['core'] });
      const registry = setupRegistry(core, auth);
      const resolver = new ModuleResolver(registry);

      const result = resolver.resolve(['auth']);

      expect(result.ordered.map((m) => m.id)).toEqual(['core', 'auth']);
    });

    it('orders dependencies before dependents', () => {
      const core = makeManifest({ id: 'core', alwaysIncluded: true });
      const api = makeManifest({ id: 'api', requires: ['core'] });
      const auth = makeManifest({ id: 'auth', requires: ['core', 'api'] });
      const registry = setupRegistry(core, api, auth);
      const resolver = new ModuleResolver(registry);

      const result = resolver.resolve(['auth', 'api']);

      const ids = result.ordered.map((m) => m.id);
      expect(ids.indexOf('core')).toBeLessThan(ids.indexOf('api'));
      expect(ids.indexOf('api')).toBeLessThan(ids.indexOf('auth'));
    });

    it('resolves independent modules in deterministic (alphabetical) order', () => {
      const core = makeManifest({ id: 'core', alwaysIncluded: true });
      const auth = makeManifest({ id: 'auth', requires: ['core'] });
      const api = makeManifest({ id: 'api', requires: ['core'] });
      const theme = makeManifest({ id: 'theme', requires: ['core'] });
      const registry = setupRegistry(core, auth, api, theme);
      const resolver = new ModuleResolver(registry);

      const result = resolver.resolve(['theme', 'auth', 'api']);

      const ids = result.ordered.map((m) => m.id);
      expect(ids[0]).toBe('core');
      // Independent modules should be in alphabetical order
      expect(ids.slice(1).sort()).toEqual(ids.slice(1));
    });

    it('resolves a complex dependency chain', () => {
      const core = makeManifest({ id: 'core', alwaysIncluded: true });
      const api = makeManifest({ id: 'api', requires: ['core'] });
      const auth = makeManifest({ id: 'auth', requires: ['api'] });
      const push = makeManifest({ id: 'push', requires: ['auth'] });
      const registry = setupRegistry(core, api, auth, push);
      const resolver = new ModuleResolver(registry);

      const result = resolver.resolve(['push']);

      const ids = result.ordered.map((m) => m.id);
      expect(ids).toEqual(['core', 'api', 'auth', 'push']);
    });
  });

  describe('transitive dependency resolution', () => {
    it('automatically includes transitive dependencies', () => {
      const core = makeManifest({ id: 'core', alwaysIncluded: true });
      const api = makeManifest({ id: 'api', requires: ['core'] });
      const auth = makeManifest({ id: 'auth', requires: ['api'] });
      const registry = setupRegistry(core, api, auth);
      const resolver = new ModuleResolver(registry);

      // Only select 'auth', but 'api' should be pulled in transitively
      const result = resolver.resolve(['auth']);

      const ids = result.ordered.map((m) => m.id);
      expect(ids).toContain('api');
      expect(ids).toContain('core');
      expect(ids).toContain('auth');
    });

    it('handles diamond dependencies', () => {
      const core = makeManifest({ id: 'core', alwaysIncluded: true });
      const api = makeManifest({ id: 'api', requires: ['core'] });
      const db = makeManifest({ id: 'database', requires: ['core'] });
      const auth = makeManifest({ id: 'auth', requires: ['api', 'database'] });
      const registry = setupRegistry(core, api, db, auth);
      const resolver = new ModuleResolver(registry);

      const result = resolver.resolve(['auth']);

      const ids = result.ordered.map((m) => m.id);
      expect(ids).toHaveLength(4);
      expect(ids.indexOf('core')).toBeLessThan(ids.indexOf('api'));
      expect(ids.indexOf('core')).toBeLessThan(ids.indexOf('database'));
      expect(ids.indexOf('api')).toBeLessThan(ids.indexOf('auth'));
      expect(ids.indexOf('database')).toBeLessThan(ids.indexOf('auth'));
    });
  });

  describe('missing dependency', () => {
    it('throws when a selected module is not in the registry', () => {
      const core = makeManifest({ id: 'core', alwaysIncluded: true });
      const registry = setupRegistry(core);
      const resolver = new ModuleResolver(registry);

      expect(() => resolver.resolve(['nonexistent'])).toThrow(
        "Module 'nonexistent' not found in registry",
      );
    });

    it('throws when a required dependency is not in the registry', () => {
      const core = makeManifest({ id: 'core', alwaysIncluded: true });
      const auth = makeManifest({ id: 'auth', requires: ['missing-dep'] });
      const registry = setupRegistry(core, auth);
      const resolver = new ModuleResolver(registry);

      expect(() => resolver.resolve(['auth'])).toThrow(
        "Module 'auth' requires 'missing-dep', but 'missing-dep' was not found in registry",
      );
    });
  });

  describe('circular dependency detection', () => {
    it('throws on a direct circular dependency (A -> B -> A)', () => {
      const core = makeManifest({ id: 'core', alwaysIncluded: true });
      const a = makeManifest({ id: 'mod-a', requires: ['mod-b'] });
      const b = makeManifest({ id: 'mod-b', requires: ['mod-a'] });
      const registry = setupRegistry(core, a, b);
      const resolver = new ModuleResolver(registry);

      expect(() => resolver.resolve(['mod-a', 'mod-b'])).toThrow(
        /Circular dependency detected/,
      );
    });

    it('throws on a transitive circular dependency (A -> B -> C -> A)', () => {
      const core = makeManifest({ id: 'core', alwaysIncluded: true });
      const a = makeManifest({ id: 'mod-a', requires: ['mod-b'] });
      const b = makeManifest({ id: 'mod-b', requires: ['mod-c'] });
      const c = makeManifest({ id: 'mod-c', requires: ['mod-a'] });
      const registry = setupRegistry(core, a, b, c);
      const resolver = new ModuleResolver(registry);

      expect(() => resolver.resolve(['mod-a', 'mod-b', 'mod-c'])).toThrow(
        /Circular dependency detected/,
      );
    });

    it('includes involved module IDs in circular dependency error', () => {
      const core = makeManifest({ id: 'core', alwaysIncluded: true });
      const a = makeManifest({ id: 'alpha', requires: ['beta'] });
      const b = makeManifest({ id: 'beta', requires: ['alpha'] });
      const registry = setupRegistry(core, a, b);
      const resolver = new ModuleResolver(registry);

      expect(() => resolver.resolve(['alpha', 'beta'])).toThrow(
        /alpha.*beta|beta.*alpha/,
      );
    });
  });

  describe('conflict detection', () => {
    it('throws when two conflicting modules are selected', () => {
      const core = makeManifest({ id: 'core', alwaysIncluded: true });
      const firebase = makeManifest({
        id: 'auth-firebase',
        requires: ['core'],
        conflictsWith: ['auth-supabase'],
      });
      const supabase = makeManifest({
        id: 'auth-supabase',
        requires: ['core'],
        conflictsWith: ['auth-firebase'],
      });
      const registry = setupRegistry(core, firebase, supabase);
      const resolver = new ModuleResolver(registry);

      expect(() => resolver.resolve(['auth-firebase', 'auth-supabase'])).toThrow(
        /conflicts with/,
      );
    });

    it('does not throw when non-conflicting modules are selected', () => {
      const core = makeManifest({ id: 'core', alwaysIncluded: true });
      const auth = makeManifest({
        id: 'auth',
        requires: ['core'],
        conflictsWith: ['legacy-auth'],
      });
      const api = makeManifest({ id: 'api', requires: ['core'] });
      const registry = setupRegistry(core, auth, api);
      const resolver = new ModuleResolver(registry);

      expect(() => resolver.resolve(['auth', 'api'])).not.toThrow();
    });

    it('includes module names in conflict error message', () => {
      const core = makeManifest({ id: 'core', alwaysIncluded: true });
      const a = makeManifest({
        id: 'mod-a',
        requires: ['core'],
        conflictsWith: ['mod-b'],
      });
      const b = makeManifest({ id: 'mod-b', requires: ['core'] });
      const registry = setupRegistry(core, a, b);
      const resolver = new ModuleResolver(registry);

      expect(() => resolver.resolve(['mod-a', 'mod-b'])).toThrow(
        "Module 'mod-a' conflicts with 'mod-b'",
      );
    });
  });

  describe('edge cases', () => {
    it('resolves empty selection (only always-included modules)', () => {
      const core = makeManifest({ id: 'core', alwaysIncluded: true });
      const registry = setupRegistry(core);
      const resolver = new ModuleResolver(registry);

      const result = resolver.resolve([]);

      expect(result.ordered).toHaveLength(1);
      expect(result.ordered[0].id).toBe('core');
    });

    it('handles duplicate selections gracefully', () => {
      const core = makeManifest({ id: 'core', alwaysIncluded: true });
      const auth = makeManifest({ id: 'auth', requires: ['core'] });
      const registry = setupRegistry(core, auth);
      const resolver = new ModuleResolver(registry);

      const result = resolver.resolve(['auth', 'auth']);

      expect(result.ordered).toHaveLength(2);
      expect(result.ordered.map((m) => m.id)).toEqual(['core', 'auth']);
    });

    it('does not duplicate always-included if also explicitly selected', () => {
      const core = makeManifest({ id: 'core', alwaysIncluded: true });
      const auth = makeManifest({ id: 'auth', requires: ['core'] });
      const registry = setupRegistry(core, auth);
      const resolver = new ModuleResolver(registry);

      const result = resolver.resolve(['core', 'auth']);

      expect(result.ordered).toHaveLength(2);
      const coreCount = result.ordered.filter((m) => m.id === 'core').length;
      expect(coreCount).toBe(1);
    });
  });
});
