# maxsim-flutter

[![npm version](https://img.shields.io/npm/v/maxsim-flutter.svg)](https://www.npmjs.com/package/maxsim-flutter)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js >= 18](https://img.shields.io/badge/node-%3E%3D18-brightgreen.svg)](https://nodejs.org/)

AI-powered Flutter app scaffolding with Clean Architecture, Riverpod state management, go_router navigation, and autonomous development via Claude Code Agent Teams.

---

## Features

- Scaffold a complete Flutter app with Clean Architecture from a single command
- Interactive prompts or fully non-interactive mode with `--yes` and `--config`
- Nine opt-in feature modules (auth, API client, database, theming, i18n, push notifications, analytics, CI/CD, deep linking)
- Generates a `.claude/` directory with CLAUDE.md, agent definitions, and skills so Claude Code can continue development autonomously
- `add` command to bolt modules onto an existing project after initial creation
- `migrate` command that analyses an existing Flutter project and generates a migration plan with `prd.json` stories
- `maxsim.config.yaml` written to the project root for reproducible re-runs
- Dry-run mode to preview all generated files before committing

---

## Requirements

- Node.js >= 18
- Flutter SDK (optional at scaffold time; required to build and run the generated app)

---

## Installation

Install globally:

```bash
npm install -g maxsim-flutter
```

Or run without installing:

```bash
npx maxsim-flutter <command>
```

---

## Quick Start

```bash
# Interactive: answer prompts for name, org, modules, and platforms
maxsim-flutter create

# Non-interactive: create an app called "my_app" with auth and API modules
maxsim-flutter create my_app --org com.example --modules auth,api --yes

# After creation, enter the project directory and run the app
cd my_app
flutter pub get
flutter run
```

---

## Commands

### `maxsim-flutter create [app-name]`

Creates a new Flutter project with Clean Architecture, Riverpod, and go_router.

If `app-name` is omitted and `--yes` is not set, an interactive prompt is shown.

**Flags**

| Flag | Description |
|------|-------------|
| `--org <id>` | Organisation identifier, e.g. `com.example` (default: `com.example`) |
| `--modules <list>` | Comma-separated list of modules to enable, e.g. `auth,api,theme` |
| `--platforms <list>` | Comma-separated target platforms: `android,ios,web,macos,windows,linux` (default: `android,ios`) |
| `--auth-provider <provider>` | Auth provider when `auth` module is included: `firebase`, `supabase`, or `custom` |
| `--config <file>` | Path to a `maxsim.config.yaml` preset file — skips all prompts |
| `--yes` | Accept all defaults without prompting |
| `--dry-run` | Preview generated files without writing anything to disk |
| `--no-claude` | Skip generating the `.claude/` directory and `CLAUDE.md` |

**Examples**

```bash
# Interactive
maxsim-flutter create

# Minimal non-interactive
maxsim-flutter create shop_app --org com.acme --yes

# Full feature set, non-interactive
maxsim-flutter create shop_app \
  --org com.acme \
  --modules auth,api,database,theme,i18n \
  --platforms android,ios,web \
  --auth-provider firebase \
  --yes

# Load a saved configuration file
maxsim-flutter create --config ./my-preset.yaml

# Preview without writing
maxsim-flutter create my_app --yes --dry-run
```

---

### `maxsim-flutter add [module]`

Adds a feature module to an existing maxsim-flutter project. The command searches for `maxsim.config.yaml` in the current directory and up to five parent directories.

If `module` is omitted, an interactive selection prompt is shown listing only modules not yet enabled in the project.

**Flags**

| Flag | Description |
|------|-------------|
| `--project-dir <path>` | Path to the project directory (default: current directory) |
| `--dry-run` | Preview files that would be generated without writing |

**Examples**

```bash
# Interactive: pick from available modules
maxsim-flutter add

# Add a specific module
maxsim-flutter add push

# Add to a project in another directory
maxsim-flutter add analytics --project-dir ~/projects/my_app

# Preview what the database module would generate
maxsim-flutter add database --dry-run
```

Available module identifiers: `auth`, `api`, `theme`, `database`, `i18n`, `push`, `analytics`, `cicd`, `deep-linking`

---

### `maxsim-flutter migrate [path]`

Analyses an existing Flutter project and, optionally, migrates it to maxsim conventions. Detected architecture, state management, routing, and dependencies are reported. On confirmation the command writes `maxsim.config.yaml`, generates a `.claude/` directory, and creates a `prd.json` file containing story-by-story migration tasks.

**Arguments**

| Argument | Description |
|----------|-------------|
| `[path]` | Path to the Flutter project root (default: current directory) |

**Flags**

| Flag | Description |
|------|-------------|
| `--analysis-only` | Print the analysis report without making any changes |
| `--yes` | Skip the confirmation prompt and apply migration immediately |

**Examples**

```bash
# Analyse the project in the current directory without making changes
maxsim-flutter migrate --analysis-only

# Analyse a project at a specific path
maxsim-flutter migrate ~/projects/legacy_app --analysis-only

# Migrate with confirmation prompt
maxsim-flutter migrate

# Migrate without prompting
maxsim-flutter migrate ~/projects/legacy_app --yes
```

The migration writes non-destructively: if `maxsim.config.yaml`, `CLAUDE.md`, or `prd.json` already exist they are skipped.

---

## Modules

The `core` module is always included. All other modules are opt-in.

| Module | ID | Description | Options |
|--------|----|-------------|---------|
| Core | `core` | Base Clean Architecture structure with Riverpod state management and go_router navigation | Always included |
| Authentication | `auth` | User authentication with login, register, and session management | Provider: `firebase` (default), `supabase`, `custom` |
| API Client | `api` | HTTP client setup with Dio, interceptors, and typed error handling | Base URL (configurable) |
| Theme | `theme` | Advanced Material 3 theming with seed colors, dark/light mode switching via Riverpod | Seed color, dark mode toggle |
| Database | `database` | Local database persistence | Engine: `drift` / SQLite (default), `hive` / NoSQL, `isar` / NoSQL |
| Internationalization | `i18n` | Multi-language support with ARB files and Flutter localization | Default locale |
| Push Notifications | `push` | Push notification support | Provider: `firebase` / FCM (default), `onesignal` |
| Analytics | `analytics` | Analytics event tracking and route observation via Firebase Analytics | — |
| CI/CD | `cicd` | Continuous integration and deployment pipeline configuration | Provider: `github` (default), `gitlab`, `bitbucket` |
| Deep Linking | `deep-linking` | Deep link and universal link handling via app_links with go_router integration | URL scheme, host domain |

---

## Agent Teams Workflow

Every generated project includes a `.claude/` directory pre-configured for Claude Code Agent Teams. This enables autonomous AI-assisted feature development after the initial scaffold.

### Prerequisites

- [Claude Code](https://github.com/anthropics/claude-code) installed and authenticated
- Enable the experimental agent teams feature:

```bash
export CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1
```

### Step-by-step guide

**1. Scaffold the project**

```bash
maxsim-flutter create task_manager --org com.example --modules auth,api --yes
cd task_manager
```

**2. Review the generated prd.json**

The scaffold generates a `prd.json` containing phase-by-phase user stories for the enabled modules. Review and adjust stories to match your product requirements before starting the agent team.

**3. Start a Claude Code session in the project**

```bash
claude
```

**4. Instruct Claude Code to form a team**

```
Create an agent team from prd.json. Spawn an architect, two builders,
a tester, and a reviewer. Implement the PRD stories phase by phase.
```

Claude Code reads the `.claude/agents/` directory, creates a shared task list from `prd.json`, and coordinates the agents:

- **Architect** plans the implementation approach for each story
- **Builders** implement code following the Clean Architecture layers
- **Tester** writes unit and widget tests for new code
- **Reviewer** performs code review and enforces quality gates

**5. Monitor progress**

Agents communicate via the Claude Code task system. Use `/tasks` in your session to see the current state. Each story commit follows the format:

```
feat: [Story-ID] - Story Title
```

**6. Quality gates**

Each story must pass the following before being marked complete:

```bash
flutter analyze        # zero errors
flutter test           # all tests pass
dart format --set-exit-if-changed .
```

**7. Continue development after initial scaffold**

To add a new module and have the agent team implement it:

```bash
maxsim-flutter add push
```

The command regenerates `CLAUDE.md` with updated context. Tell Claude Code:

```
Implement the push notifications module stories from prd.json.
```

---

## Configuration Reference

Every project includes a `maxsim.config.yaml` at its root. You can edit this file and re-run scaffold commands.

```yaml
version: "1"

project:
  name: my_app                  # Flutter package name (snake_case)
  orgId: com.example            # Reverse-DNS organisation ID
  description: "My Flutter app" # Optional description
  minSdkVersion: "21"           # Optional minimum Android SDK version

platforms:
  - android
  - ios
  # also supported: web, macos, windows, linux

modules:
  auth:
    enabled: true
    provider: firebase          # firebase | supabase | custom

  api:
    enabled: true
    baseUrl: https://api.example.com
    timeout: 30000              # Optional request timeout in milliseconds

  database:
    enabled: true
    engine: drift               # drift | hive | isar

  theme:
    enabled: true
    seedColor: "#6750A4"        # Optional Material 3 seed color (hex)
    useMaterial3: true
    darkMode: true

  i18n:
    enabled: true
    defaultLocale: en
    supportedLocales:
      - en
      - es

  push:
    enabled: true
    provider: firebase          # firebase | onesignal

  analytics:
    enabled: true

  cicd:
    enabled: true
    provider: github            # github | gitlab | bitbucket
    targets:
      - android
      - ios

  deep-linking:
    enabled: true
    scheme: myapp               # Custom URL scheme, e.g. myapp://
    host: example.com           # Universal link host

claude:
  enabled: true                 # Generate .claude/ directory (default: true)
  generateAgents: false         # Generate agent definition files
  generateSkills: false         # Generate skill files
  generateHooks: false          # Generate hook files
  agentTeams: false             # Enable agent teams configuration
  mcpServers: []                # MCP server names to include

ralph:
  enabled: false                # Enable Ralph autonomous loop
  maxIterations: 25             # Maximum Ralph iterations

scaffold:
  overwriteExisting: ask        # ask | always | never
  runDartFormat: true           # Run dart format after scaffolding
  runPubGet: true               # Run flutter pub get after scaffolding
  runBuildRunner: false         # Run build_runner after scaffolding
  dryRun: false                 # Preview only, do not write files
```

---

## Contributing

### Development setup

```bash
git clone https://github.com/your-org/maxsim-flutter.git
cd maxsim-flutter
npm install
```

### Build

```bash
npm run build       # Compile TypeScript to dist/
npm run dev         # Watch mode compilation
```

### Testing

```bash
npm test            # Run all tests
npm run test:watch  # Watch mode
```

### Quality checks

All of the following must pass before submitting a pull request:

```bash
npm run typecheck   # TypeScript type checking (zero errors)
npm run lint        # ESLint (zero errors)
npm test            # All tests pass
```

Auto-fix lint issues:

```bash
npm run lint:fix
```

### Project structure

```
src/
  cli/          # CLI entry point, commands (create, add, migrate), interactive prompts
  core/         # Config schema (Zod), project context, environment validator
  scaffold/     # Template rendering engine (Handlebars), file writer, post-processors
  modules/      # Module registry, resolver, composer, and definitions
  ralph/        # PRD generation and story sizing
  claude-setup/ # Generates .claude/ directory for output Flutter projects
  types/        # Shared TypeScript interfaces
templates/
  core/         # Base Clean Architecture Flutter templates
  modules/      # Per-module Handlebars templates
claude-plugin/  # Claude Code plugin definition (commands, agents, skills)
tests/
  unit/         # Unit tests
  integration/  # Integration tests
```

### Commit convention

```
feat: [Story-ID] - Short description
fix: short description
chore: short description
```

---

## License

MIT. See [LICENSE](LICENSE) for details.
