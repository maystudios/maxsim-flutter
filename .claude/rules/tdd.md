---
paths:
  - "tests/**"
  - "src/**"
---

# TDD Rules

## Red-Green-Refactor Cycle

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

## Test File Layout

- Unit tests: `tests/unit/<module-name>.test.ts`
- Integration tests: `tests/integration/<feature>.test.ts`
- Helpers: `tests/helpers/` (NEVER duplicate these in test files)
- Fixtures: `tests/fixtures/`

## Shared Test Helpers (MUST use)

```typescript
import { makeTestContext, makeWritableContext } from '../helpers/context-factory.js';
import { useTempDir } from '../helpers/temp-dir.js';
import { createTestRegistry } from '../helpers/registry-factory.js';
```

- `context-factory.ts` — `makeTestContext()`, `makeWritableContext()`, `DEFAULT_CONTEXT`
- `temp-dir.ts` — `useTempDir()`, `createTempDir()`, `removeTempDir()`
- `registry-factory.ts` — `createTestRegistry()`

## ESM Mocking Pattern

```typescript
import { jest } from '@jest/globals';

// 1. Create mock functions FIRST
const mockFn = jest.fn<() => Promise<void>>();

// 2. Register mocks BEFORE importing the module under test
jest.unstable_mockModule('../../src/some/module.js', () => ({
  exportedFunction: mockFn,
}));

// 3. Dynamic import AFTER mocks are registered
const { ClassUnderTest } = await import('../../src/some/module.js');
```

## Test Structure (Arrange-Act-Assert)

```typescript
describe('FeatureName', () => {
  const tmp = useTempDir('feature-test-');

  it('describes expected behavior in plain English', async () => {
    // Arrange
    const context = makeWritableContext(tmp.path, { /* overrides */ });

    // Act
    const result = await engine.run(context);

    // Assert
    expect(result.filesWritten.length).toBeGreaterThan(0);
  });
});
```

## Naming Convention

- GOOD: `it('returns empty array when no modules are enabled')`
- GOOD: `it('throws ConfigError when orgId is missing')`
- BAD: `it('test1')`, `it('works')`, `it('should work')`

## Coverage

Thresholds are defined in `jest.config.mjs` `coverageThreshold.global` — always look them up there, NEVER hardcode values.
