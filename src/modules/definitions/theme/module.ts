import type { ModuleManifest } from '../../../types/module.js';

/**
 * Theme module providing Material 3 theming with ColorScheme.fromSeed,
 * dark/light mode switching via Riverpod, and optional Google Fonts.
 */
export const manifest: ModuleManifest = {
  id: 'theme',
  name: 'Theme',
  description: 'Advanced Material 3 theming with seed colors, dark/light mode switching via Riverpod',
  requires: [],
  templateDir: 'templates/modules/theme',
  ralphPhase: 2,

  questions: [
    {
      id: 'seedColor',
      message: 'What seed color for your theme? (hex, e.g. #6750A4)',
      type: 'text',
      defaultValue: '#6750A4',
    },
    {
      id: 'darkMode',
      message: 'Enable dark mode support?',
      type: 'confirm',
      defaultValue: true,
    },
  ],

  contributions: {
    pubspecDependencies: {
      'google_fonts': '^6.2.1',
    },
    pubspecDevDependencies: {},
    providers: [
      {
        name: 'appThemeModeProvider',
        importPath: '../../core/theme/theme_provider.dart',
      },
    ],
    routes: [],
    envVars: [],
  },

  isEnabled: (context) => context.modules.theme !== false,
};
