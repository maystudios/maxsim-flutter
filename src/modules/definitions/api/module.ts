import type { ModuleManifest } from '../../../types/module.js';

/**
 * API module providing HTTP client setup with Dio, interceptors,
 * typed error handling, and Clean Architecture layers.
 */
export const manifest: ModuleManifest = {
  id: 'api',
  name: 'API Client',
  description: 'HTTP client setup with Dio, interceptors, and typed error handling',
  requires: [],
  templateDir: 'templates/modules/api',
  ralphPhase: 2,

  questions: [
    {
      id: 'baseUrl',
      message: 'What is your API base URL? (leave empty for placeholder)',
      type: 'text',
      defaultValue: 'https://api.example.com',
    },
  ],

  contributions: {
    pubspecDependencies: {
      'dio': '^5.7.0',
      'retrofit': '^4.4.1',
      'json_annotation': '^4.9.0',
    },
    pubspecDevDependencies: {
      'retrofit_generator': '^9.1.5',
      'json_serializable': '^6.9.0',
    },
    providers: [
      {
        name: 'dioClientProvider',
        importPath: '../../features/api/presentation/providers/api_provider.dart',
      },
    ],
    routes: [],
    envVars: ['API_BASE_URL'],
  },

  isEnabled: (context) => context.modules.api !== false,
};
