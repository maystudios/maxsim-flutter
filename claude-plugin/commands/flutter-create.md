---
name: flutter-create
description: Create a new Flutter app with Clean Architecture, Riverpod, go_router, and full AI tooling. Runs maxsim-flutter CLI interactively.
argument-hint: [app-name]
---

Create a new Flutter application using maxsim-flutter.

If an app name was provided: `npx maxsim-flutter create $ARGUMENTS`
If no app name: `npx maxsim-flutter create` (interactive mode)

## Flags
- `--yes` - Skip prompts and use defaults
- `--modules auth,api,theme` - Pre-select modules (comma-separated)
- `--config path/to/config.yaml` - Load configuration from file
- `--dry-run` - Preview generated files without writing
- `--no-claude` - Skip Claude Code setup (.claude/ directory)

## What It Does
1. Ask for project details (name, org, description)
2. Let you select target platforms (ios, android, web, macos, windows, linux)
3. Let you choose optional modules (auth, api, database, i18n, theme, push, analytics, cicd, deep-linking)
4. Configure each selected module (auth provider, DB engine, etc.)
5. Generate the Flutter project with Clean Architecture + Riverpod + go_router
6. Set up Claude Code agents, skills, hooks, and CLAUDE.md in the project
7. Generate a PRD for autonomous feature development with Agent Teams

Run the command and follow the interactive prompts.
