import type { ModuleManifest } from '../../../types/module.js';

/**
 * Authentication module supporting Firebase Auth, Supabase Auth, and custom backends.
 * Generates Clean Architecture layers for authentication with Riverpod state management.
 */
export const manifest: ModuleManifest = {
  id: 'auth',
  name: 'Authentication',
  description: 'User authentication with login, register, and session management',
  requires: [],
  templateDir: 'templates/modules/auth',
  ralphPhase: 2,

  questions: [
    {
      id: 'provider',
      message: 'Which authentication provider do you want to use?',
      type: 'select',
      options: [
        { value: 'firebase', label: 'Firebase Auth' },
        { value: 'supabase', label: 'Supabase Auth' },
        { value: 'custom', label: 'Custom backend' },
      ],
      defaultValue: 'firebase',
    },
  ],

  contributions: {
    pubspecDependencies: {
      'firebase_core': '^3.8.0',
      'firebase_auth': '^5.3.4',
    },
    pubspecDevDependencies: {},
    providers: [
      {
        name: 'authRepositoryProvider',
        importPath: '../../features/auth/presentation/providers/auth_provider.dart',
      },
    ],
    routes: [
      {
        path: '/login',
        name: 'login',
        importPath: '../../features/auth/presentation/pages/login_page.dart',
      },
      {
        path: '/register',
        name: 'register',
        importPath: '../../features/auth/presentation/pages/register_page.dart',
      },
    ],
    envVars: [],
  },

  isEnabled: (context) => context.modules.auth !== false,
};
