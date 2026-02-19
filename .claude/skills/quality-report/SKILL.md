---
name: quality-report
description: Run quality checks and generate a comprehensive report. Use /quality-report for a full quality assessment.
disable-model-invocation: true
argument-hint: [action: full|tests|coverage|types|lint]
---

# Quality Report Skill

## Actions

### full — All Quality Checks
Run all checks and produce a comprehensive report:
1. `npm run typecheck` — TypeScript type safety
2. `npm run lint` — ESLint compliance
3. `npm test` — All tests pass
4. `npm run test:coverage` — Coverage thresholds
5. Scan for `it.todo()` / `it.skip()` remnants
6. Verify test-source file correspondence

### tests — Test Results Only
1. Run `npm test`
2. Report: total, passed, failed, skipped
3. List any failing test names with error summaries

### coverage — Coverage Analysis
1. Run `npm run test:coverage`
2. Report percentages: statements, branches, functions, lines
3. Compare against thresholds (80/75/80/80)
4. List files below threshold

### types — TypeScript Check
1. Run `npm run typecheck`
2. Report: zero errors or list errors with file:line

### lint — Lint Check
1. Run `npm run lint`
2. Report: zero errors or list errors/warnings with file:line

## Report Format

```
## Quality Report

| Check | Status | Details |
|-------|--------|---------|
| Typecheck | PASS/FAIL | N errors |
| Lint | PASS/FAIL | N errors, M warnings |
| Tests | PASS/FAIL | X/Y passed |
| Coverage | PASS/FAIL | stmts: X%, branches: X% |
| No it.todo/skip | PASS/FAIL | N found |
| Test correspondence | PASS/FAIL | N src files without tests |

**Overall: PASS/FAIL**
```
