# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-02-19

### Added

- **CLI Commands**: `create`, `add`, and `migrate` commands via Commander.js
- **Scaffold Engine**: Handlebars-based template rendering with file writing, dry-run mode, and conflict detection
- **Core Templates**: Clean Architecture Flutter project with Riverpod, go_router, freezed, and build_runner
- **Module System**: 9 optional modules with dependency resolution via topological sort
  - **auth**: Firebase, Supabase, or custom authentication
  - **api**: Dio HTTP client with interceptors and error handling
  - **database**: Drift (SQLite), Hive, or Isar local storage
  - **i18n**: ARB-based internationalization with Flutter gen-l10n
  - **theme**: Material 3 theming with ColorScheme.fromSeed and dark mode support
  - **push**: Firebase Cloud Messaging or OneSignal push notifications
  - **analytics**: Firebase Analytics with GoRouter route observer
  - **cicd**: GitHub Actions, GitLab CI, or Bitbucket Pipelines
  - **deep-linking**: App Links with go_router integration
- **Module Composer**: Pubspec dependency merging with semver-aware deduplication
- **Config System**: Zod-validated `maxsim.config.yaml` schema with defaults
- **Project Detector**: Analyzes existing Flutter projects for architecture, state management, routing, and module detection
- **Claude Code Integration**: Generates `.claude/` directory for scaffolded projects
  - CLAUDE.md with architecture rules, Riverpod/go_router patterns, and Agent Teams workflow
  - 5 agent definitions (architect, builder, tester, reviewer, docs)
  - 4 skills (flutter-patterns, go-router-patterns, module-conventions, prd)
  - TaskCompleted hook enforcing `flutter analyze` and `flutter test`
  - MCP config for Firebase/Supabase projects
  - PRD generator for Agent Teams task source
- **Claude Code Plugin**: Plugin structure with commands, skills, and setup agent
- **Interactive UI**: @clack/prompts for project creation and module selection
- **Post-Processors**: Optional dart format, flutter pub get, and build_runner execution
