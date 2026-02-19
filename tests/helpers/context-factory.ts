import type { ProjectContext } from '../../src/core/context.js';

/**
 * Default dry-run ProjectContext for tests that don't touch the filesystem.
 */
export const DEFAULT_CONTEXT: ProjectContext = {
  projectName: 'my_app',
  orgId: 'com.example',
  description: 'A test Flutter app',
  platforms: ['android', 'ios'],
  modules: {
    auth: false,
    api: false,
    database: false,
    i18n: false,
    theme: false,
    push: false,
    analytics: false,
    cicd: false,
    deepLinking: false,
  },
  scaffold: {
    dryRun: true,
    overwrite: 'always',
    postProcessors: {
      dartFormat: false,
      flutterPubGet: false,
      buildRunner: false,
    },
  },
  claude: {
    enabled: false,
    agentTeams: false,
  },
  outputDir: '/tmp/test-output',
  rawConfig: {} as ProjectContext['rawConfig'],
};

/**
 * Create a ProjectContext for dry-run tests with optional overrides.
 * Defaults to dryRun: true — files are NOT written to disk.
 */
export function makeTestContext(overrides: Partial<ProjectContext> = {}): ProjectContext {
  return { ...DEFAULT_CONTEXT, ...overrides };
}

/**
 * Create a ProjectContext for tests that write to a real temp directory.
 * Defaults to dryRun: false — files ARE written to disk.
 */
export function makeWritableContext(
  tmpDir: string,
  overrides: Partial<ProjectContext> = {},
): ProjectContext {
  return {
    ...DEFAULT_CONTEXT,
    scaffold: {
      dryRun: false,
      overwrite: 'always',
      postProcessors: {
        dartFormat: false,
        flutterPubGet: false,
        buildRunner: false,
      },
    },
    outputDir: tmpDir,
    ...overrides,
  };
}
