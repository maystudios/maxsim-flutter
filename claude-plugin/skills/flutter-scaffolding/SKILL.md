---
name: flutter-scaffolding
description: Provides context about maxsim-flutter's available modules, architecture patterns, and configuration. Use when discussing Flutter project setup options.
user-invocable: false
---

# maxsim-flutter Scaffolding Knowledge

## Architecture: Clean Architecture with Riverpod

Every generated project follows feature-first Clean Architecture:
```
lib/
├── core/           → Shared utilities (router, theme, providers, network)
├── features/       → Feature-first organization
│   └── <feature>/
│       ├── data/           → Repository implementations, DTOs, data sources
│       ├── domain/         → Entities, use cases, repository interfaces (pure Dart)
│       └── presentation/   → Screens, widgets, Riverpod providers
└── shared/         → Shared widgets, extensions, constants
```

**Layer rules:**
- Domain layer has NO dependencies on other layers (pure Dart only)
- Data layer implements domain interfaces, depends on domain
- Presentation layer depends on domain (use cases) via Riverpod providers
- Cross-feature communication goes through domain interfaces only

## State Management: Riverpod 3.x
- `@riverpod` annotations with code generation via `build_runner`
- `AsyncNotifier` for async mutable state
- `Notifier` for sync mutable state
- Provider families for parameterized state
- `ProviderScope` wraps `MaterialApp` in `main.dart`

## Routing: go_router 17.x
- `@TypedGoRoute` annotations with code generation
- `GoRouter` provided via Riverpod provider
- ShellRoute for persistent navigation shells
- Redirect logic based on auth state (when auth module is enabled)
- Deep link handling built-in (when deep-linking module is enabled)

## Available Modules

### auth - Authentication
- **Providers**: firebase, supabase, custom
- **Dependencies**: None
- **Generates**: Login/Register pages, AuthRepository, UserEntity, sign-in/sign-out use cases
- **Packages**: firebase_auth (firebase), supabase_flutter (supabase), dio (custom)

### api - HTTP Client
- **Configuration**: Base URL
- **Dependencies**: None
- **Generates**: Dio client with interceptors (auth, retry), ApiException, ApiRepository
- **Packages**: dio, retrofit, json_annotation, json_serializable

### database - Local Storage
- **Engines**: drift (SQLite), hive (NoSQL), isar (NoSQL)
- **Dependencies**: None
- **Generates**: DatabaseRepository, data source per engine, database provider
- **Packages**: drift + sqlite3_flutter_libs (drift), hive_ce_flutter (hive), isar + isar_flutter_libs (isar)

### i18n - Internationalization
- **Configuration**: Default locale
- **Dependencies**: None
- **Generates**: ARB files (en, de), l10n.yaml, locale provider
- **Packages**: flutter_localizations, intl

### theme - Advanced Theming
- **Configuration**: Seed color (hex), dark mode toggle
- **Dependencies**: None
- **Generates**: Material 3 ThemeData with ColorScheme.fromSeed, theme mode provider
- **Packages**: google_fonts

### push - Push Notifications
- **Providers**: firebase, onesignal
- **Dependencies**: None
- **Generates**: Push notification service, handlers, permission requests
- **Packages**: firebase_messaging (firebase), onesignal_flutter (onesignal)

### analytics - Analytics Tracking
- **Providers**: firebase
- **Dependencies**: None
- **Generates**: AnalyticsService abstraction, GoRouter observer
- **Packages**: firebase_analytics

### cicd - CI/CD Pipelines
- **Providers**: github, gitlab, bitbucket
- **Dependencies**: None
- **Generates**: Pipeline config files (GitHub Actions / GitLab CI / Bitbucket Pipelines)
- **Packages**: None (config files only)

### deep-linking - Deep Links
- **Dependencies**: None
- **Generates**: App Links config, go_router deep link integration
- **Packages**: app_links

## CLI Commands
- `npx maxsim-flutter create [name]` - Create a new project (interactive or with `--yes` for defaults)
- `npx maxsim-flutter add <module>` - Add a module to an existing project
- `npx maxsim-flutter migrate` - Migrate an existing Flutter project

## Claude Code Integration
Generated projects include a full `.claude/` directory with:
- **CLAUDE.md** - Architecture rules, patterns, quality gates
- **Agents** - Architect, builder, tester, reviewer, docs teammates
- **Skills** - Flutter patterns, GoRouter patterns, module conventions, PRD
- **Hooks** - TaskCompleted (flutter analyze + test), TeammateIdle (uncommitted work check)
- **Commands** - add-feature, analyze
