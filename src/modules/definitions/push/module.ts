import type { ModuleManifest } from '../../../types/module.js';

/**
 * Push Notifications module supporting Firebase Cloud Messaging and OneSignal.
 * Generates Clean Architecture layers for push notification handling.
 */
export const manifest: ModuleManifest = {
  id: 'push',
  name: 'Push Notifications',
  description: 'Push notification support via Firebase Cloud Messaging or OneSignal',
  requires: [],
  templateDir: 'templates/modules/push',
  ralphPhase: 2,

  questions: [
    {
      id: 'provider',
      message: 'Which push notification provider do you want to use?',
      type: 'select',
      options: [
        { value: 'firebase', label: 'Firebase Cloud Messaging' },
        { value: 'onesignal', label: 'OneSignal' },
      ],
      defaultValue: 'firebase',
    },
  ],

  contributions: {
    pubspecDependencies: {
      'firebase_messaging': '^15.1.6',
    },
    pubspecDevDependencies: {},
    providers: [
      {
        name: 'pushNotificationProvider',
        importPath: '../../features/push/presentation/providers/push_provider.dart',
      },
    ],
    routes: [],
    envVars: [],
  },

  isEnabled: (context) => context.modules.push !== false,
};
