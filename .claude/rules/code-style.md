---
paths:
  - "src/**"
---

# Code Style Rules

## TypeScript

- ES module imports only (`import`/`export`, not `require`)
- Strict mode — no `any` types unless absolutely necessary
- `interface` for object shapes, `type` for unions/intersections
- Prefer `readonly` properties where mutation isn't needed
- `async/await` over raw Promises
- Throw typed errors, catch at command level

## Naming

- Source files: `kebab-case.ts` (e.g., `prd-generator.ts`)
- Types/interfaces: `PascalCase` (e.g., `ModuleManifest`)
- Functions: `camelCase` (e.g., `resolveModules`)
- Constants: `UPPER_SNAKE_CASE` for true constants, `camelCase` for config

## Module Definitions

Each module in `src/modules/definitions/<name>/module.ts` exports a `ModuleManifest`:
- `id`: kebab-case identifier
- `requires`: array of module IDs this depends on
- `templateDir`: relative path to `templates/modules/<name>/`
- `ralphPhase`: 1-4 indicating which PRD phase

## Key Principles

- **DRY**: Shared helpers from `tests/helpers/` — never duplicate. Extract after 3+ occurrences.
- **KISS**: Simplest correct solution. Functions > 50 lines → consider splitting.
- **YAGNI**: No features without a story in `prd.json`. No dead code. No speculative abstractions.
