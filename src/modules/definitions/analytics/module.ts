import type { ModuleManifest } from '../../../types/module.js';

/**
 * Analytics module using Firebase Analytics.
 * Provides route observer and event tracking infrastructure.
 */
export const manifest: ModuleManifest = {
  id: 'analytics',
  name: 'Analytics',
  description: 'Analytics event tracking and route observation via Firebase Analytics',
  requires: [],
  templateDir: 'templates/modules/analytics',
  ralphPhase: 2,

  contributions: {
    pubspecDependencies: {
      'firebase_analytics': '^11.3.6',
    },
    pubspecDevDependencies: {},
    providers: [
      {
        name: 'analyticsProvider',
        importPath: '../../features/analytics/presentation/providers/analytics_provider.dart',
      },
    ],
    routes: [],
    envVars: [],
  },

  isEnabled: (context) => context.modules.analytics !== false,
};
