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

## Coding Principles

### DRY (Don't Repeat Yourself)
- Use shared helpers from `tests/helpers/` — never duplicate `makeTestContext()`, `useTempDir()`, or `createTestRegistry()` in individual test files
- Config values (coverage thresholds, module lists) are defined once and referenced — never hardcode them in multiple places
- When a pattern appears 3+ times, extract it into a shared helper or utility

### SOLID
- **S (Single Responsibility)**: One module = one concern. Each file in `src/` has a single, clear purpose
- **O (Open/Closed)**: Add new modules via `src/modules/definitions/` — never modify the registry core to add features
- **I (Interface Segregation)**: Keep interfaces minimal. `ModuleManifest` exposes only what consumers need
- **D (Dependency Inversion)**: Commands depend on abstractions (`ProjectContext`, `ModuleManifest`), not concrete implementations

### KISS (Keep It Simple)
- Prefer simple conditionals over clever abstractions
- Functions exceeding 50 lines should be considered for splitting
- Avoid premature optimization — correctness first

### YAGNI (You Aren't Gonna Need It)
- No features without a story in `prd.json`
- No dead code — remove unused exports, functions, and imports immediately
- No speculative abstractions — build for today's requirements

## Test-Driven Development (TDD)

### Red-Green-Refactor Cycle

Every feature follows this cycle:

1. **RED** — Write a failing test first
   ```bash
   npm test -- --testPathPattern=<test-file>   # Must FAIL
   ```
2. **GREEN** — Write minimal code to pass
   ```bash
   npm test -- --testPathPattern=<test-file>   # Must PASS
   ```
3. **REFACTOR** — Clean up without changing behavior
   ```bash
   npm run quality                              # All checks must pass
   ```

### Test File Conventions

```
tests/
├── unit/              # Unit tests for individual modules
│   ├── engine.test.ts
│   ├── engine-errors.test.ts
│   ├── file-writer.test.ts
│   └── ...
├── integration/       # End-to-end tests
│   ├── create-command.test.ts
│   ├── add-command.test.ts
│   └── ...
├── helpers/           # Shared test utilities
│   ├── context-factory.ts   # makeTestContext(), makeWritableContext()
│   ├── temp-dir.ts          # useTempDir(), createTempDir()
│   └── registry-factory.ts  # createTestRegistry()
└── fixtures/          # Test data files
```

### Test Structure Pattern (Arrange-Act-Assert)

```typescript
import { makeTestContext, makeWritableContext } from '../helpers/context-factory.js';
import { useTempDir } from '../helpers/temp-dir.js';
import { createTestRegistry } from '../helpers/registry-factory.js';

describe('FeatureName', () => {
  const tmp = useTempDir('feature-test-');

  it('describes expected behavior in plain English', async () => {
    // Arrange
    const context = makeWritableContext(tmp.path, { /* overrides */ });
    const engine = new ScaffoldEngine({ templatesDir: TEMPLATES_DIR });

    // Act
    const result = await engine.run(context);

    // Assert
    expect(result.filesWritten.length).toBeGreaterThan(0);
  });
});
```

### ESM Mocking Pattern

```typescript
import { jest } from '@jest/globals';

// 1. Create mock functions
const mockFn = jest.fn<() => Promise<void>>();

// 2. Register mocks BEFORE importing the module under test
jest.unstable_mockModule('../../src/some/module.js', () => ({
  exportedFunction: mockFn,
}));

// 3. Dynamic import AFTER mocks are registered
const { ClassUnderTest } = await import('../../src/some/module.js');
```

## Build & Test

```bash
npm install              # Install dependencies
npm run build            # Compile TypeScript
npm run dev              # Watch mode compilation
npm test                 # Run all tests
npm run test:coverage    # Run tests with coverage report
npm run test:ci          # Run tests with coverage in CI mode
npm run typecheck        # Type check without emit
npm run lint             # ESLint
npm run lint:fix         # ESLint with auto-fix
npm run quality          # typecheck + lint + test
npm run quality:full     # typecheck + lint + test with coverage
```

### Targeted Testing

```bash
npm test -- --testPathPattern=engine        # Run tests matching "engine"
npm test -- --testPathPattern=integration   # Run only integration tests
```

## Quality Gates

Before marking any story as complete, ALL 8 gates must pass:

1. **Tests written FIRST** — verified by reviewer (TDD compliance)
2. **`npm run typecheck`** must pass with zero errors
3. **`npm run lint`** must pass with zero errors
4. **`npm test`** must pass all tests
5. **Coverage meets thresholds** — defined in `jest.config.mjs` `coverageThreshold.global` (all agents MUST look up values there, never hardcode)
6. **No `it.todo()` or `it.skip()`** left behind in test files
7. **Test names are behavioral** — describe behavior, not implementation
8. **Every new public function has >= 2 tests** — happy path + at least one edge case

## Error Handling & Recovery

### When `npm run quality` fails
- Identify the specific failing check (typecheck, lint, test, coverage)
- Fix the root cause — never skip or disable checks
- Re-run only the failing check first, then the full suite

### When coverage drops
- Run `npm run test:coverage` to identify uncovered lines
- Write tests targeting the specific uncovered branches/statements
- Coverage thresholds are defined in `jest.config.mjs` `coverageThreshold.global` — all agents MUST look them up there, never hardcode values

### When typecheck fails
- Never use `@ts-ignore` or `as any` to suppress errors
- Fix the type error at its source — add proper types, fix interfaces, or update imports

### When tests fail unexpectedly
- Check for shared state between tests (missing cleanup, leaked mocks)
- Ensure temp directories are cleaned up via `useTempDir()` helper
- Verify `.js` extensions on all ESM imports
- Verify `jest.unstable_mockModule()` is called BEFORE dynamic `import()`

### Escalation Protocol
- After 2 failed attempts at the same fix, escalate to the Architect agent
- Include: what was tried, exact error messages, and relevant file paths

## Handoff Format

Every agent handoff between team members must include:
1. **Changed files** — absolute paths of all modified/created files
2. **Tests added** — file paths and count of new test cases
3. **Quality status** — last `npm run quality` output (pass/fail per gate)
4. **Blockers** — any unresolved issues preventing completion
5. **Next step** — explicit description of what the receiving agent should do

## Agent Team Coordination

### Team Composition

| Agent | Role | When to Use |
|-------|------|-------------|
| `typescript-architect` | Design interfaces, plan architecture | New subsystems, API design, module boundaries |
| `tdd-driver` | Red-Green-Refactor development | Primary development agent for all features |
| `typescript-builder` | Implement features (TDD-aware) | Implementation when tests already exist |
| `tester` | Write tests before implementation | Test spec generation, coverage gaps |
| `reviewer` | Code review with TDD compliance | Before every commit |
| `quality-gate-enforcer` | Run all quality checks | Final validation before merge |
| `flutter-template-expert` | Create/review Handlebars templates | Template creation and Dart code generation |

### Development Flow

```
Architect → TDD Driver → Tester → Builder → Reviewer → Quality Gate Enforcer
    │            │          │         │          │              │
    │   Design   │  Write   │  Write  │  Make    │  Review      │  Final
    │  specs &   │  failing │  more   │  tests   │  code &      │  quality
    │  interfaces│  tests   │  tests  │  pass    │  TDD check   │  report
```

### Communication Protocol

1. **Architect** delivers: interface specs, file paths, test case lists
2. **TDD Driver/Tester** delivers: failing tests with behavioral names
3. **Builder** delivers: implementation that passes all tests
4. **Reviewer** delivers: structured review with TDD compliance check
5. **Quality Gate Enforcer** delivers: pass/fail report with all 8 gates

## Development Workflow

### Option A: Native Claude Code Agent Teams (recommended)

This project is optimized for Claude Code Agent Teams. Enable with:
```
CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1
```

Then tell Claude to create a team:
```
Create an agent team from prd.json. Spawn an architect, a TDD driver,
a tester, a builder, a reviewer, and a quality gate enforcer.
Implement the PRD stories phase by phase using TDD.
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
- Tests are written FIRST (TDD)
- Run quality gates before committing
- Commit with: `feat: [Story-ID] - [Story Title]`
- Append to `progress.txt` (never overwrite)
- Mark story `passes: true` in `prd.json`

## Agent Workflow (CLAUDE.md override from App-Setup)

The system must automatically assemble a task-specific team by selecting the appropriate roles required to complete the objective. Roles may include backend developer, frontend developer, architect, tester, reviewer, analyst, or any other relevant function.

Model usage policy:
- No agent has a hardcoded model — model selection is free at runtime.
- **Opus 4.6** should be used generously — not only for planning and architecture, but also as implementer. Opus produces significantly fewer bugs, handles edge cases better, and gets implementations right on the first attempt. Use Opus for any non-trivial implementation work to avoid costly fix cycles.
- **Sonnet 4.6** is acceptable for simple, well-defined tasks where the requirements are crystal clear and the code is straightforward.
- **Haiku**: Only for truly trivial tasks (formatting, simple scans).
- When in doubt, prefer Opus — one correct Opus implementation is cheaper than multiple Sonnet attempts with bug fixes.

## Git Commit & Push Policy

**Always push after committing.** Do not leave commits sitting locally.

### Commit message format
Follow [Conventional Commits](https://www.conventionalcommits.org/):
- `feat: [Story-ID] - short description` — new features / story work
- `fix: short description` — bug fixes
- `chore: short description` — tooling, config, CI, deps
- `refactor: short description` — code restructuring with no behavior change
- `test: short description` — adding or fixing tests
- `docs: short description` — documentation only

### Workflow order
1. Run quality gates first: `npm run quality`
2. Stage only the relevant files (`git add <files>`) — never blind `git add -A`
3. Commit with a clear conventional-commit message
4. **Push immediately**: `git push` (or `git push -u origin <branch>` for new branches)

### Rules
- One logical change per commit — don't bundle unrelated changes
- Never skip pre-commit hooks (`--no-verify` is forbidden)
- Never force-push to `main`
- Never amend published commits unless explicitly asked
- Always push to remote after every commit — no local-only commits

## Important Paths

- `src/core/config/schema.ts` - Central Zod config schema
- `src/scaffold/engine.ts` - Main scaffolding orchestrator
- `src/modules/definitions/core/module.ts` - Reference module implementation
- `templates/core/` - Base Clean Architecture Flutter templates
- `templates/claude/` - Claude setup templates for generated projects
- `tests/helpers/` - Shared test utilities (context factory, temp dir, registry)
