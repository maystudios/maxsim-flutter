# ADR-003: Module System

**Status**: Accepted
**Date**: 2026-02-18

## Context

Users need to select which features their Flutter app should include. We need a modular system that handles dependencies, conflicts, and clean composition.

## Decision

### ModuleManifest-based System
Each module is a self-contained definition that declares:
- Dependencies on other modules (`requires`)
- Conflicts with other modules (`conflicts`)
- Template directory and pubspec fragment
- Interactive configuration questions
- Ralph PRD stories for autonomous implementation
- Claude agent/skill contributions

### Available Modules

| Module | Dependencies | Config Options |
|--------|-------------|---------------|
| auth | - | provider: firebase/supabase/custom |
| api | - | baseUrl, timeout |
| database | - | engine: drift/hive/isar |
| i18n | - | defaultLocale, supportedLocales |
| theme | - | seedColor, useMaterial3 |
| push | auth (firebase) | provider: firebase/onesignal |
| analytics | - | provider |
| cicd | - | provider: github/gitlab/bitbucket |
| deep-linking | - | scheme, host |

### Dependency Resolution
Topological sort ensures modules are processed in dependency order. Circular dependencies are rejected at parse time.

### Composition Strategy
- Pubspec fragments merged (newer version wins on conflict)
- Provider contributions injected into app_providers.dart
- Each module's files scoped to its feature directory

## Consequences

- Adding new modules requires: module.ts + templates + pubspec.partial.yaml
- Module interactions handled via integration phase in Ralph PRD
- Config schema must evolve with new modules
