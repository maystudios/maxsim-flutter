import type { ProjectContext } from '../core/context.js';

/**
 * Generates an architecture.md document for the scaffolded Flutter project.
 * Includes tech stack, module overview, ASCII provider tree, navigation flow,
 * and (conditionally) a database schema outline.
 */
export function generateArchitectureDoc(context: ProjectContext): string {
  const sections: string[] = [
    `# Architecture — ${context.projectName}`,
    '',
    buildTechStackSection(context),
    buildModuleArchitectureSection(context),
    buildProviderTreeSection(context),
    buildNavigationFlowSection(context),
  ];

  if (context.modules.database) {
    sections.push(buildDatabaseSchemaSection(context.modules.database));
  }

  return sections.join('\n') + '\n';
}

// ---------------------------------------------------------------------------
// Tech Stack
// ---------------------------------------------------------------------------

function buildTechStackSection(context: ProjectContext): string {
  const entries: string[] = [
    '| Technology | Purpose | Rationale |',
    '|-----------|---------|-----------|',
    '| Flutter | UI framework | Cross-platform native UI |',
    '| Riverpod | State management | Compile-safe, testable providers |',
    '| go_router | Navigation | Type-safe, declarative routing |',
    '| freezed | Immutable models | Code-gen for value types |',
    '| dio | HTTP client | Interceptor-first, composable |',
  ];

  if (context.modules.auth) {
    const { provider } = context.modules.auth;
    if (provider === 'firebase') {
      entries.push('| Firebase Auth | Authentication | BaaS with Flutter SDK |');
    } else if (provider === 'supabase') {
      entries.push('| Supabase | Authentication | Open-source BaaS |');
    } else {
      entries.push('| Custom Auth | Authentication | Project-specific auth logic |');
    }
  }

  if (context.modules.database) {
    const { engine } = context.modules.database;
    if (engine === 'drift') {
      entries.push('| Drift | Local database | Type-safe SQLite ORM with code-gen |');
    } else if (engine === 'hive') {
      entries.push('| Hive | Local database | Lightweight key-value NoSQL store |');
    } else {
      entries.push('| Isar | Local database | High-performance embedded NoSQL |');
    }
  }

  if (context.modules.push) {
    const { provider } = context.modules.push;
    if (provider === 'firebase') {
      entries.push('| Firebase Cloud Messaging | Push notifications | Cross-platform push via Firebase |');
    } else {
      entries.push('| OneSignal | Push notifications | Managed push notification service |');
    }
  }

  if (context.modules.i18n) {
    entries.push('| flutter_localizations | Internationalisation | ARB-based i18n with gen-l10n |');
  }

  if (context.modules.analytics) {
    entries.push('| Analytics | Event tracking | Screen views and custom events |');
  }

  return ['## Tech Stack', '', ...entries].join('\n');
}

// ---------------------------------------------------------------------------
// Module Architecture
// ---------------------------------------------------------------------------

function buildModuleArchitectureSection(context: ProjectContext): string {
  const { modules } = context;
  const enabledModules: string[] = [];

  if (modules.auth) enabledModules.push('auth');
  if (modules.api) enabledModules.push('api');
  if (modules.database) enabledModules.push('database');
  if (modules.i18n) enabledModules.push('i18n');
  if (modules.theme) enabledModules.push('theme');
  if (modules.push) enabledModules.push('push');
  if (modules.analytics) enabledModules.push('analytics');
  if (modules.cicd) enabledModules.push('cicd');
  if (modules.deepLinking) enabledModules.push('deepLinking');

  const lines: string[] = ['## Module Architecture', ''];

  if (enabledModules.length === 0) {
    lines.push('Core-only setup — no optional modules enabled.');
    lines.push('');
    lines.push('Each feature follows Clean Architecture:');
    lines.push('');
    lines.push('```');
    lines.push('lib/features/<feature>/');
    lines.push('  domain/         # entities, repository interfaces, use-cases');
    lines.push('  data/           # repository impls, data sources');
    lines.push('  presentation/   # pages, widgets, providers');
    lines.push('```');
  } else {
    lines.push(`Enabled modules: **${enabledModules.join(', ')}**`);
    lines.push('');
    lines.push('Each module lives in `lib/features/<module>/` and follows Clean Architecture:');
    lines.push('');
    lines.push('```');
    lines.push('lib/features/<module>/');
    lines.push('  domain/         # entities, repository interfaces, use-cases');
    lines.push('  data/           # repository impls, data sources');
    lines.push('  presentation/   # pages, widgets, providers');
    lines.push('```');
  }

  lines.push('');
  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Provider Tree
// ---------------------------------------------------------------------------

function buildProviderTreeSection(context: ProjectContext): string {
  const { modules } = context;
  const lines: string[] = ['## Provider Tree', '', '```'];

  lines.push('ProviderScope');
  lines.push('├── routerProvider');

  const providers: string[] = [];

  if (modules.auth) providers.push('authRepositoryProvider');
  if (modules.api) providers.push('dioClientProvider');
  if (modules.database) providers.push('databaseProvider');
  if (modules.push) providers.push('pushTokenProvider');
  if (modules.analytics) providers.push('analyticsServiceProvider');
  if (modules.theme) providers.push('appThemeModeProvider');
  if (modules.i18n) providers.push('localeProvider');

  for (let i = 0; i < providers.length; i++) {
    const isLast = i === providers.length - 1;
    lines.push(`${isLast ? '└──' : '├──'} ${providers[i]}`);
  }

  lines.push('```');
  lines.push('');

  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Navigation Flow
// ---------------------------------------------------------------------------

function buildNavigationFlowSection(context: ProjectContext): string {
  const { modules } = context;
  const lines: string[] = ['## Navigation Flow', '', '```'];

  lines.push('/ (HomeRoute)');

  if (modules.auth) {
    lines.push('├── /login  (LoginRoute)');
    lines.push('├── /register  (RegisterRoute)');
  }

  if (modules.deepLinking) {
    const { scheme, host } = modules.deepLinking;
    const example = scheme && host ? `${scheme}://${host}` : 'app://host';
    lines.push(`└── [deep-link] ${example} → resolved by go_router`);
  }

  lines.push('```');
  lines.push('');

  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Database Schema
// ---------------------------------------------------------------------------

function buildDatabaseSchemaSection(
  database: Exclude<ProjectContext['modules']['database'], false>,
): string {
  const { engine } = database;
  const lines: string[] = ['## Database Schema', ''];

  if (engine === 'drift') {
    lines.push('Engine: **Drift** (type-safe SQLite ORM with code generation)');
    lines.push('');
    lines.push('```sql');
    lines.push('-- Example Drift table (add your tables in lib/features/database/)');
    lines.push('CREATE TABLE items (');
    lines.push('  id    INTEGER PRIMARY KEY AUTOINCREMENT,');
    lines.push('  name  TEXT NOT NULL,');
    lines.push('  created_at  INTEGER NOT NULL');
    lines.push(');');
    lines.push('```');
  } else if (engine === 'hive') {
    lines.push('Engine: **Hive** (lightweight key-value NoSQL)');
    lines.push('');
    lines.push('```dart');
    lines.push('// Example Hive box (define adapters in lib/features/database/)');
    lines.push('@HiveType(typeId: 0)');
    lines.push('class ItemModel extends HiveObject {');
    lines.push('  @HiveField(0)');
    lines.push('  late String name;');
    lines.push('}');
    lines.push('```');
  } else {
    lines.push('Engine: **Isar** (high-performance embedded NoSQL)');
    lines.push('');
    lines.push('```dart');
    lines.push('// Example Isar collection (define in lib/features/database/)');
    lines.push('@collection');
    lines.push('class Item {');
    lines.push('  Id id = Isar.autoIncrement;');
    lines.push('  late String name;');
    lines.push('}');
    lines.push('```');
  }

  lines.push('');
  return lines.join('\n');
}
