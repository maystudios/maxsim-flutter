---
paths:
  - "**"
---
# Context Management

## The 70% Rule
Context quality degrades at 70%+ fill. Act proactively.

## When to /clear
- Between unrelated tasks
- After completing a story
- When Claude repeats itself or ignores instructions
- After verbose debugging sessions

## When to Use Subagents
- Scanning large directory trees (> 50 files)
- Reading multiple large files for research
- Running verbose commands with long output
- Exploring unfamiliar codebase areas

## File Ownership in Agent Teams
- Each agent owns specific directories (see start-team command)
- Never modify files another agent is actively editing
- Use blockedBy task dependencies to serialize conflicting edits

## Key Paths for This Project
- `src/claude-setup/` — generated Claude setup (generators)
- `src/modules/` — module definitions
- `tests/` — all tests (unit + integration)
- `.claude/` — own agentic setup
