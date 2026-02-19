---
name: tdd
description: Run TDD workflow actions — generate test specs, write failing tests, implement, refactor, check coverage.
disable-model-invocation: true
argument-hint: [action: spec|red|green|refactor|coverage|status]
---

# TDD Workflow Skill

## Actions

### spec — Generate Test Case List
Given a feature or story, produce a list of test cases (behavioral descriptions):
1. Read the story/feature description
2. Identify happy path, edge cases, and error conditions
3. Output a numbered list of `it('...')` descriptions
4. Include which test file each should go in

### red — Write Failing Test
1. Create or update the test file with a new test case
2. Use shared helpers: `makeTestContext()`, `makeWritableContext()`, `useTempDir()`, `createTestRegistry()`
3. Run: `npm test -- --testPathPattern=<test-file>`
4. Verify the test FAILS (red)

### green — Implement to Pass
1. Write the minimal code to make the failing test pass
2. Run: `npm test -- --testPathPattern=<test-file>`
3. Verify the test PASSES (green)
4. Do NOT add extra functionality

### refactor — Clean Up
1. Improve code structure without changing behavior
2. Run: `npm test` (full suite)
3. Verify ALL tests still pass
4. Apply project conventions from CLAUDE.md

### coverage — Check Coverage
1. Run: `npm run test:coverage`
2. Report coverage percentages vs thresholds:
   - Statements: >= 80%
   - Branches: >= 75%
   - Functions: >= 80%
   - Lines: >= 80%
3. Identify uncovered lines/branches

### status — TDD Progress
1. Count tests by status (passing, failing, todo, skipped)
2. Report test-to-source file mapping completeness
3. Show current coverage summary

## Test Helpers Reference

- `tests/helpers/context-factory.ts` — `makeTestContext()`, `makeWritableContext()`, `DEFAULT_CONTEXT`
- `tests/helpers/temp-dir.ts` — `useTempDir()`, `createTempDir()`, `removeTempDir()`
- `tests/helpers/registry-factory.ts` — `createTestRegistry()`
