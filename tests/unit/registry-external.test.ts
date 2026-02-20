import { ModuleRegistry } from '../../src/modules/registry.js';
import type { ExternalLoader } from '../../src/modules/external-validator.js';
import type { ModuleManifest } from '../../src/types/module.js';

function makeValidManifest(overrides: Partial<ModuleManifest> = {}): ModuleManifest {
  return {
    id: 'stripe-payments',
    name: 'Stripe Payments',
    description: 'Stripe payment integration module',
    requires: [],
    templateDir: 'templates/modules/stripe-payments',
    ralphPhase: 2,
    contributions: {},
    ...overrides,
  };
}

function makeLoader(manifest?: unknown): ExternalLoader {
  return async (_pkg: string) => ({ manifest });
}

describe('ModuleRegistry.loadExternal', () => {
  it('registers the manifest so get(id) works after loadExternal with a valid loader', async () => {
    const registry = new ModuleRegistry();
    const manifest = makeValidManifest({ id: 'stripe-payments' });
    const loader = makeLoader(manifest);

    await registry.loadExternal('maxsim-module-stripe', loader);

    expect(registry.has('stripe-payments')).toBe(true);
    expect(registry.get('stripe-payments')).toEqual(manifest);
  });

  it('throws when loader throws (simulates package not found in node_modules)', async () => {
    const registry = new ModuleRegistry();
    const loader: ExternalLoader = async (_pkg) => {
      throw new Error("Cannot find module 'maxsim-module-missing'");
    };

    await expect(registry.loadExternal('maxsim-module-missing', loader)).rejects.toThrow();
  });

  it('throws when loader resolves with no manifest export', async () => {
    const registry = new ModuleRegistry();
    const loader = makeLoader(undefined);

    await expect(registry.loadExternal('maxsim-module-bad', loader)).rejects.toThrow(
      /maxsim-module-bad/,
    );
  });

  it('throws when loader returns an invalid manifest (validation failure)', async () => {
    const registry = new ModuleRegistry();
    const loader = makeLoader({ id: '', name: 'Bad', description: '', requires: [], templateDir: 'x', ralphPhase: 2, contributions: {} });

    await expect(registry.loadExternal('maxsim-module-bad', loader)).rejects.toThrow(
      /maxsim-module-bad/,
    );
  });

  it('loaded module appears in getAll() after loadExternal', async () => {
    const registry = new ModuleRegistry();
    const manifest = makeValidManifest({ id: 'stripe-payments' });
    const loader = makeLoader(manifest);

    await registry.loadExternal('maxsim-module-stripe', loader);

    const all = registry.getAll();
    expect(all.some((m) => m.id === 'stripe-payments')).toBe(true);
  });

  it('calls the loader with exactly the given package name', async () => {
    const registry = new ModuleRegistry();
    const calls: string[] = [];
    const loader: ExternalLoader = async (pkg: string) => {
      calls.push(pkg);
      return { manifest: makeValidManifest() };
    };

    await registry.loadExternal('maxsim-module-stripe', loader);

    expect(calls).toEqual(['maxsim-module-stripe']);
  });

  it('loads all packages successfully when loadExternal is called multiple times', async () => {
    const registry = new ModuleRegistry();
    const manifest1 = makeValidManifest({ id: 'stripe-payments' });
    const manifest2 = makeValidManifest({ id: 'paypal-payments' });

    await registry.loadExternal('maxsim-module-stripe', makeLoader(manifest1));
    await registry.loadExternal('maxsim-module-paypal', makeLoader(manifest2));

    expect(registry.has('stripe-payments')).toBe(true);
    expect(registry.has('paypal-payments')).toBe(true);
    expect(registry.size).toBeGreaterThanOrEqual(2);
  });

  it('loaded manifest is retrievable via get() with the manifest id', async () => {
    const registry = new ModuleRegistry();
    const manifest = makeValidManifest({ id: 'my-external-module' });
    const loader = makeLoader(manifest);

    await registry.loadExternal('some-package-name', loader);

    const retrieved = registry.get('my-external-module');
    expect(retrieved.id).toBe('my-external-module');
    expect(retrieved.name).toBe(manifest.name);
  });
});
