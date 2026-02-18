# CLAUDE.md - maxsim-flutter

## Project Overview

**maxsim-flutter** is an npm-distributed TypeScript CLI tool + Claude Code plugin for scaffolding Flutter apps with Clean Architecture, Riverpod, go_router, and full AI-assisted development via Ralph.

## Tech Stack

- **Language**: TypeScript (ES2022, NodeNext modules)
- **Runtime**: Node.js >= 18
- **Package Manager**: npm
- **Template Engine**: Handlebars (.hbs files)
- **Config Validation**: Zod
- **CLI Framework**: Commander.js
- **Interactive UI**: @clack/prompts
- **Process Execution**: execa
- **Testing**: Jest with ts-jest

## Architecture

This project follows a clean separation of concerns:

```
src/
├── cli/          # CLI entry point, commands, interactive prompts
├── core/         # Config schema, project context, validation
├── scaffold/     # Template rendering engine, file writing, post-processors
├── modules/      # Module system (registry, resolver, composer, definitions)
├── ralph/        # PRD generation, story sizing
├── claude-setup/ # Generates .claude/ directory for output Flutter projects
└── types/        # Shared TypeScript interfaces
```

## Code Conventions

### TypeScript
- Use ES module imports (`import`/`export`, not `require`)
- Strict mode enabled - no `any` types unless absolutely necessary
- Use `interface` for object shapes, `type` for unions/intersections
- Prefer `readonly` properties where mutation isn't needed
- Use `async/await` over raw Promises
- Error handling: throw typed errors, catch at command level

### File Naming
- Source files: `kebab-case.ts` (e.g., `prd-generator.ts`)
- Types/interfaces: `PascalCase` (e.g., `ModuleManifest`)
- Functions: `camelCase` (e.g., `resolveModules`)
- Constants: `UPPER_SNAKE_CASE` for true constants, `camelCase` for config

### Module Definitions
Each module in `src/modules/definitions/<name>/module.ts` exports a `ModuleManifest`:
- `id`: kebab-case identifier
- `requires`: array of module IDs this depends on
- `templateDir`: relative path to `templates/modules/<name>/`
- `ralphPhase`: 1-4 indicating which PRD phase

### Templates
- All Handlebars templates use `.hbs` extension
- Template context always receives a `TemplateContext` object
- Use `{{#if modules.auth}}` for conditional sections
- Pubspec fragments in `pubspec.partial.yaml` per module

## Build & Test

```bash
npm install          # Install dependencies
npm run build        # Compile TypeScript
npm run dev          # Watch mode compilation
npm test             # Run all tests
npm run typecheck    # Type check without emit
npm run lint         # ESLint
npm run lint:fix     # ESLint with auto-fix
```

## Quality Gates (for Ralph iterations)

Before marking any story as complete:
1. `npm run typecheck` must pass with zero errors
2. `npm run lint` must pass with zero errors
3. `npm test` must pass all tests
4. New code must have corresponding tests in `tests/`

## Development Workflow

### Option A: Native Claude Code Agent Teams (recommended)

This project is optimized for Claude Code Agent Teams. Enable with:
```
CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1
```

Then tell Claude to create a team:
```
Create an agent team from prd.json. Spawn an architect, two builders,
a tester, and a reviewer. Implement the PRD stories phase by phase.
```

Claude Code handles everything natively:
- Team Lead reads `prd.json` and creates shared tasks
- Teammates claim tasks and communicate directly with each other
- Agent definitions in `.claude/agents/` provide specialized roles
- `TaskCompleted` hooks enforce quality gates

### Option B: Ralph Loop (simple fallback)
`./ralph.sh --tool claude 25` — Simple bash loop, one story per iteration.
Works without Agent Teams. Good for simpler tasks.

### For all development iterations:
- Each iteration implements ONE user story
- Run quality gates before committing
- Commit with: `feat: [Story-ID] - [Story Title]`
- Append to `progress.txt` (never overwrite)
- Mark story `passes: true` in `prd.json`

## Agent Workflow (CLAUDE.md override from App-Setup)

The system must automatically assemble a task-specific team by selecting the appropriate roles required to complete the objective. Roles may include backend developer, frontend developer, architect, tester, reviewer, analyst, or any other relevant function.

Model usage policy:
- **Haiku**: Simple, lightweight tasks (scanning, formatting, basic analysis)
- **Sonnet 4.6**: Default for majority of work (implementation, refactoring, tests)
- **Opus 4.6**: Reserved strictly for very high-complexity tasks

Effort selection: Low/Medium for everyday work, High only for genuinely complex tasks.

## Important Paths

- `src/core/config/schema.ts` - Central Zod config schema
- `src/scaffold/engine.ts` - Main scaffolding orchestrator
- `src/modules/definitions/core/module.ts` - Reference module implementation
- `templates/core/` - Base Clean Architecture Flutter templates
- `templates/claude/` - Claude setup templates for generated projects
