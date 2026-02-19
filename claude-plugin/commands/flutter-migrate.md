---
name: flutter-migrate
description: Migrate an existing Flutter project to maxsim-flutter Clean Architecture
argument-hint: [--analysis-only]
---

Migrate an existing Flutter project to maxsim-flutter Clean Architecture.

Run: `npx maxsim-flutter migrate $ARGUMENTS`

## Flags
- `--analysis-only` - Analyze and report without modifying anything
- `--project <path>` - Path to the Flutter project (default: current directory)
- `--dry-run` - Preview changes without applying them

## What It Does
1. **Analyze** the existing project structure:
   - Detect architecture pattern (Clean Architecture, MVC, MVVM)
   - Detect state management (Riverpod, Bloc, Provider, GetX)
   - Detect routing (go_router, auto_route, Navigator)
   - Detect existing modules (auth, API, database, i18n, etc.)
   - Find Clean Architecture gaps (missing layers per feature)
2. **Report** findings with difficulty assessment and recommendations
3. **Migrate** (if not `--analysis-only`):
   - Create maxsim.config.yaml from detected settings
   - Add .claude/ directory (agents, skills, CLAUDE.md, hooks)
   - Generate migration PRD with phased stories
4. All operations are **non-destructive** - existing files are never deleted or overwritten
