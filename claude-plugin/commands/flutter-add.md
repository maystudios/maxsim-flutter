---
name: flutter-add
description: Add a module to an existing maxsim-flutter project
argument-hint: <module-name>
---

Add a module to an existing maxsim-flutter Flutter project.

Run: `npx maxsim-flutter add $ARGUMENTS`

## Flags
- `--dry-run` - Preview what would change without writing files
- `--project-dir <path>` - Specify project location (default: auto-detect via maxsim.config.yaml)

## Available Modules
- **auth** - Authentication (Firebase / Supabase / Custom)
- **api** - HTTP client with Dio, interceptors, retry logic
- **database** - Local database (Drift / Hive / Isar)
- **i18n** - Internationalization with ARB files
- **theme** - Advanced theming with Material 3 + dark mode
- **push** - Push notifications (Firebase Messaging / OneSignal)
- **analytics** - Analytics tracking with GoRouter observer
- **cicd** - CI/CD pipeline (GitHub Actions / GitLab CI / Bitbucket Pipelines)
- **deep-linking** - Deep linking with App Links + go_router

## What It Does
1. Detect the existing project (via maxsim.config.yaml)
2. Check module dependencies and resolve conflicts
3. Generate module files in the correct Clean Architecture structure
4. Merge dependencies into existing pubspec.yaml
5. Update maxsim.config.yaml with new module configuration
6. Regenerate .claude/ setup (CLAUDE.md, agents, skills) to include the new module
