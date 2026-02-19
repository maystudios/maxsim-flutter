import type { ModuleManifest } from '../../../types/module.js';

/**
 * Deep Linking module using app_links for Android/iOS universal links.
 * Integrates with go_router for link-based navigation.
 */
export const manifest: ModuleManifest = {
  id: 'deep-linking',
  name: 'Deep Linking',
  description: 'Deep link and universal link handling via app_links with go_router integration',
  requires: [],
  templateDir: 'templates/modules/deep-linking',
  ralphPhase: 2,

  questions: [
    {
      id: 'scheme',
      message: 'URL scheme for deep links (e.g. myapp)',
      type: 'text',
      defaultValue: 'myapp',
    },
    {
      id: 'host',
      message: 'Host domain for universal links (e.g. example.com)',
      type: 'text',
      defaultValue: 'example.com',
    },
  ],

  contributions: {
    pubspecDependencies: {
      'app_links': '^6.3.3',
    },
    pubspecDevDependencies: {},
    providers: [
      {
        name: 'deepLinkProvider',
        importPath: '../../features/deep_linking/presentation/providers/deep_link_provider.dart',
      },
    ],
    routes: [
      {
        path: '/deep-link',
        name: 'deepLink',
        importPath: '../../features/deep_linking/presentation/pages/deep_link_page.dart',
      },
    ],
    envVars: [],
  },

  isEnabled: (context) => context.modules.deepLinking !== false,
};
