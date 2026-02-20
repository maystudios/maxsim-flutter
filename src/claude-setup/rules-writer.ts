import { writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import type { ProjectContext } from '../core/context.js';

function frontmatter(paths: string[]): string {
  const pathLines = paths.map((p) => `  - "${p}"`).join('\n');
  return `---\npaths:\n${pathLines}\n---\n\n`;
}

function generateArchitectureRule(): string {
  return (
    frontmatter(['lib/**', 'test/**']) +
    `# Clean Architecture Rules

This project follows Clean Architecture with three layers:

- **domain**: Entities, repository interfaces, use cases. No Flutter or package dependencies.
- **data**: Repository implementations, data sources, DTOs. Implements domain interfaces.
- **presentation**: UI widgets, controllers, Riverpod providers. Depends on domain use cases only.

## Rules
- Never import from \`presentation\` into \`domain\` or \`data\`.
- Never import from \`data\` into \`domain\`.
- Use cases live in \`domain/use_cases/\` and contain business logic only.
- Repository interfaces are defined in \`domain/repositories/\`.
- All external dependencies (network, database) are injected via interfaces.
`
  );
}

function generateRiverpodRule(): string {
  return (
    frontmatter(['lib/**']) +
    `# Riverpod Patterns

Use Riverpod for all state management and dependency injection.

## Rules
- Use \`ref.watch\` for reactive reads inside \`build()\` methods.
- Use \`ref.read\` for one-time reads in event handlers.
- Prefer \`AsyncNotifierProvider\` for async state with loading/error handling.
- Annotate providers with \`@riverpod\` and run \`build_runner\` to generate code.
- Keep providers small and focused — one responsibility per provider.
`
  );
}

function generateGoRouterRule(): string {
  return (
    frontmatter(['lib/**']) +
    `# go_router Navigation Rules

Use go_router for declarative navigation.

## Rules
- Define all routes in a central \`AppRouter\` class.
- Use typed routes with \`GoRoute\` path parameters.
- Redirect guards for authentication go in the \`redirect\` callback.
- Prefer \`context.go()\` for full navigation stack replacement.
- Use \`context.push()\` for stacked navigation.
`
  );
}

function generateTestingRule(): string {
  return (
    frontmatter(['test/**']) +
    `# Testing Conventions

All features must have corresponding test coverage.

## Rules
- Mirror the \`lib/\` structure under \`test/\`.
- Unit test every use case, repository, and provider.
- Use \`mocktail\` or \`mockito\` for mocking dependencies.
- Widget tests go in \`test/presentation/\`.
- Integration tests go in \`test/integration/\`.
- Aim for 80%+ statement and branch coverage.
`
  );
}

function generateSecurityRule(): string {
  return (
    frontmatter(['**']) +
    `# Security Guidelines

Follow these security best practices in all code.

## Secrets & Credentials
- Never hardcode secrets, API keys, or credentials in source code.
- Use \`flutter_secure_storage\` for all sensitive user data and auth tokens.
- Add \`.env\` files and any secrets files to \`.gitignore\`.
- Rotate credentials immediately if they are ever committed accidentally.

## Input Validation
- Validate and sanitize all user inputs before use.
- Use strong typing and Dart's type system to prevent unsafe data flows.
- Avoid \`dynamic\` types for data received from external sources.
- Reject malformed inputs at the boundary — never pass raw external data into business logic.

## Dependency Security
- Only use trusted packages from pub.dev with high scores and active maintenance.
- Pin dependency versions in \`pubspec.yaml\` to avoid unintended upgrades.
- Regularly audit packages with \`flutter pub outdated\` and \`dart pub deps\`.
- Review changelogs before upgrading dependencies with breaking changes.

## API Security
- Use HTTPS for all network requests; never allow plain HTTP in production.
- Implement certificate pinning for high-security endpoints.
- Store auth tokens in \`flutter_secure_storage\`, never in SharedPreferences.
- Never include sensitive data in URL query parameters — use request bodies instead.

## Data Handling & Privacy
- Never log PII (personally identifiable information) such as names, emails, or tokens.
- Use structured logging and redact sensitive fields before writing to any logging output.
- Apply encryption at rest for any sensitive data stored locally.
- Request only the minimum permissions needed; apply the principle of least privilege.
`
  );
}

function generateAuthRule(): string {
  return (
    frontmatter(['lib/features/auth/**', 'test/features/auth/**']) +
    `# Authentication Rules

Guidelines for the auth feature module.

## Rules
- All auth state is managed through the auth provider — never store tokens in plain SharedPreferences.
- Use secure storage for auth tokens and session data.
- Protect routes by checking auth state in go_router redirect guards.
- On logout, clear all cached user data and navigate to the login screen.
- Handle token refresh transparently in the API client interceptor.
`
  );
}

function generateApiRule(): string {
  return (
    frontmatter(['lib/core/api/**', 'lib/data/**']) +
    `# API & HTTP Client Rules

Guidelines for HTTP networking with Dio.

## Rules
- All API calls go through the central Dio client configured in \`core/api/\`.
- Use interceptors for auth token injection and token refresh.
- Map HTTP error responses to typed domain failures — never expose raw Dio exceptions to use cases.
- Use \`retrofit\` or a repository pattern to abstract API endpoints.
- Log requests and responses only in debug mode; never log sensitive data.
`
  );
}

function generateDatabaseRule(): string {
  return (
    frontmatter(['lib/data/**', 'test/data/**']) +
    `# Database & Local Storage Rules

Guidelines for local database and storage access.

## Rules
- All database access is encapsulated in repository implementations under \`data/\`.
- Use Drift (or Hive/Isar) for structured local data; never raw file I/O for app data.
- Define database schema migrations explicitly — never drop and recreate tables.
- Expose only domain models from repositories — never leak database entities to \`domain\` or \`presentation\`.
- Use transactions for multi-step writes to ensure consistency.
`
  );
}

function generateThemeRule(): string {
  return (
    frontmatter(['lib/core/theme/**']) +
    `# Theme & Styling Rules

Guidelines for Material 3 theming.

## Rules
- Define all theme data in \`lib/core/theme/\` using Material 3 and \`ColorScheme.fromSeed()\`.
- Support both light and dark mode via separate \`ThemeData\` instances.
- Never hardcode colors in widgets — always reference \`Theme.of(context).colorScheme\`.
- Use \`TextTheme\` from the theme for all typography — no inline \`TextStyle\` with hardcoded sizes.
- Expose a \`ThemeProvider\` for runtime theme switching (light/dark/system).
`
  );
}

function generatePushRule(): string {
  return (
    frontmatter(['lib/features/push/**', 'test/features/push/**']) +
    `# Push Notification Rules

Guidelines for push notification handling.

## Rules
- All notification logic lives in \`lib/features/push/\`.
- Request notification permission explicitly — never assume it is granted.
- Handle foreground, background, and terminated-state notifications separately.
- Use a dedicated notification service abstraction — never call platform APIs directly from widgets.
- Store the device token securely and refresh it on app start.
`
  );
}

function generateAnalyticsRule(): string {
  return (
    frontmatter(['lib/features/analytics/**', 'test/features/analytics/**']) +
    `# Analytics Rules

Guidelines for event tracking and analytics.

## Rules
- All analytics logic lives in \`lib/features/analytics/\`.
- Use a route observer to automatically track screen views.
- Log events through a central analytics service — never call tracking APIs directly from widgets.
- Define event names as constants to prevent typos and ensure consistency.
- Never log PII (emails, names, tokens) in analytics events.
`
  );
}

function generateCicdRule(): string {
  return (
    frontmatter(['.github/**', 'Makefile', 'Fastfile']) +
    `# CI/CD Pipeline Rules

Guidelines for continuous integration and deployment.

## Rules
- All CI/CD configuration lives in \`.github/\` (GitHub Actions workflows).
- Every PR must pass \`flutter analyze\`, \`flutter test\`, and \`dart format --set-exit-if-changed .\`.
- Use caching for Flutter SDK and pub dependencies to speed up builds.
- Separate workflows for PR checks, staging deployment, and production release.
- Never store secrets in workflow files — use GitHub Actions secrets or environment variables.
`
  );
}

function generateDeepLinkingRule(): string {
  return (
    frontmatter(['lib/core/router/**']) +
    `# Deep Linking Rules

Guidelines for deep link handling with GoRouter.

## Rules
- Configure deep link routes in the central GoRouter configuration under \`lib/core/router/\`.
- Register custom URL schemes and associated domains in platform-specific config files.
- Validate and sanitize all deep link parameters before navigation.
- Provide fallback routes for unrecognized deep links — never crash on malformed URLs.
- Test deep links on both Android and iOS with real device or emulator verification.
`
  );
}

function generateI18nRule(): string {
  return (
    frontmatter(['lib/**']) +
    `# Internationalization (i18n) Rules

Guidelines for localization.

## Rules
- All user-visible strings must be externalized in ARB files under \`l10n/\`.
- Never hardcode display strings in widget code.
- Use \`AppLocalizations.of(context)!\` to access translations.
- Add new strings to all supported locale files before shipping.
- Use ICU message format for plurals and gender variations.
`
  );
}

export async function writeRules(context: ProjectContext, outputPath: string): Promise<void> {
  const rulesDir = join(outputPath, '.claude', 'rules');
  await mkdir(rulesDir, { recursive: true });

  // Core rules — always generated
  await writeFile(join(rulesDir, 'architecture.md'), generateArchitectureRule(), 'utf-8');
  await writeFile(join(rulesDir, 'riverpod.md'), generateRiverpodRule(), 'utf-8');
  await writeFile(join(rulesDir, 'go-router.md'), generateGoRouterRule(), 'utf-8');
  await writeFile(join(rulesDir, 'testing.md'), generateTestingRule(), 'utf-8');
  await writeFile(join(rulesDir, 'security.md'), generateSecurityRule(), 'utf-8');

  // Conditional module rules
  if (context.modules.auth) {
    await writeFile(join(rulesDir, 'auth.md'), generateAuthRule(), 'utf-8');
  }
  if (context.modules.api) {
    await writeFile(join(rulesDir, 'api.md'), generateApiRule(), 'utf-8');
  }
  if (context.modules.database) {
    await writeFile(join(rulesDir, 'database.md'), generateDatabaseRule(), 'utf-8');
  }
  if (context.modules.i18n) {
    await writeFile(join(rulesDir, 'i18n.md'), generateI18nRule(), 'utf-8');
  }
  if (context.modules.theme) {
    await writeFile(join(rulesDir, 'theme.md'), generateThemeRule(), 'utf-8');
  }
  if (context.modules.push) {
    await writeFile(join(rulesDir, 'push.md'), generatePushRule(), 'utf-8');
  }
  if (context.modules.analytics) {
    await writeFile(join(rulesDir, 'analytics.md'), generateAnalyticsRule(), 'utf-8');
  }
  if (context.modules.cicd) {
    await writeFile(join(rulesDir, 'cicd.md'), generateCicdRule(), 'utf-8');
  }
  if (context.modules.deepLinking) {
    await writeFile(join(rulesDir, 'deep-linking.md'), generateDeepLinkingRule(), 'utf-8');
  }
}
