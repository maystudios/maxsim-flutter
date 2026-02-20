import { validateExternalManifest } from '../../src/modules/external-validator.js';
import type { ModuleManifest } from '../../src/types/module.js';

function makeValidManifest(): ModuleManifest {
  return {
    id: 'stripe-payments',
    name: 'Stripe Payments',
    description: 'Stripe payment integration module',
    requires: [],
    templateDir: 'templates/modules/stripe-payments',
    ralphPhase: 2,
    contributions: {},
  };
}

describe('validateExternalManifest', () => {
  it('returns the manifest object when all required fields are valid', () => {
    const manifest = makeValidManifest();
    const result = validateExternalManifest(manifest, 'maxsim-module-stripe');
    expect(result).toEqual(manifest);
  });

  it('throws when value is null — includes packageName in message', () => {
    expect(() => validateExternalManifest(null, 'maxsim-module-stripe')).toThrow(
      "maxsim-module-stripe",
    );
  });

  it('throws when value is a string — includes packageName in message', () => {
    expect(() => validateExternalManifest('not-an-object', 'maxsim-module-stripe')).toThrow(
      "maxsim-module-stripe",
    );
  });

  it('throws when id is missing — includes packageName in message', () => {
    const bad = { ...makeValidManifest(), id: undefined };
    expect(() => validateExternalManifest(bad, 'maxsim-module-stripe')).toThrow(
      "maxsim-module-stripe",
    );
  });

  it('throws when id is a number (not a string)', () => {
    const bad = { ...makeValidManifest(), id: 42 };
    expect(() => validateExternalManifest(bad, 'maxsim-module-stripe')).toThrow(
      /maxsim-module-stripe/,
    );
  });

  it('throws when id is an empty string', () => {
    const bad = { ...makeValidManifest(), id: '' };
    expect(() => validateExternalManifest(bad, 'maxsim-module-stripe')).toThrow(
      /maxsim-module-stripe/,
    );
  });

  it('throws when name is missing', () => {
    const bad = { ...makeValidManifest(), name: undefined };
    expect(() => validateExternalManifest(bad, 'maxsim-module-stripe')).toThrow(
      /maxsim-module-stripe/,
    );
  });

  it('throws when requires is not an array (e.g., it is a string)', () => {
    const bad = { ...makeValidManifest(), requires: 'core' };
    expect(() => validateExternalManifest(bad, 'maxsim-module-stripe')).toThrow(
      /maxsim-module-stripe/,
    );
  });

  it('throws when templateDir is an empty string', () => {
    const bad = { ...makeValidManifest(), templateDir: '' };
    expect(() => validateExternalManifest(bad, 'maxsim-module-stripe')).toThrow(
      /maxsim-module-stripe/,
    );
  });

  it('throws when ralphPhase is 5 (out of range 1-4)', () => {
    const bad = { ...makeValidManifest(), ralphPhase: 5 };
    expect(() => validateExternalManifest(bad, 'maxsim-module-stripe')).toThrow(
      /maxsim-module-stripe/,
    );
  });
});
