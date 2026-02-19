import type { ProjectContext } from '../core/context.js';

/**
 * Generates a comprehensive CLAUDE.md for a scaffolded Flutter project.
 * The output is optimized for Claude Code and Agent Teams workflows.
 */
export function generateClaudeMd(context: ProjectContext): string {
  const sections: string[] = [
    generateHeader(context),
    generateTechStack(context),
    generateArchitectureRules(),
    generateRiverpodPatterns(),
    generateGoRouterPatterns(),
    ...generateModuleSections(context),
    generateQualityGates(),
    generateBuildCommands(),
  ];

  if (context.claude.agentTeams) {
    sections.push(generateAgentTeamsWorkflow(context));
  }

  sections.push(generateDevelopmentWorkflow());

  return sections.join('\n\n');
}

function generateHeader(context: ProjectContext): string {
  const lines = [
    `# CLAUDE.md - ${context.projectName}`,
    '',
    `## Project Overview`,
    '',
    `**${context.projectName}** is a Flutter application using Clean Architecture, Riverpod for state management, and go_router for navigation.`,
  ];

  if (context.description) {
    lines.push('', context.description);
  }

  const enabledModules = getEnabledModuleNames(context);
  if (enabledModules.length > 0) {
    lines.push('', `**Active modules:** ${enabledModules.join(', ')}`);
  }

  lines.push('', `**Platforms:** ${context.platforms.join(', ')}`);

  return lines.join('\n');
}

function generateTechStack(context: ProjectContext): string {
  const deps = [
    '- **State Management**: flutter_riverpod',
    '- **Navigation**: go_router (type-safe routes)',
    '- **Code Generation**: freezed, json_serializable, build_runner',
  ];

  if (context.modules.api) {
    deps.push('- **HTTP Client**: Dio with Retrofit');
  }
  if (context.modules.database) {
    const engine = context.modules.database.engine;
    const label = engine === 'drift' ? 'Drift (SQLite)' : engine === 'hive' ? 'Hive' : 'Isar';
    deps.push(`- **Local Database**: ${label}`);
  }
  if (context.modules.auth) {
    const provider = context.modules.auth.provider;
    const label = provider === 'firebase' ? 'Firebase Auth' : provider === 'supabase' ? 'Supabase Auth' : 'Custom Auth';
    deps.push(`- **Authentication**: ${label}`);
  }
  if (context.modules.i18n) {
    deps.push('- **Internationalization**: flutter_localizations, intl');
  }
  if (context.modules.theme) {
    deps.push('- **Theming**: Material 3 with Google Fonts');
  }

  return ['## Tech Stack', '', ...deps].join('\n');
}

function generateArchitectureRules(): string {
  return `## Architecture Rules (Clean Architecture)

This project follows strict Clean Architecture with three layers per feature:

\`\`\`
lib/
  core/           # Shared utilities, router, theme, providers
  features/
    <feature>/
      domain/     # Entities (freezed), repository interfaces, use cases
      data/       # Repository implementations, data sources, models
      presentation/ # Pages, widgets, Riverpod providers
\`\`\`

### Layer Rules

1. **Domain layer** has NO dependencies on other layers or external packages
   - Entities are pure Dart classes (use freezed for immutability)
   - Repository interfaces define contracts (abstract classes)
   - Use cases contain single business operations

2. **Data layer** depends only on Domain
   - Implements repository interfaces from Domain
   - Contains data sources (remote/local) and models
   - Models handle serialization (json_serializable/freezed)

3. **Presentation layer** depends on Domain (never directly on Data)
   - Pages and widgets for UI
   - Riverpod providers for state management
   - Access repositories through Riverpod providers, not direct instantiation

### Import Rules

- \`domain/\` must NOT import from \`data/\` or \`presentation/\`
- \`data/\` must NOT import from \`presentation/\`
- \`presentation/\` must NOT import from \`data/\` (use providers instead)
- Cross-feature imports go through \`core/\` barrel exports`;
}

function generateRiverpodPatterns(): string {
  return `## Riverpod Patterns

### Provider Types

- **Provider**: For computed/derived values and repository instances
- **StateNotifierProvider**: For mutable state with defined mutations
- **FutureProvider**: For async data fetching (one-shot)
- **StreamProvider**: For real-time data streams
- **NotifierProvider / AsyncNotifierProvider**: Preferred for new code (Riverpod 2.0+)

### Conventions

- Declare providers as top-level final variables
- Use \`ref.watch()\` in build methods, \`ref.read()\` in callbacks
- Name providers with a \`Provider\` suffix (e.g., \`authRepositoryProvider\`)
- Keep providers in the \`presentation/\` layer of each feature
- Use \`ref.invalidate()\` to refresh cached data
- Prefer \`AsyncNotifier\` over \`StateNotifier\` for new async state

### Example

\`\`\`dart
// Repository provider (in presentation/)
final authRepositoryProvider = Provider<AuthRepository>((ref) {
  return AuthRepositoryImpl(ref.watch(authDataSourceProvider));
});

// Async state provider
final userProvider = AsyncNotifierProvider<UserNotifier, User?>(() {
  return UserNotifier();
});
\`\`\``;
}

function generateGoRouterPatterns(): string {
  return `## go_router Patterns

### Route Structure

- Routes are defined in \`lib/core/router/app_router.dart\`
- Use \`TypedGoRoute\` with code generation for type-safe routes
- Each feature can contribute routes via its route definitions

### Conventions

- Use named routes for navigation: \`context.goNamed('routeName')\`
- Define route paths as constants
- Use \`ShellRoute\` for persistent navigation (bottom nav, drawer)
- Handle redirects for auth guards in the router configuration
- Pass parameters via path params or query params, not constructors

### Example

\`\`\`dart
GoRouter(
  initialLocation: '/',
  routes: [
    GoRoute(
      path: '/',
      name: 'home',
      builder: (context, state) => const HomePage(),
    ),
  ],
);
\`\`\``;
}

function generateModuleSections(context: ProjectContext): string[] {
  const sections: string[] = [];

  if (context.modules.auth) {
    sections.push(generateAuthSection(context.modules.auth));
  }
  if (context.modules.api) {
    sections.push(generateApiSection(context.modules.api));
  }
  if (context.modules.database) {
    sections.push(generateDatabaseSection(context.modules.database));
  }
  if (context.modules.i18n) {
    sections.push(generateI18nSection(context.modules.i18n));
  }
  if (context.modules.theme) {
    sections.push(generateThemeSection(context.modules.theme));
  }
  if (context.modules.push) {
    sections.push(generatePushSection(context.modules.push));
  }
  if (context.modules.analytics) {
    sections.push(generateAnalyticsSection());
  }
  if (context.modules.cicd) {
    sections.push(generateCicdSection(context.modules.cicd));
  }
  if (context.modules.deepLinking) {
    sections.push(generateDeepLinkingSection());
  }

  return sections;
}

function generateAuthSection(
  auth: Exclude<ProjectContext['modules']['auth'], false>,
): string {
  const providerNotes: Record<string, string> = {
    firebase: 'Uses Firebase Auth. Ensure `google-services.json` (Android) and `GoogleService-Info.plist` (iOS) are configured.',
    supabase: 'Uses Supabase Auth. Set the Supabase URL and anon key in environment config.',
    custom: 'Uses custom auth with Dio HTTP client. Implement token refresh logic in the auth interceptor.',
  };

  return `## Auth Module

- Location: \`lib/features/auth/\`
- Provider: \`${auth.provider}\`
- ${providerNotes[auth.provider]}
- Auth state is managed via \`authRepositoryProvider\`
- Login and register pages are at \`/login\` and \`/register\` routes
- Use the auth guard in go_router redirect for protected routes`;
}

function generateApiSection(
  api: Exclude<ProjectContext['modules']['api'], false>,
): string {
  const baseUrlNote = api.baseUrl
    ? `- Base URL: \`${api.baseUrl}\``
    : '- Base URL: Configure via `API_BASE_URL` environment variable';

  return `## API Module

- Location: \`lib/features/api/\`
- HTTP client: Dio with interceptors (auth, retry, logging)
${baseUrlNote}
- Use \`ApiClient\` via \`dioClientProvider\` for all HTTP requests
- Typed errors via \`ApiException\` with status code handling
- Retry interceptor handles transient failures with exponential backoff`;
}

function generateDatabaseSection(
  database: Exclude<ProjectContext['modules']['database'], false>,
): string {
  const engineNotes: Record<string, string> = {
    drift: 'Uses Drift (SQLite). Define tables as Dart classes. Run `dart run build_runner build` after schema changes.',
    hive: 'Uses Hive for key-value NoSQL storage. Register adapters for custom types.',
    isar: 'Uses Isar for NoSQL storage. Define collections with annotations. Run `dart run build_runner build` after schema changes.',
  };

  return `## Database Module

- Location: \`lib/features/database/\`
- Engine: \`${database.engine}\`
- ${engineNotes[database.engine]}
- Access via \`databaseProvider\` in Riverpod`;
}

function generateI18nSection(
  i18n: Exclude<ProjectContext['modules']['i18n'], false>,
): string {
  return `## Internationalization (i18n) Module

- Location: \`lib/core/l10n/\`
- Default locale: \`${i18n.defaultLocale}\`
- Supported locales: ${i18n.supportedLocales.join(', ')}
- ARB files in \`lib/l10n/\`
- Run \`flutter gen-l10n\` after editing ARB files
- Access strings via \`AppLocalizations.of(context)!\``;
}

function generateThemeSection(
  theme: Exclude<ProjectContext['modules']['theme'], false>,
): string {
  const seedNote = theme.seedColor
    ? `- Seed color: \`${theme.seedColor}\``
    : '- Seed color: Default Material 3 purple';
  const darkNote = theme.darkMode
    ? '- Dark mode: Enabled (toggle via `appThemeModeProvider`)'
    : '- Dark mode: Disabled';

  return `## Theme Module

- Location: \`lib/core/theme/\`
${seedNote}
${darkNote}
- Uses Material 3 \`ColorScheme.fromSeed\` for consistent theming
- Google Fonts (Inter) as default text theme
- Access current theme via \`Theme.of(context)\``;
}

function generatePushSection(
  push: Exclude<ProjectContext['modules']['push'], false>,
): string {
  const providerNotes: Record<string, string> = {
    firebase: 'Uses Firebase Cloud Messaging. Configure FCM in Firebase Console.',
    onesignal: 'Uses OneSignal. Set app ID in environment config.',
  };

  return `## Push Notifications Module

- Location: \`lib/features/push/\`
- Provider: \`${push.provider}\`
- ${providerNotes[push.provider]}
- Handle notification taps via deep linking integration`;
}

function generateAnalyticsSection(): string {
  return `## Analytics Module

- Location: \`lib/features/analytics/\`
- Uses \`AnalyticsService\` abstraction for provider independence
- GoRouter observer automatically tracks screen views
- Log custom events via \`analyticsServiceProvider\``;
}

function generateCicdSection(
  cicd: Exclude<ProjectContext['modules']['cicd'], false>,
): string {
  const providerNotes: Record<string, string> = {
    github: 'Uses GitHub Actions. Pipelines are in `.github/workflows/`. Flutter test and build jobs are pre-configured.',
    gitlab: 'Uses GitLab CI. Pipeline is in `.gitlab-ci.yml`. Stages: test, build, deploy.',
    bitbucket: 'Uses Bitbucket Pipelines. Pipeline is in `bitbucket-pipelines.yml`. Includes test and build steps.',
  };

  return `## CI/CD Module

- Provider: \`${cicd.provider}\`
- ${providerNotes[cicd.provider]}
- Pipeline runs \`flutter analyze\`, \`flutter test\`, and \`flutter build\` on every push
- Artifacts are stored per-run for download`;
}

function generateDeepLinkingSection(): string {
  return `## Deep Linking Module

- Location: \`lib/features/deep-linking/\`
- Uses \`app_links\` package for Universal Links / App Links
- Integrated with go_router for automatic route resolution
- Configure link domains in platform-specific config files`;
}

function generateQualityGates(): string {
  return `## Quality Gates

Before committing or marking a task complete, ALL of the following must pass:

\`\`\`bash
flutter analyze          # Zero warnings/errors
flutter test             # All tests pass
dart format --set-exit-if-changed .  # Code is formatted
\`\`\`

For code generation changes:
\`\`\`bash
dart run build_runner build --delete-conflicting-outputs
\`\`\``;
}

function generateBuildCommands(): string {
  return `## Build Commands

\`\`\`bash
flutter pub get                    # Install dependencies
flutter run                        # Run in debug mode
flutter build apk                  # Build Android APK
flutter build ios                  # Build iOS (macOS only)
flutter build web                  # Build for web
dart run build_runner build        # Run code generation
dart run build_runner watch        # Watch mode code generation
flutter test                       # Run all tests
flutter test --coverage            # Run tests with coverage
\`\`\``;
}

function generateAgentTeamsWorkflow(context: ProjectContext): string {
  const moduleList = getEnabledModuleNames(context);
  const moduleNote = moduleList.length > 0
    ? `This project has the following active modules: ${moduleList.join(', ')}. Agents should be aware of module boundaries when implementing features.`
    : 'This project uses the core Clean Architecture structure without additional modules.';

  return `## Agent Teams Workflow

This project is configured for Claude Code Agent Teams. Use the following workflow to develop features collaboratively.

${moduleNote}

### Team Setup

To start a development team, create agents with these roles:

1. **Architect** (read-only) - Reviews PRD stories, designs implementation approach, validates Clean Architecture compliance before builders start
2. **Builder** (1-2 agents) - Implements features following architect guidance. Claims tasks from the shared task list
3. **Tester** - Writes and runs tests after builder completes. Reports failures back to builder
4. **Reviewer** (read-only) - Reviews completed code for architecture compliance, code quality, and patterns

### Workflow

1. Architect reads the next story from \`prd.json\` and creates implementation tasks
2. Builder(s) claim tasks and implement following Clean Architecture layers (domain first, then data, then presentation)
3. Tester runs \`flutter analyze\` and \`flutter test\` after each task
4. Reviewer checks architecture compliance and Riverpod patterns
5. On approval, commit with: \`feat: [StoryID] - [Story Title]\`

### Task Source

Stories are defined in \`prd.json\`. Each story has:
- \`id\`: Story identifier (e.g., "S-001")
- \`title\`: What to implement
- \`description\`: Detailed requirements
- \`acceptanceCriteria\`: Definition of done
- \`passes\`: Set to \`true\` when all criteria are met`;
}

function generateDevelopmentWorkflow(): string {
  return `## Development Workflow

### Commit Convention

\`\`\`
feat: [StoryID] - Short description of what was added
fix: [StoryID] - Short description of what was fixed
refactor: [StoryID] - Short description of what was refactored
test: [StoryID] - Short description of what was tested
\`\`\`

### File Naming

- Dart files: \`snake_case.dart\`
- Feature directories: \`snake_case\`
- Test files: \`<source_file>_test.dart\`
- Generated files: \`*.g.dart\`, \`*.freezed.dart\` (never edit manually)

### Important Paths

- \`lib/core/router/app_router.dart\` - Route definitions
- \`lib/core/providers/app_providers.dart\` - Global provider barrel
- \`lib/core/theme/app_theme.dart\` - Theme configuration
- \`pubspec.yaml\` - Dependencies
- \`analysis_options.yaml\` - Lint rules`;
}

function getEnabledModuleNames(context: ProjectContext): string[] {
  const modules: string[] = [];
  if (context.modules.auth) modules.push('Auth');
  if (context.modules.api) modules.push('API');
  if (context.modules.database) modules.push('Database');
  if (context.modules.i18n) modules.push('i18n');
  if (context.modules.theme) modules.push('Theme');
  if (context.modules.push) modules.push('Push');
  if (context.modules.analytics) modules.push('Analytics');
  if (context.modules.cicd) modules.push('CI/CD');
  if (context.modules.deepLinking) modules.push('Deep Linking');
  return modules;
}
