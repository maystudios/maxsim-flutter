---
name: check-tdd-compliance
description: Verify TDD compliance — test-source correspondence, coverage, no incomplete tests
---

Check TDD compliance across the project:

1. **Test-Source Correspondence**:
   - For each `.ts` file in `src/`, check for a matching test in `tests/`
   - Report any source files without corresponding tests

2. **Coverage Check**:
   - Run `npm run test:coverage`
   - Verify thresholds: statements >= 80%, branches >= 75%, functions >= 80%, lines >= 80%

3. **No Incomplete Tests**:
   - Search all test files for `it.todo(` and `it.skip(`
   - Report any found — these must be resolved

4. **Behavioral Test Names**:
   - Scan test files for non-behavioral names (e.g., `it('test1')`, `it('works')`)
   - Test names should describe expected behavior

5. **Public Function Coverage**:
   - Check git diff for new exported functions in `src/`
   - Verify each has >= 2 test cases

Report results in a structured table format.
