---
name: flutter-add
description: Add a module to an existing maxsim-flutter project
argument-hint: [module-name]
---

Add a module to an existing maxsim-flutter Flutter project.

Run: `npx maxsim-flutter add $ARGUMENTS`

Available modules:
- **auth** - Authentication (Firebase/Supabase/Custom)
- **api** - HTTP client with Dio + interceptors
- **database** - Local database (Drift/Hive/Isar)
- **i18n** - Internationalization with ARB files
- **theme** - Advanced theming with Material 3
- **push** - Push notifications (Firebase/OneSignal)
- **analytics** - Analytics tracking
- **cicd** - CI/CD pipeline (GitHub Actions/GitLab CI/Bitbucket)
- **deep-linking** - Deep linking with App Links/Universal Links

The tool will:
1. Detect the existing project (via maxsim.config.yaml)
2. Check module dependencies and conflicts
3. Generate module files in the correct Clean Architecture structure
4. Merge dependencies into pubspec.yaml
5. Update CLAUDE.md and agents/skills if applicable
