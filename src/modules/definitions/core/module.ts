import type { ModuleManifest } from '../../../types/module.js';

/**
 * The core module is always included in every generated project.
 * It provides the base Clean Architecture structure with Riverpod and go_router.
 */
export const manifest: ModuleManifest = {
  id: 'core',
  name: 'Core',
  description: 'Base Clean Architecture structure with Riverpod state management and go_router navigation',
  requires: [],
  templateDir: 'templates/core',
  ralphPhase: 1,
  alwaysIncluded: true,
  contributions: {
    pubspecDependencies: {
      'flutter_riverpod': '^2.6.1',
      'riverpod_annotation': '^2.6.1',
      'go_router': '^14.6.2',
      'freezed_annotation': '^2.4.4',
      'json_annotation': '^4.9.0',
    },
    pubspecDevDependencies: {
      'build_runner': '^2.4.13',
      'riverpod_generator': '^2.6.3',
      'go_router_builder': '^2.7.1',
      'freezed': '^2.5.7',
      'json_serializable': '^6.8.0',
      'flutter_lints': '^5.0.0',
    },
  },
};
