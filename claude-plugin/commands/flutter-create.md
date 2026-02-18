---
name: flutter-create
description: Create a new Flutter app with Clean Architecture, Riverpod, go_router, and full AI tooling. Runs maxsim-flutter CLI interactively.
argument-hint: [app-name]
---

Create a new Flutter application using maxsim-flutter.

If an app name was provided: `npx maxsim-flutter create $ARGUMENTS`
If no app name: `npx maxsim-flutter create` (interactive mode)

The tool will:
1. Ask for project details (name, org, description)
2. Let you select target platforms
3. Let you choose optional modules (auth, api, database, i18n, theme, push, analytics, ci/cd, deep-linking)
4. Configure each selected module
5. Generate the Flutter project with Clean Architecture + Riverpod + go_router
6. Set up Claude Code agents, skills, and CLAUDE.md in the project
7. Optionally generate a Ralph PRD for autonomous feature development

Run the command and follow the interactive prompts.
