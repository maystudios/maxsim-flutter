---
name: flutter-scaffolding
description: Provides context about maxsim-flutter's available modules, architecture patterns, and configuration. Use when discussing Flutter project setup options.
user-invocable: false
---

# maxsim-flutter Scaffolding Knowledge

## Architecture: Clean Architecture with Riverpod

Every generated project follows:
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

## State Management: Riverpod 3.x
- `@riverpod` annotations with code generation
- `AsyncNotifier` for async mutable state
- `Notifier` for sync mutable state
- Provider families for parameterized state
- No deprecated StateProvider/StateNotifierProvider

## Routing: go_router 17.x
- `@TypedGoRoute` annotations with code generation
- ShellRoute for persistent navigation shells
- Redirect logic based on auth state
- Deep link handling built-in

## Available Modules
- auth, api, database, i18n, theme, push, analytics, cicd, deep-linking

## CLI Commands
- `npx maxsim-flutter create` - New project
- `npx maxsim-flutter add <module>` - Add module
- `npx maxsim-flutter migrate` - Migrate existing project
