import type { ModuleManifest } from '../../../types/module.js';

/**
 * Internationalization module providing ARB files, l10n.yaml config,
 * and Riverpod-based locale management for Flutter gen-l10n.
 */
export const manifest: ModuleManifest = {
  id: 'i18n',
  name: 'Internationalization',
  description: 'Multi-language support with ARB files and Flutter localization',
  requires: [],
  templateDir: 'templates/modules/i18n',
  ralphPhase: 2,

  questions: [
    {
      id: 'defaultLocale',
      message: 'Default locale (e.g., en)',
      type: 'text',
      defaultValue: 'en',
    },
  ],

  contributions: {
    pubspecDependencies: {
      'flutter_localizations': 'sdk: flutter',
      'intl': '^0.19.0',
    },
    pubspecDevDependencies: {},
    providers: [
      {
        name: 'localeProvider',
        importPath: '../../core/l10n/l10n_provider.dart',
      },
    ],
    routes: [],
    envVars: [],
  },

  isEnabled: (context) => context.modules.i18n !== false,
};
