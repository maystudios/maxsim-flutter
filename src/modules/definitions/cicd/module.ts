import type { ModuleManifest } from '../../../types/module.js';

/**
 * CI/CD module generating pipeline configuration files for GitHub Actions,
 * GitLab CI, or Bitbucket Pipelines.
 */
export const manifest: ModuleManifest = {
  id: 'cicd',
  name: 'CI/CD',
  description: 'Continuous integration and deployment pipeline configuration',
  requires: [],
  templateDir: 'templates/modules/cicd',
  ralphPhase: 2,

  questions: [
    {
      id: 'provider',
      message: 'Which CI/CD provider do you want to use?',
      type: 'select',
      options: [
        { value: 'github', label: 'GitHub Actions' },
        { value: 'gitlab', label: 'GitLab CI' },
        { value: 'bitbucket', label: 'Bitbucket Pipelines' },
      ],
      defaultValue: 'github',
    },
  ],

  contributions: {
    pubspecDependencies: {},
    pubspecDevDependencies: {},
    providers: [],
    routes: [],
    envVars: [],
  },

  isEnabled: (context) => context.modules.cicd !== false,
};
