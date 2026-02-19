---
name: prd
description: Generate or update the PRD (prd.json) for maxsim-flutter development. Use when adding new features or re-planning stories.
disable-model-invocation: true
argument-hint: [action: generate|add-story|status|test-spec]
---

# PRD Management Skill

## Actions

### Generate Full PRD
Generate a complete prd.json following Ralph's format with phased user stories.
Acceptance criteria for every story MUST include: "Tests written first (TDD)"

### Add Story
Add a new user story to the existing prd.json:
```json
{
  "id": "PX-NNN",
  "phase": N,
  "priority": N,
  "title": "...",
  "description": "...",
  "acceptanceCriteria": ["Tests written first (TDD)", "..."],
  "passes": false
}
```

### Status
Read prd.json and progress.txt, report:
- Total stories vs completed
- Current phase progress
- Next story to implement
- Estimated remaining iterations

### Test Spec
Generate a test case list for a specific story:
1. Read the story from prd.json
2. Identify behavioral test cases (happy path, edge cases, errors)
3. Output numbered list of `it('...')` descriptions
4. Specify target test file(s)

## Rules

- Story IDs follow format: P{phase}-{number} (e.g., P1-001, P2-005)
- Each story must be completable in one context window
- Acceptance criteria must be verifiable by automated checks
- Stories are ordered by priority (lower = higher priority)
- ALL stories must include "Tests written first (TDD)" in acceptance criteria
