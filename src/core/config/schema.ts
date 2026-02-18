import { z } from 'zod';

const PlatformSchema = z.enum(['android', 'ios', 'web', 'macos', 'windows', 'linux']);

const AuthModuleSchema = z.union([
  z.literal(false),
  z.object({
    enabled: z.boolean().default(true),
    provider: z.enum(['firebase', 'supabase', 'custom']).default('firebase'),
  }),
]);

const ApiModuleSchema = z.union([
  z.literal(false),
  z.object({
    enabled: z.boolean().default(true),
    baseUrl: z.string().optional(),
    timeout: z.number().optional(),
  }),
]);

const DatabaseModuleSchema = z.union([
  z.literal(false),
  z.object({
    enabled: z.boolean().default(true),
    engine: z.enum(['drift', 'hive', 'isar']).default('drift'),
  }),
]);

const I18nModuleSchema = z.union([
  z.literal(false),
  z.object({
    enabled: z.boolean().default(true),
    defaultLocale: z.string().default('en'),
    supportedLocales: z.array(z.string()).default(['en']),
  }),
]);

const ThemeModuleSchema = z.union([
  z.literal(false),
  z.object({
    enabled: z.boolean().default(true),
    seedColor: z.string().optional(),
    useMaterial3: z.boolean().default(true),
    darkMode: z.boolean().default(true),
  }),
]);

const PushModuleSchema = z.union([
  z.literal(false),
  z.object({
    enabled: z.boolean().default(true),
    provider: z.enum(['firebase', 'onesignal']).default('firebase'),
  }),
]);

const AnalyticsModuleSchema = z.union([
  z.literal(false),
  z.object({
    enabled: z.boolean().default(true),
  }),
]);

const CicdModuleSchema = z.union([
  z.literal(false),
  z.object({
    enabled: z.boolean().default(true),
    provider: z.enum(['github', 'gitlab', 'bitbucket']).default('github'),
    targets: z.array(PlatformSchema).optional(),
  }),
]);

const DeepLinkingModuleSchema = z.union([
  z.literal(false),
  z.object({
    enabled: z.boolean().default(true),
    scheme: z.string().optional(),
    host: z.string().optional(),
  }),
]);

export const MaxsimConfigSchema = z.object({
  version: z.string().default('1'),

  project: z.object({
    name: z.string(),
    orgId: z.string(),
    description: z.string().optional(),
    minSdkVersion: z.string().optional(),
  }),

  platforms: z.array(PlatformSchema).default(['android', 'ios']),

  modules: z
    .object({
      auth: AuthModuleSchema.optional(),
      api: ApiModuleSchema.optional(),
      database: DatabaseModuleSchema.optional(),
      i18n: I18nModuleSchema.optional(),
      theme: ThemeModuleSchema.optional(),
      push: PushModuleSchema.optional(),
      analytics: AnalyticsModuleSchema.optional(),
      cicd: CicdModuleSchema.optional(),
      'deep-linking': DeepLinkingModuleSchema.optional(),
    })
    .default({}),

  claude: z
    .object({
      enabled: z.boolean().default(true),
      generateAgents: z.boolean().default(false),
      generateSkills: z.boolean().default(false),
      generateHooks: z.boolean().default(false),
      agentTeams: z.boolean().default(false),
      mcpServers: z.array(z.string()).default([]),
    })
    .default({}),

  ralph: z
    .object({
      enabled: z.boolean().default(false),
      maxIterations: z.number().default(25),
    })
    .optional(),

  scaffold: z
    .object({
      overwriteExisting: z.enum(['ask', 'always', 'never']).default('ask'),
      runDartFormat: z.boolean().default(true),
      runPubGet: z.boolean().default(true),
      runBuildRunner: z.boolean().default(false),
      dryRun: z.boolean().default(false),
    })
    .default({}),
});
