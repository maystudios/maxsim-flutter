# ADR-004: Ralph Integration

**Status**: Superseded by ADR-006
**Date**: 2026-02-18

## Context

Ralph (https://github.com/snarktank/ralph) is an autonomous AI agent loop that processes PRD stories. We want to integrate it for both building maxsim-flutter itself AND as a feature in generated Flutter apps.

## Decision

### Dual Ralph Usage

1. **Building maxsim-flutter**: Ralph runs against our prd.json to implement the tool itself
2. **In generated apps**: maxsim-flutter generates a prd.json + ralph.sh for the output Flutter project

### PRD Phase Structure (for generated apps)
```
Phase 1 - Foundation: Project skeleton, routing, state management
Phase 2 - Modules:    Per-module implementation stories
Phase 3 - Integration: Cross-module wiring (auth→api, push→analytics, etc.)
Phase 4 - Quality:    Tests, CI/CD, performance
```

### Story Sizing
Stories are estimated by token cost (description + acceptance criteria + estimated files). Stories exceeding 8000 tokens are automatically split at logical boundaries.

### Completion Signal
Ralph detects `<promise>COMPLETE</promise>` in AI output to know all stories are done.

## Consequences

- PRD quality directly determines Ralph success
- Stories must be small enough for one context window
- Progress is tracked in append-only progress.txt
- Each iteration is stateless (AI has no memory of previous runs)
