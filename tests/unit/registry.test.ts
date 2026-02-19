import { ModuleRegistry } from '../../src/modules/registry.js';
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

describe('ModuleRegistry', () => {
  describe('register and get', () => {
    it('registers a module and retrieves it by id', () => {
      const registry = new ModuleRegistry();
      const manifest = makeManifest({ id: 'auth' });

      registry.register(manifest);

      expect(registry.has('auth')).toBe(true);
      expect(registry.get('auth')).toBe(manifest);
    });

    it('throws when getting a non-existent module', () => {
      const registry = new ModuleRegistry();

      expect(() => registry.get('nonexistent')).toThrow("Module 'nonexistent' not found");
    });

    it('reports has() correctly for registered and missing modules', () => {
      const registry = new ModuleRegistry();
      registry.register(makeManifest({ id: 'api' }));

      expect(registry.has('api')).toBe(true);
      expect(registry.has('missing')).toBe(false);
    });

    it('overwrites existing module on re-register', () => {
      const registry = new ModuleRegistry();
      const v1 = makeManifest({ id: 'auth', description: 'v1' });
      const v2 = makeManifest({ id: 'auth', description: 'v2' });

      registry.register(v1);
      registry.register(v2);

      expect(registry.get('auth').description).toBe('v2');
      expect(registry.size).toBe(1);
    });
  });

  describe('getAll', () => {
    it('returns all registered modules', () => {
      const registry = new ModuleRegistry();
      registry.register(makeManifest({ id: 'core', alwaysIncluded: true }));
      registry.register(makeManifest({ id: 'auth' }));
      registry.register(makeManifest({ id: 'api' }));

      const all = registry.getAll();
      expect(all).toHaveLength(3);
      expect(all.map((m) => m.id).sort()).toEqual(['api', 'auth', 'core']);
    });

    it('returns empty array when no modules registered', () => {
      const registry = new ModuleRegistry();
      expect(registry.getAll()).toEqual([]);
    });
  });

  describe('getAlwaysIncluded', () => {
    it('returns only modules with alwaysIncluded=true', () => {
      const registry = new ModuleRegistry();
      registry.register(makeManifest({ id: 'core', alwaysIncluded: true }));
      registry.register(makeManifest({ id: 'auth' }));
      registry.register(makeManifest({ id: 'theme' }));

      const always = registry.getAlwaysIncluded();
      expect(always).toHaveLength(1);
      expect(always[0].id).toBe('core');
    });
  });

  describe('getOptional', () => {
    it('returns only modules without alwaysIncluded', () => {
      const registry = new ModuleRegistry();
      registry.register(makeManifest({ id: 'core', alwaysIncluded: true }));
      registry.register(makeManifest({ id: 'auth' }));
      registry.register(makeManifest({ id: 'api' }));

      const optional = registry.getOptional();
      expect(optional).toHaveLength(2);
      expect(optional.map((m) => m.id).sort()).toEqual(['api', 'auth']);
    });
  });

  describe('size', () => {
    it('reports correct size', () => {
      const registry = new ModuleRegistry();
      expect(registry.size).toBe(0);

      registry.register(makeManifest({ id: 'a' }));
      expect(registry.size).toBe(1);

      registry.register(makeManifest({ id: 'b' }));
      expect(registry.size).toBe(2);
    });
  });

  describe('loadAll', () => {
    it('sets isLoaded to true after loading', async () => {
      const registry = new ModuleRegistry('/nonexistent/path');
      expect(registry.isLoaded).toBe(false);

      await registry.loadAll();
      expect(registry.isLoaded).toBe(true);
    });

    it('handles missing definitions directory gracefully', async () => {
      const registry = new ModuleRegistry('/nonexistent/path');
      await registry.loadAll();

      expect(registry.size).toBe(0);
      expect(registry.getAll()).toEqual([]);
    });
  });

  describe('getAllOptionalIds', () => {
    it('returns IDs of all non-core optional modules', () => {
      const registry = new ModuleRegistry();
      registry.register(makeManifest({ id: 'core', alwaysIncluded: true }));
      registry.register(makeManifest({ id: 'auth' }));
      registry.register(makeManifest({ id: 'api' }));

      const ids = registry.getAllOptionalIds();
      expect(ids.sort()).toEqual(['api', 'auth']);
    });

    it('returns empty array when registry only contains alwaysIncluded modules', () => {
      const registry = new ModuleRegistry();
      registry.register(makeManifest({ id: 'core', alwaysIncluded: true }));

      expect(registry.getAllOptionalIds()).toEqual([]);
    });

    it('returns empty array when registry is empty', () => {
      const registry = new ModuleRegistry();
      expect(registry.getAllOptionalIds()).toEqual([]);
    });

    it('result matches getOptional() mapped to IDs', () => {
      const registry = new ModuleRegistry();
      registry.register(makeManifest({ id: 'core', alwaysIncluded: true }));
      registry.register(makeManifest({ id: 'auth' }));
      registry.register(makeManifest({ id: 'api' }));
      registry.register(makeManifest({ id: 'theme' }));

      const fromMethod = registry.getAllOptionalIds();
      const fromManual = registry.getOptional().map((m) => m.id);

      expect(fromMethod.sort()).toEqual(fromManual.sort());
    });
  });

  describe('core module manifest', () => {
    it('has expected shape when imported directly', async () => {
      const { manifest } = await import(
        '../../src/modules/definitions/core/module.js'
      );

      expect(manifest.id).toBe('core');
      expect(manifest.name).toBe('Core');
      expect(manifest.alwaysIncluded).toBe(true);
      expect(manifest.requires).toEqual([]);
      expect(manifest.ralphPhase).toBe(1);
      expect(manifest.templateDir).toBe('templates/core');
      expect(manifest.contributions.pubspecDependencies).toBeDefined();
      expect(manifest.contributions.pubspecDependencies!['flutter_riverpod']).toBeDefined();
      expect(manifest.contributions.pubspecDependencies!['go_router']).toBeDefined();
      expect(manifest.contributions.pubspecDevDependencies).toBeDefined();
      expect(manifest.contributions.pubspecDevDependencies!['build_runner']).toBeDefined();
    });

    it('can be registered and retrieved from the registry', async () => {
      const { manifest } = await import(
        '../../src/modules/definitions/core/module.js'
      );

      const registry = new ModuleRegistry();
      registry.register(manifest);

      expect(registry.has('core')).toBe(true);
      expect(registry.getAlwaysIncluded()).toHaveLength(1);
    });
  });
});
