# ADR-005: Swarm Architecture

**Status**: Superseded by ADR-006
**Date**: 2026-02-18

## Context

We want to use Claude Code's Teams/Swarm mode for parallel agent work during scaffolding.

## Decision

### Specialized Agent Roles

| Agent | Model | Role |
|-------|-------|------|
| flutter-architect | Sonnet 4.6 | Architecture design, Clean Arch compliance |
| flutter-feature-builder | Sonnet 4.6 | Story implementation |
| flutter-tester | Sonnet 4.6 | Test writing and validation |
| flutter-reviewer | Sonnet 4.6 | Code review |
| flutter-docs | Haiku | Documentation |

### Coordination Flow
1. Architect designs approach → creates task dependencies
2. Builder implements (blocked until architect approves)
3. Tester writes tests (after builder completes)
4. Reviewer reviews all code
5. Docs agent documents

### Activation
- Opt-in via `--swarm` flag on create command
- Without flag: sequential scaffold (templates only)
- With flag: parallel agent execution after scaffold

## Consequences

- Swarm mode is slower but produces higher quality output
- Higher API costs (multiple agents)
- Requires Claude Code Teams API (may not be available to all users)
- Optional: non-swarm mode is always available
