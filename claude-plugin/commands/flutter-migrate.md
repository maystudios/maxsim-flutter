---
name: flutter-migrate
description: Migrate an existing Flutter project to maxsim-flutter architecture
argument-hint: [--analysis-only]
---

Migrate an existing Flutter project to maxsim-flutter Clean Architecture.

Run: `npx maxsim-flutter migrate $ARGUMENTS`

Options:
- `--analysis-only` - Analyze the project and report what would change without modifying anything
- `--project <path>` - Path to the Flutter project (default: current directory)
- `--dry-run` - Preview changes without applying them

The tool will:
1. Analyze the existing project structure
2. Detect current architecture patterns, state management, routing
3. Report gaps and migration recommendations
4. Create maxsim.config.yaml
5. Add .claude/ setup (agents, skills, CLAUDE.md)
6. Suggest restructuring to Clean Architecture (non-destructive)
