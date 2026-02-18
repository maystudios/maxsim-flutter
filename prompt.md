# Ralph Iteration Prompt (for Amp CLI)

Read `prd.json` and `progress.txt` in the current directory.

## Your Task

1. Check out the git branch specified in `prd.json` field `branchName`. If already on it, continue.
2. Read `progress.txt` to understand what previous iterations accomplished.
3. In `prd.json`, find the highest-priority user story where `"passes": false`.
4. Implement ONLY that one story. Do not work on multiple stories.
5. Run quality checks:
   - `npm run typecheck` - must pass with zero errors
   - `npm run lint` - must pass with zero errors
   - `npm test` - all tests must pass
6. Fix any issues found by quality checks before proceeding.
7. Commit your changes with: `feat: [Story ID] - [Story Title]`
8. Update `prd.json`: set `"passes": true` for the completed story.
9. Append a timestamped entry to `progress.txt` (NEVER overwrite, always append):
   ```
   ## [Timestamp] - [Story ID]: [Story Title]
   - What was implemented
   - Files created/modified
   - Key decisions made
   - Issues encountered and resolved
   ```
10. Update `AGENTS.md` with any reusable patterns or insights discovered.
11. If ALL user stories in `prd.json` now have `"passes": true`, output: `<promise>COMPLETE</promise>`

## Rules

- ONE story per iteration. No more.
- Quality gates MUST pass before committing.
- Never overwrite `progress.txt` - only append.
- Keep each story's implementation within a single context window.
- Follow the conventions described in `CLAUDE.md`.
