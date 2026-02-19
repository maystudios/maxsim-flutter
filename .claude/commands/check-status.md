---
name: check-status
description: Check current project and Ralph development status
---

Check the current development status:

1. Read `prd.json` and count stories by status:
   - Total stories
   - Completed (passes: true)
   - Remaining (passes: false)
   - Current phase

2. Read `progress.txt` for recent activity

3. Run `npm run typecheck` and `npm test` to verify project health

4. Run `npm run test:coverage` for coverage summary:
   - Statements, branches, functions, lines percentages
   - Whether thresholds are met (80/75/80/80)

5. Report:
   - Phase progress (e.g., "Phase 2: 4/8 stories complete")
   - Next story to implement
   - Any failing quality checks
   - Coverage status
   - Git status (uncommitted changes)
