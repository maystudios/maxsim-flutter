import type { ModuleManifest } from '../types/module.js';

/**
 * A function that dynamically imports a module package by name and returns its exports.
 * Injectable for testing — the default implementation uses native ESM dynamic import().
 */
export type ExternalLoader = (packageName: string) => Promise<{ manifest?: unknown }>;

/**
 * Validates that an unknown value conforms to the ModuleManifest interface.
 * Used when loading external module packages to ensure type safety before registration.
 *
 * @param value - The untrusted export value from a third-party package
 * @param packageName - Package name included in error messages for diagnostics
 * @returns The validated ModuleManifest
 * @throws Error with descriptive message if any required field is missing or wrong type
 */
export function validateExternalManifest(value: unknown, packageName: string): ModuleManifest {
  const prefix = `External module from '${packageName}' has invalid manifest:`;

  if (value === null || typeof value !== 'object') {
    throw new Error(`${prefix} manifest must be a non-null object`);
  }

  const obj = value as Record<string, unknown>;

  if (typeof obj['id'] !== 'string' || obj['id'].length === 0) {
    throw new Error(`${prefix} 'id' must be a non-empty string`);
  }

  if (typeof obj['name'] !== 'string' || obj['name'].length === 0) {
    throw new Error(`${prefix} 'name' must be a non-empty string`);
  }

  if (typeof obj['description'] !== 'string') {
    throw new Error(`${prefix} 'description' must be a string`);
  }

  if (!Array.isArray(obj['requires'])) {
    throw new Error(`${prefix} 'requires' must be an array`);
  }

  if (typeof obj['templateDir'] !== 'string' || obj['templateDir'].length === 0) {
    throw new Error(`${prefix} 'templateDir' must be a non-empty string`);
  }

  if (![1, 2, 3, 4].includes(obj['ralphPhase'] as number)) {
    throw new Error(`${prefix} 'ralphPhase' must be 1, 2, 3, or 4`);
  }

  if (obj['contributions'] === null || typeof obj['contributions'] !== 'object') {
    throw new Error(`${prefix} 'contributions' must be a non-null object`);
  }

  return obj as unknown as ModuleManifest;
}
