---
name: tdd-cycle
description: Run a full TDD cycle for a story — design spec, RED, GREEN, REFACTOR, validate, commit
---

Run a complete TDD cycle for the given story or feature:

1. **Spec**: Read the story/feature. Design test cases (behavioral descriptions).

2. **RED**: Write failing tests using shared helpers:
   - `makeTestContext()` / `makeWritableContext()` from `tests/helpers/context-factory.ts`
   - `useTempDir()` from `tests/helpers/temp-dir.ts`
   - `createTestRegistry()` from `tests/helpers/registry-factory.ts`
   - Run `npm test -- --testPathPattern=<file>` — confirm tests FAIL

3. **GREEN**: Write minimal implementation to pass tests.
   - Run `npm test -- --testPathPattern=<file>` — confirm tests PASS

4. **REFACTOR**: Clean up code and tests.
   - Run `npm run quality` — all checks must pass

5. **VALIDATE**: Run full quality gates:
   - `npm run typecheck` — zero errors
   - `npm run lint` — zero errors
   - `npm test` — all tests pass
   - No `it.todo()` or `it.skip()` remnants

6. **COMMIT**: Stage changes and commit with conventional message.
   - `git add <files>`
   - `git commit -m "feat: [Story-ID] - description"`
   - `git push`
