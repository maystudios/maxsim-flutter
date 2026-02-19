---
name: start-team
description: Start an Agent Team to implement the next batch of PRD stories from the current phase
---

# Start Agent Team for PRD Implementation

You are the **Team Lead**. Your job is to orchestrate a full agent team that implements all incomplete stories from the current PRD phase using TDD.

## Step 1: Analyze PRD State

Read `prd.json` and determine:
1. Which stories have `"passes": false`
2. Group them by phase
3. Identify the **lowest phase number** that still has incomplete stories — this is the **current phase**
4. Collect all incomplete stories from that phase — these are the **sprint stories**

If ALL stories have `"passes": true`, report that the PRD is fully complete and stop.

Report to the user:
- Current phase number and name
- Number of stories in this sprint
- Story IDs and titles

## Step 2: Pre-flight Checks

Before spawning the team, verify:
1. `git status` — working directory is clean (no uncommitted changes)
2. `npm run build` — project compiles
3. `npm test` — existing tests pass

If any check fails, report the issue and stop. Do NOT proceed with a broken baseline.

## Step 3: Create the Agent Team

Create a team named `prd-sprint` using TeamCreate.

Then create tasks from the sprint stories using TaskCreate. Each PRD story becomes one task with:
- **subject**: `[Story-ID] Story title`
- **description**: Full story description + acceptance criteria from prd.json
- **activeForm**: `Implementing [Story-ID]`

Set up task dependencies: stories within the same phase should be ordered by priority (lower priority number = do first). Use `addBlockedBy` to chain them sequentially.

## Step 4: Spawn Teammates

Spawn all 6 agent roles using the Task tool with `team_name: "prd-sprint"`:

| Name | subagent_type | Model | Role |
|------|--------------|-------|------|
| `architect` | `typescript-architect` | `sonnet` | Reviews architecture before implementation starts |
| `tdd-driver` | `tdd-driver` | `sonnet` | Writes failing tests first (RED), then implements (GREEN) |
| `tester` | `tester` | `sonnet` | Writes additional tests, validates coverage |
| `builder` | `typescript-builder` | `sonnet` | Implements features to make tests pass |
| `reviewer` | `reviewer` | `haiku` | Reviews code for quality and TDD compliance |
| `quality-gate` | `quality-gate-enforcer` | `haiku` | Runs all 8 quality gates before story completion |

Give each teammate this initial prompt:

> You are part of the `prd-sprint` team working on maxsim-flutter.
> Read the team config at `~/.claude/teams/prd-sprint/config.json` to discover your teammates.
> Check `TaskList` for available tasks. Claim unblocked tasks matching your role.
> Follow CLAUDE.md conventions strictly. Coordinate with teammates via SendMessage.
> Report completion or blockers to the team lead.

## Step 5: Orchestrate the TDD Flow

For each story, coordinate this sequence:

### 5a. Architecture Review (Architect)
- Assign the story task to `architect`
- Architect reads the story, identifies files to create/modify, designs interfaces
- Architect sends handoff to `tdd-driver` with: interface specs, file paths, test case list

### 5b. RED Phase (TDD Driver)
- `tdd-driver` writes failing tests based on architect's spec
- Runs `npm test -- --testPathPattern=<file>` to confirm tests FAIL
- Sends handoff to `builder` with: test file paths, expected behavior

### 5c. GREEN Phase (Builder)
- `builder` writes minimal implementation to pass the failing tests
- Runs `npm test -- --testPathPattern=<file>` to confirm tests PASS
- Sends handoff to `tester` for additional coverage

### 5d. Additional Tests (Tester)
- `tester` adds edge case and error tests
- Verifies coverage meets thresholds
- Sends handoff to `reviewer`

### 5e. Code Review (Reviewer)
- `reviewer` checks TDD compliance, architecture, code quality
- If issues found, sends feedback to `builder` for fixes
- If approved, sends handoff to `quality-gate`

### 5f. Quality Gates (Quality Gate Enforcer)
- `quality-gate` runs all 8 quality gates from CLAUDE.md
- If any gate fails, sends details back to `builder`/`tester` for fixes
- If all gates pass, reports SUCCESS to team lead

## Step 6: Commit & Push (Team Lead)

After quality gates pass for a story:

1. Stage only the relevant files: `git add <changed-files>`
2. Commit with conventional message: `feat: [Story-ID] - Story title`
3. Push immediately: `git push`
4. Update `prd.json`: set `"passes": true` for the completed story
5. Append to `progress.txt`:
   ```
   ## [Story-ID] - Story title
   - Status: COMPLETE
   - Files: <list of changed files>
   - Tests: <count> new test cases
   - Date: <current date>
   ```
6. Commit the prd.json and progress.txt updates: `chore: mark [Story-ID] complete`
7. Push again: `git push`

## Step 7: Next Story or Wrap Up

After completing a story:
- Check TaskList for remaining stories in the sprint
- If more stories remain, go back to Step 5 with the next story
- If all stories in the phase are done, report the sprint summary:
  - Stories completed
  - Total files changed
  - Total tests added
  - Coverage summary
  - Any issues encountered

Then gracefully shut down all teammates via `SendMessage` with `type: "shutdown_request"` and clean up with `TeamDelete`.

## Error Recovery

- **Build fails**: Stop, identify the breaking change, fix before continuing
- **Tests fail unexpectedly**: Check for shared state leaks, missing cleanup
- **Quality gate fails**: Route back to the responsible agent (builder/tester) for fixes
- **Agent stuck**: After 2 failed attempts at the same fix, escalate — reassign to a different agent or ask the user
- **Merge conflict**: Stop and ask the user — never force-resolve conflicts autonomously

## Rules

- NEVER skip TDD — tests must exist and fail BEFORE implementation
- NEVER bypass quality gates — all 8 must pass before commit
- NEVER force-push or amend published commits
- ALWAYS push after every commit — no local-only commits
- ALWAYS use shared test helpers from `tests/helpers/`
- Coverage thresholds come from `jest.config.mjs` — never hardcode
