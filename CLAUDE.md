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
- **Testing**: Jest with ts-jest (ESM mode)

## Code Conventions

- Use ES module imports (`import`/`export`, not `require`)
- Strict mode enabled — no `any` types unless absolutely necessary
- `interface` for object shapes, `type` for unions/intersections
- File naming: `kebab-case.ts`, Types: `PascalCase`, Functions: `camelCase`
- Error handling: throw typed errors, catch at command level
- IMPORTANT: Use shared test helpers from `tests/helpers/` — never duplicate them
- IMPORTANT: Coverage thresholds live in `jest.config.mjs` `coverageThreshold.global` — never hardcode values

Detailed conventions: see `.claude/rules/code-style.md`, `.claude/rules/error-recovery.md`, `.claude/rules/context-management.md`

## Build & Test

```bash
npm run build            # Compile TypeScript
npm test                 # Run all tests
npm run test:coverage    # Tests with coverage report
npm run typecheck        # Type check without emit
npm run lint             # ESLint
npm run quality          # typecheck + lint + test (run before every commit)
npm run quality:full     # typecheck + lint + test with coverage
```

Targeted: `npm test -- --testPathPattern=engine`

## Quality Gates

IMPORTANT: Before marking any story complete, ALL 8 gates must pass:

1. **Tests written FIRST** — TDD compliance verified by reviewer
2. **`npm run typecheck`** — zero errors
3. **`npm run lint`** — zero errors
4. **`npm test`** — all tests pass
5. **Coverage meets thresholds** — from `jest.config.mjs` (never hardcode)
6. **No `it.todo()` or `it.skip()`** left behind
7. **Test names are behavioral** — describe behavior, not implementation
8. **Every new public function has >= 2 tests** — happy path + edge case

## Error Handling & Recovery

See `.claude/rules/error-recovery.md` for 4-tier escalation protocol.
- **Quality/typecheck fails**: Fix root cause, never skip or use `@ts-ignore`.
- **Tests fail**: Check shared state, temp-dir cleanup, `.js` ESM extensions, mock ordering.
- **Escalation**: After 2 failed attempts, escalate with: what was tried, exact errors, file paths.

## Security

- **NEVER** commit secrets, API keys, or credentials
- **NEVER** use `@ts-ignore`, `as any` — fix at source
- Deny `.env`, `.env.*`, `*.pem`, `*.key` in settings.json

## Development Workflow

### TDD Cycle (Red-Green-Refactor)

Every feature follows: RED (failing test) → GREEN (minimal pass) → REFACTOR (clean up).
Detailed TDD patterns, test helpers, and ESM mocking: see `.claude/rules/tdd.md`

### Agent Teams (recommended)

Agent roles are defined in `.claude/agents/`. See each definition for responsibilities and handoff protocols.

Use `/start-team` to orchestrate a full sprint from `prd.json`.
Use `./ralph.sh --tool claude 25` as simple fallback (one story per iteration).

### Iteration Protocol

- Each iteration implements ONE user story from `prd.json`
- Tests are written FIRST (TDD)
- Quality gates must pass before commit
- Commit with: `feat: [Story-ID] - [Story Title]`
- Append to `progress.txt` (never overwrite)
- Mark story `passes: true` in `prd.json`

## Model Usage Policy

- **Opus 4.6**: Use generously — for architecture, planning, AND non-trivial implementation. Fewer bugs, better edge-case handling. Prefer Opus when in doubt.
- **Sonnet 4.6**: Simple, well-defined tasks with clear requirements.
- **Haiku**: Only truly trivial tasks (formatting, simple scans).

## Git Commit & Push Policy

**Always push after committing.** Follow [Conventional Commits](https://www.conventionalcommits.org/).
Detailed rules: see `.claude/rules/git-workflow.md`

## Handoff Format

Include: changed files (absolute paths), tests added, quality status (`npm run quality` output), blockers, next step.

## Important Paths

- `src/core/config/schema.ts` — Central Zod config schema
- `src/scaffold/engine.ts` — Main scaffolding orchestrator
- `src/modules/definitions/core/module.ts` — Reference module implementation
- `templates/core/` — Base Clean Architecture Flutter templates
- `templates/claude/` — Claude setup templates for generated projects
- `tests/helpers/` — Shared test utilities (context factory, temp dir, registry)
