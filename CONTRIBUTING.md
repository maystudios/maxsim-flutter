# Contributing to maxsim-flutter

Thank you for helping improve maxsim-flutter! This guide covers everything you need
to contribute code, modules, templates, or documentation.

---

## Table of Contents

1. [Development Setup](#development-setup)
2. [Project Structure](#project-structure)
3. [Development Workflow](#development-workflow)
4. [Test-Driven Development](#test-driven-development)
5. [How to Add a New Module](#how-to-add-a-new-module)
6. [How to Add a New CLI Command](#how-to-add-a-new-cli-command)
7. [Template Guidelines](#template-guidelines)
8. [Quality Gates](#quality-gates)
9. [Pull Request Process](#pull-request-process)

---

## Development Setup

**Prerequisites**

- Node.js >= 18
- npm >= 9
- Git

**Clone and install**

```bash
git clone https://github.com/nicosalm/maxsim-flutter.git
cd maxsim-flutter
npm install
```

**Verify setup**

```bash
npm run typecheck   # should report zero errors
npm test            # should pass all tests
```

---

## Project Structure

```
src/
├── cli/            # Commander.js commands, @clack/prompts interactive UI
├── core/           # Zod config schema, ProjectContext factory, env validator
├── scaffold/       # Handlebars renderer, FileWriter, post-processors
├── modules/        # ModuleRegistry, ModuleResolver, ModuleComposer, definitions
├── ralph/          # PRD JSON generation and story sizing
├── claude-setup/   # Generates .claude/ directory for scaffolded projects
└── types/          # Shared TypeScript interfaces (ModuleManifest, ProjectContext, …)

templates/
├── core/           # Base Clean Architecture Flutter templates (always rendered)
└── modules/        # Per-module Handlebars templates + pubspec.partial.yaml fragments

tests/
├── unit/           # Pure function and class unit tests
├── integration/    # End-to-end tests using temp directories
├── helpers/        # Shared test utilities (makeTestContext, useTempDir, createTestRegistry)
└── fixtures/       # Static test data files
```

See [docs/architecture.md](docs/architecture.md) for a deeper description of each subsystem.

---

## Development Workflow

**Build**

```bash
npm run build       # Compile TypeScript → dist/
npm run dev         # Watch mode
```

**Test**

```bash
npm test                                        # Run all tests
npm test -- --testPathPattern=registry          # Run tests matching a pattern
npm run test:coverage                           # With coverage report
```

**Quality checks (run all before pushing)**

```bash
npm run quality     # typecheck + lint + test
```

Auto-fix lint issues:

```bash
npm run lint:fix
```

---

## Test-Driven Development

All features in this project follow **Red-Green-Refactor**:

1. **RED** — Write a failing test that describes the desired behaviour
2. **GREEN** — Write the minimum code to make it pass
3. **REFACTOR** — Clean up without changing behaviour, then re-run quality gates

### Test file conventions

| Test type | Location | Naming |
|-----------|----------|--------|
| Unit | `tests/unit/` | `<module>.test.ts` |
| Integration | `tests/integration/` | `<feature>-command.test.ts` |

### Shared test helpers (always use these — never duplicate)

```typescript
import { makeTestContext, makeWritableContext } from '../helpers/context-factory.js';
import { useTempDir } from '../helpers/temp-dir.js';
import { createTestRegistry } from '../helpers/registry-factory.js';
```

### ESM mocking pattern

```typescript
import { jest } from '@jest/globals';

// 1. Create mock functions BEFORE importing the module under test
const mockFn = jest.fn<() => Promise<void>>();

// 2. Register the mock
jest.unstable_mockModule('../../src/some/module.js', () => ({
  exportedFn: mockFn,
}));

// 3. Dynamic import AFTER mocks are registered
const { ClassUnderTest } = await import('../../src/some/module.js');
```

---

## How to Add a New Module

Adding a module requires changes to **6 locations**. The `auth` module
(`src/modules/definitions/auth/module.ts`) is the canonical reference.

### Step 1 — Write the manifest

Create `src/modules/definitions/<name>/module.ts`:

```typescript
import type { ModuleManifest } from '../../../types/module.js';

export const manifest: ModuleManifest = {
  id: 'my-module',                         // kebab-case, matches directory name
  name: 'My Module',                       // human-readable
  description: 'What this module does',
  requires: [],                            // other module IDs this depends on
  templateDir: 'templates/modules/my-module',
  ralphPhase: 2,                           // 1=foundation, 2=features, 3=integration, 4=quality
  contributions: {
    pubspecDependencies: {
      'some_package': '^1.0.0',
    },
  },
  questions: [                             // optional interactive config questions
    {
      id: 'option',
      message: 'Which option?',
      type: 'select',
      options: [
        { value: 'a', label: 'Option A' },
        { value: 'b', label: 'Option B' },
      ],
      defaultValue: 'a',
    },
  ],
  isEnabled: (context) => context.modules.myModule !== false,
};
```

### Step 2 — Create templates

Create `templates/modules/<name>/` with Handlebars `.hbs` files:

```
templates/modules/my-module/
├── pubspec.partial.yaml          # dependency fragment (required)
└── lib/features/my_module/
    ├── domain/
    │   └── repositories/my_module_repository.dart.hbs
    ├── data/
    │   └── repositories/my_module_repository_impl.dart.hbs
    └── presentation/
        └── providers/my_module_provider.dart.hbs
```

### Step 3 — Add the pubspec fragment

`templates/modules/<name>/pubspec.partial.yaml`:

```yaml
dependencies:
  some_package: ^1.0.0
```

### Step 4 — Add the Zod sub-schema

In `src/core/config/schema.ts`, add a new schema constant and include it in `MaxsimConfigSchema`:

```typescript
const MyModuleSchema = z.union([
  z.literal(false),
  z.object({
    enabled: z.boolean().default(true),
    option: z.enum(['a', 'b']).default('a'),
  }),
]);

// Inside MaxsimConfigSchema modules object:
myModule: MyModuleSchema.optional(),
```

### Step 5 — Wire the context resolver

In `src/core/context.ts`, add a resolver function and register it:

```typescript
function resolveMyModule(
  raw: MaxsimConfig['modules']['myModule'],
): ProjectContext['modules']['myModule'] {
  if (raw === false || raw === undefined) return false;
  if (!raw.enabled) return false;
  return { option: raw.option };
}

// Inside createProjectContext(), in the modules object:
myModule: resolveMyModule(config.modules.myModule),
```

Also add `myModule: false | { option: 'a' | 'b' }` to the `ProjectContext` `modules` type.

### Step 6 — Register in test helpers

In `tests/helpers/registry-factory.ts`, import and register the new manifest:

```typescript
import { manifest as myModuleManifest } from '../../src/modules/definitions/my-module/module.js';

// Inside createTestRegistry():
registry.register(myModuleManifest);
```

### Checklist

- [ ] `src/modules/definitions/<name>/module.ts` created
- [ ] `templates/modules/<name>/pubspec.partial.yaml` created
- [ ] Zod sub-schema added to `src/core/config/schema.ts`
- [ ] Context resolver added to `src/core/context.ts`
- [ ] `tests/helpers/registry-factory.ts` updated
- [ ] Unit tests written for the manifest and template rendering
- [ ] `npm run quality` passes

---

## How to Add a New CLI Command

All commands follow the same Commander.js factory pattern. Use `add.ts` as a reference.

```typescript
// src/cli/commands/my-command.ts
import { Command } from 'commander';
import * as p from '@clack/prompts';

export function createMyCommand(): Command {
  const cmd = new Command('my-command');

  cmd
    .description('What this command does')
    .argument('[path]', 'Optional argument')
    .option('--dry-run', 'Preview changes without writing')
    .option('--yes', 'Skip confirmation prompts')
    .action(async (arg: string | undefined, options: Record<string, unknown>) => {
      try {
        await runMyCommand(arg, options);
      } catch (err) {
        p.log.error(err instanceof Error ? err.message : String(err));
        process.exit(1);
      }
    });

  return cmd;
}

async function runMyCommand(
  arg: string | undefined,
  options: Record<string, unknown>,
): Promise<void> {
  p.intro('maxsim-flutter — My Command');
  // implementation
  p.outro('Done!');
}
```

Register in `src/cli/index.ts`:

```typescript
import { createMyCommand } from './commands/my-command.js';
program.addCommand(createMyCommand());
```

---

## Template Guidelines

- All templates use `.hbs` extension and receive a `TemplateContext` object
- Use `{{project.name}}`, `{{project.orgId}}` for project fields
- Use `{{#if modules.auth}}` for conditional sections
- Use `{{#ifEquals modules.auth.provider "firebase"}}` for value comparisons (custom helper)
- Keep templates logic-free — complex decisions belong in the TypeScript context builder
- Every module's templates live in `templates/modules/<id>/`
- `pubspec.partial.yaml` must exist in each module template directory for dependency merging

---

## Quality Gates

All 8 gates must pass before any story is marked complete:

1. Tests written **first** (TDD compliance — verified by reviewer)
2. `npm run typecheck` — zero errors
3. `npm run lint` — zero errors
4. `npm test` — all tests pass
5. Coverage meets thresholds defined in `jest.config.mjs` (look them up there, never hardcode)
6. No `it.todo()` or `it.skip()` left in test files
7. Test names describe **behaviour**, not implementation
8. Every new public function has ≥ 2 tests (happy path + edge case)

---

## Pull Request Process

1. Fork the repository and create a branch: `git checkout -b feat/my-feature`
2. Run `npm run quality` — all gates must pass locally before pushing
3. Write a conventional commit message:
   ```
   feat: [Story-ID] - short description of what was added
   fix: short description of bug fixed
   chore: tooling or config change
   docs: documentation only
   ```
4. Open a PR against `main` with a clear description of what changed and why
5. Ensure the CI workflow passes (typecheck + lint + test + build)
6. Request a review — at least one approval required before merge
