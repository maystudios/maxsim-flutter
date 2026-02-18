# ADR-006: Native Claude Code Agent Teams (no custom orchestrator)

**Status**: Accepted (supersedes ADR-004 and ADR-005)
**Date**: 2026-02-18

## Context

We initially planned to build a custom TypeScript orchestrator (`src/swarm/`) that programmatically manages teams via TeamCreate, TaskCreate, SendMessage APIs. Analysis revealed this is unnecessary and counter-productive:

1. Claude Code Agent Teams is a native feature - users just say "Create an agent team" in natural language
2. Teammates communicate directly with each other (full mesh, not hub-and-spoke)
3. They share a task list and self-coordinate
4. Building a custom orchestrator duplicates native functionality and adds maintenance burden

## Decision

### No custom orchestrator. Use native Claude Code Agent Teams.

**Our job**: Generate Flutter projects that are optimized for Agent Teams.

**What we provide in generated projects:**

1. **Comprehensive CLAUDE.md** - Describes architecture, phases, roles, conventions clearly enough that a Team Lead can coordinate work effectively
2. **Agent definitions** (`.claude/agents/`) - Specialized teammates:
   - `flutter-architect.md` - Architecture design, Clean Arch compliance review
   - `flutter-feature-builder.md` - Story/feature implementation
   - `flutter-tester.md` - Test writing and validation
   - `flutter-reviewer.md` - Code review
   - `flutter-docs.md` - Documentation
3. **PRD file** (`prd.json`) - Task source that the Team Lead loads into the shared task list
4. **Hooks** - `TaskCompleted` hook enforcing `flutter analyze` + `flutter test` before marking tasks done
5. **Skills** - `/prd` for generating new PRDs, `/analyze` for quality checks

### How users work with it

```
# 1. Create project
npx maxsim-flutter create my_app --modules auth,api,theme

# 2. Open in Claude Code (with Agent Teams enabled)
cd my_app
CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1 claude

# 3. Tell Claude to create a team
> "Create an agent team from prd.json. Spawn an architect, two builders,
   a tester, and a reviewer. Have them implement the PRD stories phase by phase."

# Claude Code handles the rest natively:
# - Creates team, spawns teammates
# - Teammates claim tasks from shared list
# - Direct communication between teammates
# - Quality gates via hooks
```

### Ralph as simple automation

`ralph.sh` remains as a simpler, single-agent automation loop. It doesn't use Teams - it just calls `claude -p` in a loop. Good for users without Teams access or for simpler tasks.

## What we removed

- `src/swarm/` directory (orchestrator.ts, agent-runner.ts, phases.ts, worktree-manager.ts)
- `src/cli/commands/orchestrate.ts`
- `--orchestrate` flag on create/add commands
- `claude-plugin/commands/flutter-orchestrate.md`

## Consequences

- Dramatically simpler architecture (no custom orchestration code to maintain)
- Users get the full native Agent Teams experience (direct messaging, split panes, etc.)
- Depends on experimental feature (`CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`)
- Quality of CLAUDE.md and agent definitions becomes critical - they guide the Team Lead
- Ralph remains as fallback for non-Teams users
