import type { ProjectContext } from '../core/context.js';

/**
 * A question to present during interactive module configuration.
 */
export interface ModuleQuestion {
  /** Unique identifier used as the config key */
  id: string;
  /** Prompt message shown to the user */
  message: string;
  /** Input type */
  type: 'text' | 'select' | 'confirm';
  /** Options for 'select' type questions */
  options?: Array<{ value: string; label: string }>;
  /** Default value */
  defaultValue?: string | boolean;
}

/**
 * A Riverpod provider contributed by a module.
 */
export interface ProviderContribution {
  /** Provider variable name (e.g., 'authRepositoryProvider') */
  name: string;
  /** Dart import path for the provider */
  importPath: string;
}

/**
 * A go_router route contributed by a module.
 */
export interface RouteContribution {
  /** Route path (e.g., '/login') */
  path: string;
  /** Route name for named routing */
  name: string;
  /** Dart import path for the page widget */
  importPath: string;
}

/**
 * Describes what a module contributes to the generated project.
 * Used by the ModuleComposer to merge contributions from all active modules.
 */
export interface ModuleContribution {
  /** Dependencies to add to pubspec.yaml */
  pubspecDependencies?: Record<string, string>;
  /** Dev dependencies to add to pubspec.yaml */
  pubspecDevDependencies?: Record<string, string>;
  /** Riverpod providers to register */
  providers?: ProviderContribution[];
  /** Routes to add to go_router config */
  routes?: RouteContribution[];
  /** Environment variables the module needs */
  envVars?: string[];
}

/**
 * The complete definition of a scaffolding module.
 * Each module in src/modules/definitions/<name>/module.ts must export a manifest
 * conforming to this interface.
 */
export interface ModuleManifest {
  /** Kebab-case identifier (e.g., 'auth', 'api', 'core') */
  id: string;
  /** Human-readable name (e.g., 'Authentication') */
  name: string;
  /** Brief description of what the module provides */
  description: string;
  /** Module IDs this module depends on */
  requires: readonly string[];
  /** Module IDs that cannot be used alongside this module */
  conflictsWith?: readonly string[];
  /** Relative path to the module's templates directory */
  templateDir: string;
  /** PRD phase (1-4) this module belongs to */
  ralphPhase: 1 | 2 | 3 | 4;
  /** If true, this module is always included regardless of user selection */
  alwaysIncluded?: boolean;
  /** What this module contributes to the generated project */
  contributions: ModuleContribution;
  /** Interactive questions for module-specific configuration */
  questions?: ModuleQuestion[];
  /** Optional predicate — module templates are only included when this returns true */
  isEnabled?: (context: ProjectContext) => boolean;
}
