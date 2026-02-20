import type { MaxsimConfig } from '../types/config.js';
import type { Platform } from '../types/project.js';

export interface ProjectContext {
  // Core project info
  projectName: string;
  orgId: string;
  description: string;

  // Resolved platforms
  platforms: Platform[];

  // Module configuration (resolved from config)
  modules: {
    auth: false | { provider: 'firebase' | 'supabase' | 'custom' };
    api: false | { baseUrl?: string };
    database: false | { engine: 'drift' | 'hive' | 'isar' };
    i18n: false | { defaultLocale: string; supportedLocales: string[] };
    theme: false | { seedColor?: string; darkMode: boolean };
    push: false | { provider: 'firebase' | 'onesignal' };
    analytics: false | { enabled: boolean };
    cicd: false | { provider: 'github' | 'gitlab' | 'bitbucket' };
    deepLinking: false | { scheme?: string; host?: string };
  };

  // Scaffold settings
  scaffold: {
    dryRun: boolean;
    overwrite: 'ask' | 'always' | 'never';
    postProcessors: {
      dartFormat: boolean;
      flutterPubGet: boolean;
      buildRunner: boolean;
    };
  };

  // Claude setup
  claude: {
    enabled: boolean;
    preset?: 'minimal' | 'standard' | 'full';
    agentTeams: boolean;
  };

  // Resolved output directory
  outputDir: string;

  // Original config (for reference)
  rawConfig: MaxsimConfig;
}

function resolveAuthModule(
  raw: MaxsimConfig['modules']['auth'],
): ProjectContext['modules']['auth'] {
  if (raw === false || raw === undefined) return false;
  if (!raw.enabled) return false;
  return { provider: raw.provider };
}

function resolveApiModule(
  raw: MaxsimConfig['modules']['api'],
): ProjectContext['modules']['api'] {
  if (raw === false || raw === undefined) return false;
  if (!raw.enabled) return false;
  return { baseUrl: raw.baseUrl };
}

function resolveDatabaseModule(
  raw: MaxsimConfig['modules']['database'],
): ProjectContext['modules']['database'] {
  if (raw === false || raw === undefined) return false;
  if (!raw.enabled) return false;
  return { engine: raw.engine };
}

function resolveI18nModule(
  raw: MaxsimConfig['modules']['i18n'],
): ProjectContext['modules']['i18n'] {
  if (raw === false || raw === undefined) return false;
  if (!raw.enabled) return false;
  return { defaultLocale: raw.defaultLocale, supportedLocales: raw.supportedLocales };
}

function resolveThemeModule(
  raw: MaxsimConfig['modules']['theme'],
): ProjectContext['modules']['theme'] {
  if (raw === false || raw === undefined) return false;
  if (!raw.enabled) return false;
  return { seedColor: raw.seedColor, darkMode: raw.darkMode };
}

function resolvePushModule(
  raw: MaxsimConfig['modules']['push'],
): ProjectContext['modules']['push'] {
  if (raw === false || raw === undefined) return false;
  if (!raw.enabled) return false;
  return { provider: raw.provider };
}

function resolveAnalyticsModule(
  raw: MaxsimConfig['modules']['analytics'],
): ProjectContext['modules']['analytics'] {
  if (raw === false || raw === undefined) return false;
  if (!raw.enabled) return false;
  return { enabled: raw.enabled };
}

function resolveCicdModule(
  raw: MaxsimConfig['modules']['cicd'],
): ProjectContext['modules']['cicd'] {
  if (raw === false || raw === undefined) return false;
  if (!raw.enabled) return false;
  return { provider: raw.provider };
}

function resolveDeepLinkingModule(
  raw: MaxsimConfig['modules']['deep-linking'],
): ProjectContext['modules']['deepLinking'] {
  if (raw === false || raw === undefined) return false;
  if (!raw.enabled) return false;
  return { scheme: raw.scheme, host: raw.host };
}

// Factory function to create context from config
export function createProjectContext(config: MaxsimConfig, outputDir: string): ProjectContext {
  return {
    projectName: config.project.name,
    orgId: config.project.orgId,
    description: config.project.description ?? '',

    platforms: config.platforms,

    modules: {
      auth: resolveAuthModule(config.modules.auth),
      api: resolveApiModule(config.modules.api),
      database: resolveDatabaseModule(config.modules.database),
      i18n: resolveI18nModule(config.modules.i18n),
      theme: resolveThemeModule(config.modules.theme),
      push: resolvePushModule(config.modules.push),
      analytics: resolveAnalyticsModule(config.modules.analytics),
      cicd: resolveCicdModule(config.modules.cicd),
      deepLinking: resolveDeepLinkingModule(config.modules['deep-linking']),
    },

    scaffold: {
      dryRun: config.scaffold.dryRun,
      overwrite: config.scaffold.overwriteExisting,
      postProcessors: {
        dartFormat: config.scaffold.runDartFormat,
        flutterPubGet: config.scaffold.runPubGet,
        buildRunner: config.scaffold.runBuildRunner,
      },
    },

    claude: {
      enabled: config.claude.enabled,
      preset: config.claude.preset,
      agentTeams: config.claude.agentTeams,
    },

    outputDir,
    rawConfig: config,
  };
}
