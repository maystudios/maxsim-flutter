# Agentic Coding with Claude Code: Comprehensive Reference

> Last updated: 2026-02-20
> Compiled from official Anthropic documentation, engineering blog posts, community resources, and production configurations.

---

## Table of Contents

1. [Agent Definitions (.claude/agents/)](#1-agent-definitions-claudeagents)
2. [Skills (.claude/skills/)](#2-skills-claudeskills)
3. [Hooks (.claude/hooks/)](#3-hooks)
4. [CLAUDE.md Best Practices](#4-claudemd-best-practices)
5. [Agent Teams](#5-agent-teams)
6. [Settings Configuration](#6-settings-configuration)
7. [Memory System](#7-memory-system)
8. [MCP Servers](#8-mcp-servers)
9. [Prompt Engineering for Agent System Prompts](#9-prompt-engineering-for-agent-system-prompts)
10. [Common Anti-Patterns and Solutions](#10-common-anti-patterns-and-solutions)
11. [Advanced Patterns](#11-advanced-patterns)

---

## 1. Agent Definitions (.claude/agents/)

### Overview

Subagents are specialized AI assistants that run in their own context window with a custom system prompt, specific tool access, and independent permissions. They are defined as Markdown files with YAML frontmatter.

When Claude encounters a task that matches a subagent's description, it delegates to that subagent, which works independently and returns results.

### Storage Locations (Priority Order)

| Location | Scope | Priority |
|----------|-------|----------|
| `--agents` CLI flag | Current session only | 1 (highest) |
| `.claude/agents/` | Current project | 2 |
| `~/.claude/agents/` | All projects | 3 |
| Plugin `agents/` directory | Where plugin enabled | 4 (lowest) |

When multiple subagents share the same name, the higher-priority location wins.

### Complete YAML Frontmatter Specification

```yaml
---
name: my-agent                    # REQUIRED. Unique ID, lowercase + hyphens
description: What this agent does # REQUIRED. Drives auto-delegation decisions
tools: Read, Grep, Glob, Bash    # Optional. Inherits all if omitted
disallowedTools: Write, Edit      # Optional. Removed from inherited/specified list
model: sonnet                     # Optional. sonnet|opus|haiku|inherit (default: inherit)
permissionMode: default           # Optional. default|acceptEdits|dontAsk|bypassPermissions|plan
maxTurns: 50                      # Optional. Max agentic turns before stop
skills:                           # Optional. Skills injected at startup (full content)
  - api-conventions
  - error-handling-patterns
mcpServers:                       # Optional. MCP servers available to this agent
  - slack                         # Reference existing server by name
memory: user                      # Optional. user|project|local. Cross-session learning
background: true                  # Optional. Always run as background task (default: false)
isolation: worktree               # Optional. Run in temp git worktree
color: purple                     # Optional. purple|cyan|green|orange|blue|red
hooks:                            # Optional. Lifecycle hooks scoped to this agent
  PreToolUse:
    - matcher: "Bash"
      hooks:
        - type: command
          command: "./scripts/validate.sh"
---

System prompt content goes here in Markdown.
The body becomes the system prompt that guides the subagent's behavior.
Subagents receive ONLY this prompt + basic environment details, NOT the full Claude Code system prompt.
```

### Field Details

#### `description` -- How It Affects Auto-Delegation

Claude uses the description to decide when to delegate tasks. Write descriptions that clearly specify WHEN Claude should use this subagent. Include phrases like "use proactively" to encourage automatic delegation.

Good description examples:
- "Expert code review specialist. Proactively reviews code for quality, security, and maintainability. Use immediately after writing or modifying code."
- "Debugging specialist for errors, test failures, and unexpected behavior. Use proactively when encountering any issues."

#### `tools` -- Available Tools

By default subagents inherit ALL tools from the main conversation, including MCP tools. Use `tools` as an allowlist or `disallowedTools` as a denylist.

Available built-in tools:
- `Read` -- Read file contents
- `Write` -- Create/overwrite files
- `Edit` -- String replacement in files
- `Bash` -- Execute shell commands
- `Glob` -- Find files by pattern
- `Grep` -- Search file contents
- `Task` -- Spawn subagents (main thread only)
- `WebFetch` -- Fetch web content
- `WebSearch` -- Search the web
- `NotebookEdit` -- Edit Jupyter notebooks

To restrict which subagents can be spawned:
```yaml
tools: Task(worker, researcher), Read, Bash  # Only spawn worker and researcher
tools: Task, Read, Bash                       # Spawn any subagent
# Omit Task entirely = cannot spawn subagents
```

#### `model` -- Choosing Between Models

| Model | Use When |
|-------|----------|
| `opus` | Complex reasoning, architectural decisions, security reviews, non-trivial implementations |
| `sonnet` | Balanced capability/speed. Code analysis, standard implementations |
| `haiku` | Fast, low-cost. File discovery, codebase exploration, simple lookups |
| `inherit` | Use same model as main conversation (default) |

#### `isolation: worktree`

Runs the subagent in a temporary git worktree -- an isolated copy of the repository. The worktree is automatically cleaned up if the subagent makes no changes.

**When to use:**
- Multiple agents editing the same codebase in parallel
- Risky operations you might want to discard
- Testing changes without affecting the main branch

**Limitations:**
- Requires a git repository
- Creates filesystem overhead (full copy)
- Changes must be merged back manually

#### `memory` -- Persistent Cross-Session Learning

| Scope | Location | Use When |
|-------|----------|----------|
| `user` | `~/.claude/agent-memory/<name>/` | Learning across all projects (recommended default) |
| `project` | `.claude/agent-memory/<name>/` | Project-specific, shareable via VCS |
| `local` | `.claude/agent-memory-local/<name>/` | Project-specific, NOT checked into VCS |

When enabled:
- System prompt includes instructions for reading/writing memory directory
- First 200 lines of `MEMORY.md` in the memory directory are loaded at startup
- Read, Write, Edit tools are automatically enabled

Memory tips:
- Ask the subagent to consult memory before starting work
- Ask the subagent to update memory after completing tasks
- Include memory instructions in the agent's markdown body

#### `permissionMode` Options

| Mode | Behavior |
|------|----------|
| `default` | Standard permission checking with prompts |
| `acceptEdits` | Auto-accept file edits |
| `dontAsk` | Auto-deny permission prompts (explicitly allowed tools still work) |
| `bypassPermissions` | Skip ALL permission checks (use with caution) |
| `plan` | Read-only exploration mode |

If the parent uses `bypassPermissions`, it takes precedence and cannot be overridden.

#### `maxTurns` Recommendations

| Task Type | Recommended maxTurns |
|-----------|---------------------|
| Quick lookup / file search | 10-15 |
| Code review / analysis | 20-30 |
| Implementation / multi-step | 40-60 |
| Complex debugging | 50-80 |

#### `skills` -- Preloading Skills

The full content of each skill is injected into the subagent's context at startup. Subagents do NOT inherit skills from the parent conversation.

```yaml
skills:
  - api-conventions      # Skill from .claude/skills/api-conventions/
  - error-handling        # Skill from .claude/skills/error-handling/
```

#### `mcpServers` -- Scoping MCP Access

Reference already-configured servers by name, or provide inline definitions:

```yaml
mcpServers:
  - slack                 # Reference existing server
  - name: custom-db       # Inline definition
    command: node
    args: ["/path/to/server.js"]
```

**Limitation:** MCP tools are NOT available in background subagents.

#### `background` -- Background Agent Behavior

When `background: true`:
- Agent runs concurrently while you continue working
- Permission requirements are pre-approved before launch
- MCP tools are NOT available
- If the agent needs to ask questions, those tool calls fail but the agent continues
- Can be resumed in foreground if permissions fail

### Built-in Subagents

| Agent | Model | Tools | Purpose |
|-------|-------|-------|---------|
| **Explore** | Haiku | Read-only | File discovery, code search, codebase exploration |
| **Plan** | Inherit | Read-only | Codebase research for plan mode |
| **General-purpose** | Inherit | All | Complex research, multi-step operations |
| **Bash** | Inherit | Bash | Running terminal commands in separate context |

### Real-World Examples

#### Code Reviewer (Read-Only)
```yaml
---
name: code-reviewer
description: Expert code review specialist. Proactively reviews code for quality, security, and maintainability. Use immediately after writing or modifying code.
tools: Read, Glob, Grep, Bash
model: inherit
---

You are a senior code reviewer ensuring high standards of code quality and security.

When invoked:
1. Run git diff to see recent changes
2. Focus on modified files
3. Begin review immediately

Review checklist:
- Code is clear and readable
- Functions and variables are well-named
- No duplicated code
- Proper error handling
- No exposed secrets or API keys
- Input validation implemented
- Good test coverage
- Performance considerations addressed

Provide feedback organized by priority:
- Critical issues (must fix)
- Warnings (should fix)
- Suggestions (consider improving)

Include specific examples of how to fix issues.
```

#### Debugger (Full Access)
```yaml
---
name: debugger
description: Debugging specialist for errors, test failures, and unexpected behavior. Use proactively when encountering any issues.
tools: Read, Edit, Bash, Grep, Glob
---

You are an expert debugger specializing in root cause analysis.

When invoked:
1. Capture error message and stack trace
2. Identify reproduction steps
3. Isolate the failure location
4. Implement minimal fix
5. Verify solution works

Focus on fixing the underlying issue, not the symptoms.
```

#### TDD Driver (Flutter-Specific)
```yaml
---
name: tdd-driver
description: Test-driven development specialist. Write failing tests first, then implement minimal code to pass, then refactor. Use for all feature implementation.
tools: Read, Write, Edit, Bash, Grep, Glob
model: opus
memory: project
---

You are a TDD practitioner implementing features using Red-Green-Refactor.

## Workflow
1. RED: Write a failing test that describes the desired behavior
2. GREEN: Write the minimal code to make the test pass
3. REFACTOR: Clean up without changing behavior
4. Verify: Run the full test suite

## Rules
- NEVER write implementation code before a failing test
- Each test should test ONE behavior
- Test names describe behavior, not implementation
- Run tests after every change
- Update your agent memory with patterns you discover

## Quality Gates
Before marking any task complete:
- All tests pass
- No skipped or todo tests
- Coverage meets thresholds
- Linting passes
- Type checking passes
```

#### Security Reviewer (Restricted)
```yaml
---
name: security-reviewer
description: Reviews code for security vulnerabilities. Use after any authentication, authorization, or data handling changes.
tools: Read, Grep, Glob, Bash
model: opus
permissionMode: plan
---

You are a senior security engineer. Review code for:
- Injection vulnerabilities (SQL, XSS, command injection)
- Authentication and authorization flaws
- Secrets or credentials in code
- Insecure data handling
- OWASP Top 10 issues

Provide specific line references and severity ratings.
Never modify code -- report findings only.
```

### Anti-Patterns

1. **Overly broad descriptions** -- "General helper for anything" gives Claude no signal for when to delegate
2. **Too many tools** -- Give only what's needed. A reviewer doesn't need Write/Edit.
3. **No system prompt body** -- The markdown body IS the system prompt. Empty body = generic behavior.
4. **Giant system prompts** -- Keep focused. Each agent should excel at ONE specific task.
5. **Nesting attempts** -- Subagents CANNOT spawn other subagents. Use Skills or chain from main conversation.
6. **Forgetting model selection** -- Using Opus for simple file lookups wastes tokens. Use Haiku for exploration.

---

## 2. Skills (.claude/skills/)

### Overview

Skills extend what Claude can do. Create a `SKILL.md` file with instructions, and Claude adds it to its toolkit. Skills follow the [Agent Skills](https://agentskills.io) open standard.

### Directory Structure

```
.claude/skills/
  my-skill/
    SKILL.md           # Required -- main instructions
    template.md        # Optional -- template for Claude to fill in
    examples/
      sample.md        # Optional -- example output
    scripts/
      validate.sh      # Optional -- executable script
```

### Complete SKILL.md Frontmatter Specification

```yaml
---
name: my-skill                      # Optional. Max 64 chars, lowercase/numbers/hyphens
description: What this skill does   # Recommended. Max 1024 chars. Drives auto-activation
argument-hint: "[issue-number]"     # Optional. Shown in autocomplete
disable-model-invocation: true      # Optional. Only user can invoke (default: false)
user-invocable: false               # Optional. Only Claude can invoke (default: true)
allowed-tools: Read, Grep, Glob     # Optional. Restrict tools during execution
model: opus                         # Optional. Override model for this skill
context: fork                       # Optional. Run in forked subagent context
agent: Explore                      # Optional. Which subagent type for context:fork
hooks:                              # Optional. Lifecycle hooks scoped to skill
  PreToolUse:
    - matcher: "Bash"
      hooks:
        - type: command
          command: "./scripts/check.sh"
---

Skill instructions in Markdown...
```

### Field Details

#### `description` -- Achieving Reliable Activation

Claude uses the description to decide when to automatically load a skill. Write descriptions that:
- Explain WHAT the skill does
- Explain WHEN to use it (trigger conditions)
- Use keywords users would naturally say

Good examples:
- "Explains code with visual diagrams and analogies. Use when explaining how code works, teaching about a codebase, or when the user asks 'how does this work?'"
- "Deploy the application to production. Use for deployment tasks."

#### Invocation Control Matrix

| Frontmatter | User Can Invoke | Claude Can Invoke | Context Loading |
|-------------|-----------------|-------------------|-----------------|
| (default) | Yes | Yes | Description always in context, full skill on invoke |
| `disable-model-invocation: true` | Yes | No | Description NOT in context |
| `user-invocable: false` | No | Yes | Description always in context |

#### `context: fork` -- Isolated Execution

Runs the skill in a separate subagent context. The skill content becomes the prompt driving the subagent.

```yaml
---
name: deep-research
description: Research a topic thoroughly
context: fork
agent: Explore          # Uses Explore agent (read-only, fast)
---

Research $ARGUMENTS thoroughly:
1. Find relevant files using Glob and Grep
2. Read and analyze the code
3. Summarize findings with specific file references
```

**When to use `context: fork`:**
- Long-running research that would bloat main context
- Tasks producing verbose output
- Isolated operations with clear deliverables

**When NOT to use:**
- Skills with guidelines/conventions (no actionable task)
- Short lookups
- Skills that need conversation history

#### String Substitutions

| Variable | Description |
|----------|-------------|
| `$ARGUMENTS` | All arguments passed when invoking |
| `$ARGUMENTS[N]` | Specific argument by 0-based index |
| `$N` | Shorthand for `$ARGUMENTS[N]` |
| `${CLAUDE_SESSION_ID}` | Current session ID |

#### Dynamic Context Injection

The `` !`command` `` syntax runs shell commands before skill content is sent to Claude:

```yaml
---
name: pr-summary
description: Summarize changes in a pull request
context: fork
agent: Explore
---

## Pull request context
- PR diff: !`gh pr diff`
- PR comments: !`gh pr view --comments`
- Changed files: !`gh pr diff --name-only`

## Your task
Summarize this pull request...
```

### Skill vs CLAUDE.md vs Hook vs Agent -- Decision Matrix

| Feature | Use When | Persistence | Who Triggers |
|---------|----------|-------------|--------------|
| **CLAUDE.md** | Rules that apply to EVERY session | Always loaded | Automatic |
| **.claude/rules/** | File-specific rules | Loaded when matching files accessed | Automatic |
| **Skill** | Reusable knowledge/workflows, on-demand | Loaded when relevant or invoked | User or Claude |
| **Hook** | Must happen EVERY time, zero exceptions | Deterministic execution | System events |
| **Agent** | Isolated context, specific tool restrictions | Per-delegation | Claude or explicit request |

### Real-World Skill Examples

#### Fix GitHub Issue
```yaml
---
name: fix-issue
description: Fix a GitHub issue end-to-end
disable-model-invocation: true
---

Analyze and fix GitHub issue $ARGUMENTS:

1. Use `gh issue view $0` to get details
2. Understand the problem
3. Search codebase for relevant files
4. Implement the fix
5. Write and run tests
6. Ensure lint and typecheck pass
7. Create a descriptive commit
8. Push and create a PR with `gh pr create`
```

#### Commit with Conventions
```yaml
---
name: commit
description: Create a conventional commit
disable-model-invocation: true
---

Create a git commit following these steps:

1. Run `git status` and `git diff --staged`
2. Analyze all staged changes
3. Draft a commit message following Conventional Commits:
   - feat: new features
   - fix: bug fixes
   - chore: tooling, config
   - refactor: code restructuring
   - test: adding/fixing tests
4. Commit with the message
5. Push to remote
```

### Anti-Patterns

1. **Skills over 500 lines** -- Move detailed reference to supporting files
2. **Side-effect skills without `disable-model-invocation`** -- Claude might deploy your app because it looks ready
3. **Vague descriptions** -- "Helper skill" tells Claude nothing about when to activate
4. **Too many skills** -- Descriptions consume context budget (2% of context window). Prune unused skills.
5. **Convention skills with `context: fork`** -- Guidelines without tasks produce no output in isolation

---

## 3. Hooks

### Overview

Hooks are user-defined shell commands or LLM prompts that execute automatically at specific points in Claude Code's lifecycle. Unlike CLAUDE.md instructions (advisory), hooks are deterministic and guarantee execution.

### Configuration Locations

| Location | Scope | Shareable |
|----------|-------|-----------|
| `~/.claude/settings.json` | All projects | No |
| `.claude/settings.json` | Single project | Yes (commit to repo) |
| `.claude/settings.local.json` | Single project | No (gitignored) |
| Managed policy settings | Organization-wide | Yes (admin-controlled) |
| Plugin `hooks/hooks.json` | When plugin enabled | Yes |
| Skill/Agent frontmatter | While component active | Yes |

### Complete Hook Events Reference

| Event | When It Fires | Matcher Input | Can Block? |
|-------|--------------|---------------|------------|
| `SessionStart` | Session begins/resumes | `startup`, `resume`, `clear`, `compact` | No |
| `UserPromptSubmit` | User submits prompt | No matcher support | Yes |
| `PreToolUse` | Before tool executes | Tool name | Yes |
| `PermissionRequest` | Permission dialog shown | Tool name | Yes |
| `PostToolUse` | After tool succeeds | Tool name | No (feedback only) |
| `PostToolUseFailure` | After tool fails | Tool name | No (feedback only) |
| `Notification` | Notification sent | `permission_prompt`, `idle_prompt`, `auth_success`, `elicitation_dialog` | No |
| `SubagentStart` | Subagent spawned | Agent type name | No (context injection) |
| `SubagentStop` | Subagent finishes | Agent type name | Yes |
| `Stop` | Claude finishes responding | No matcher support | Yes |
| `TeammateIdle` | Team teammate about to idle | No matcher support | Yes |
| `TaskCompleted` | Task marked complete | No matcher support | Yes |
| `ConfigChange` | Config file changes | `user_settings`, `project_settings`, `local_settings`, `policy_settings`, `skills` | Yes (except policy) |
| `PreCompact` | Before compaction | `manual`, `auto` | No |
| `SessionEnd` | Session terminates | `clear`, `logout`, `prompt_input_exit`, `bypass_permissions_disabled`, `other` | No |

### Hook Types

#### Command Hooks (`type: "command"`)
Run a shell command. Receives JSON on stdin, communicates via exit codes and stdout.

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "npx prettier --write \"$CLAUDE_PROJECT_DIR/$(cat | jq -r '.tool_input.file_path')\"",
            "timeout": 30
          }
        ]
      }
    ]
  }
}
```

#### Prompt Hooks (`type: "prompt"`)
Send a prompt to a Claude model for single-turn yes/no evaluation.

```json
{
  "hooks": {
    "Stop": [
      {
        "hooks": [
          {
            "type": "prompt",
            "prompt": "Evaluate if Claude should stop: $ARGUMENTS. Check if all tasks are complete.",
            "model": "haiku",
            "timeout": 30
          }
        ]
      }
    ]
  }
}
```

Response schema: `{ "ok": true|false, "reason": "..." }`

#### Agent Hooks (`type: "agent"`)
Spawn a subagent with tool access (Read, Grep, Glob) for multi-turn verification.

```json
{
  "hooks": {
    "Stop": [
      {
        "hooks": [
          {
            "type": "agent",
            "prompt": "Verify all unit tests pass. Run the test suite and check results. $ARGUMENTS",
            "timeout": 120
          }
        ]
      }
    ]
  }
}
```

### Hook Handler Fields

#### Common Fields (All Types)
| Field | Required | Description |
|-------|----------|-------------|
| `type` | Yes | `"command"`, `"prompt"`, or `"agent"` |
| `timeout` | No | Seconds. Defaults: 600 (command), 30 (prompt), 60 (agent) |
| `statusMessage` | No | Custom spinner message |
| `once` | No | If true, runs only once per session (skills only) |

#### Command-Specific Fields
| Field | Required | Description |
|-------|----------|-------------|
| `command` | Yes | Shell command to execute |
| `async` | No | If true, runs in background without blocking |

#### Prompt/Agent-Specific Fields
| Field | Required | Description |
|-------|----------|-------------|
| `prompt` | Yes | Prompt text. Use `$ARGUMENTS` for hook input JSON |
| `model` | No | Model for evaluation (default: fast model) |

### Exit Codes

| Exit Code | Meaning | Behavior |
|-----------|---------|----------|
| **0** | Success | Proceed. Parse stdout for JSON output |
| **2** | Blocking error | Block the action. stderr fed back to Claude |
| **Other** | Non-blocking error | stderr shown in verbose mode. Continue |

### JSON Input (Common Fields on stdin)

```json
{
  "session_id": "abc123",
  "transcript_path": "/path/to/transcript.jsonl",
  "cwd": "/path/to/project",
  "permission_mode": "default",
  "hook_event_name": "PreToolUse",
  "tool_name": "Bash",
  "tool_input": { "command": "npm test" }
}
```

### JSON Output (stdout)

| Field | Default | Description |
|-------|---------|-------------|
| `continue` | true | If false, Claude stops entirely |
| `stopReason` | none | Message shown to user when continue=false |
| `suppressOutput` | false | Hide stdout from verbose mode |
| `systemMessage` | none | Warning shown to user |

### PreToolUse Decision Control

```json
{
  "hookSpecificOutput": {
    "hookEventName": "PreToolUse",
    "permissionDecision": "deny",
    "permissionDecisionReason": "Destructive command blocked",
    "updatedInput": { "command": "npm run lint" },
    "additionalContext": "Current environment: production"
  }
}
```

`permissionDecision` values: `"allow"` (bypass permission system), `"deny"` (block), `"ask"` (prompt user)

### Preventing Infinite Loops with `stop_hook_active`

The `Stop` and `SubagentStop` hooks receive `stop_hook_active` in their input. When `true`, Claude is already continuing due to a stop hook. CHECK THIS VALUE to prevent infinite loops:

```bash
#!/bin/bash
INPUT=$(cat)
ACTIVE=$(echo "$INPUT" | jq -r '.stop_hook_active')

if [ "$ACTIVE" = "true" ]; then
  exit 0  # Allow stop -- already ran once
fi

# Your actual validation logic here
npm test 2>&1 || { echo "Tests failing" >&2; exit 2; }
exit 0
```

### Production Hook Examples

#### Auto-Format on File Edit
```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "\"$CLAUDE_PROJECT_DIR\"/.claude/hooks/format.sh",
            "timeout": 30
          }
        ]
      }
    ]
  }
}
```

```bash
#!/bin/bash
# .claude/hooks/format.sh
INPUT=$(cat)
FILE=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')
[ -z "$FILE" ] && exit 0

# Format based on extension
case "$FILE" in
  *.ts|*.tsx|*.js|*.jsx) npx prettier --write "$FILE" 2>/dev/null ;;
  *.dart) dart format "$FILE" 2>/dev/null ;;
  *.py) black "$FILE" 2>/dev/null ;;
esac
exit 0
```

#### Block Dangerous Commands
```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "\"$CLAUDE_PROJECT_DIR\"/.claude/hooks/block-dangerous.sh"
          }
        ]
      }
    ]
  }
}
```

```bash
#!/bin/bash
# .claude/hooks/block-dangerous.sh
INPUT=$(cat)
CMD=$(echo "$INPUT" | jq -r '.tool_input.command // empty')

# Block destructive commands
if echo "$CMD" | grep -iE '\b(rm -rf|drop table|truncate|format|mkfs)\b' > /dev/null; then
  echo "Blocked: Destructive command not allowed" >&2
  exit 2
fi

# Block credential exposure
if echo "$CMD" | grep -iE '(ANTHROPIC_API_KEY|AWS_SECRET|password)' > /dev/null; then
  echo "Blocked: Potential credential exposure" >&2
  exit 2
fi

exit 0
```

#### TaskCompleted Quality Gate
```json
{
  "hooks": {
    "TaskCompleted": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "\"$CLAUDE_PROJECT_DIR\"/.claude/hooks/quality-gate.sh"
          }
        ]
      }
    ]
  }
}
```

```bash
#!/bin/bash
# .claude/hooks/quality-gate.sh
INPUT=$(cat)
TASK=$(echo "$INPUT" | jq -r '.task_subject')

# Run quality checks
if ! npm run typecheck 2>&1; then
  echo "Type errors found. Fix before completing: $TASK" >&2
  exit 2
fi

if ! npm run lint 2>&1; then
  echo "Lint errors found. Fix before completing: $TASK" >&2
  exit 2
fi

if ! npm test 2>&1; then
  echo "Tests failing. Fix before completing: $TASK" >&2
  exit 2
fi

exit 0
```

#### Desktop Notification on Completion
```json
{
  "hooks": {
    "Notification": [
      {
        "matcher": "idle_prompt",
        "hooks": [
          {
            "type": "command",
            "command": "powershell -Command \"[System.Reflection.Assembly]::LoadWithPartialName('System.Windows.Forms'); [System.Windows.Forms.MessageBox]::Show('Claude needs attention', 'Claude Code')\"",
            "async": true
          }
        ]
      }
    ]
  }
}
```

#### SessionStart Context Injection
```json
{
  "hooks": {
    "SessionStart": [
      {
        "matcher": "startup",
        "hooks": [
          {
            "type": "command",
            "command": "\"$CLAUDE_PROJECT_DIR\"/.claude/hooks/inject-context.sh"
          }
        ]
      }
    ]
  }
}
```

```bash
#!/bin/bash
# .claude/hooks/inject-context.sh
# Output is added as context for Claude

echo "Recent git activity:"
git log --oneline -5 2>/dev/null

echo ""
echo "Open issues assigned to you:"
gh issue list --assignee @me --limit 5 2>/dev/null || true

echo ""
echo "Current branch: $(git branch --show-current 2>/dev/null)"
echo "Uncommitted changes: $(git status --porcelain 2>/dev/null | wc -l) files"
```

### Anti-Patterns

1. **Stop hooks without `stop_hook_active` check** -- Creates infinite loops
2. **Slow synchronous hooks** -- Blocks Claude's execution. Use `async: true` for long operations.
3. **Hooks that modify files without telling Claude** -- Claude doesn't know about external changes. Return `additionalContext`.
4. **Using hooks for advisory rules** -- Put those in CLAUDE.md. Hooks are for deterministic enforcement.
5. **Hooks with side effects on PostToolUse** -- The tool already ran. You can only provide feedback, not undo.

---

## 4. CLAUDE.md Best Practices

### Official Anthropic Recommendations

From Anthropic's best practices documentation:

- **Run `/init`** to generate a starter CLAUDE.md based on your project structure
- **Keep it short and human-readable** -- no required format
- There is a direct correlation between CLAUDE.md length and Claude ignoring your instructions
- Every line should answer: "Would removing this cause Claude to make mistakes?" If not, cut it.

### What to Include vs Exclude

| Include | Exclude |
|---------|---------|
| Bash commands Claude can't guess | Anything Claude can figure out from code |
| Code style rules that differ from defaults | Standard language conventions |
| Testing instructions and test runners | Detailed API documentation (link instead) |
| Repository etiquette (branch naming, PRs) | Information that changes frequently |
| Architectural decisions specific to project | Long explanations or tutorials |
| Developer environment quirks (env vars) | File-by-file codebase descriptions |
| Common gotchas or non-obvious behaviors | Self-evident practices like "write clean code" |

### Progressive Disclosure Pattern

Structure CLAUDE.md from most critical to least critical:

```markdown
# Project: MyApp

## Critical Commands (MUST KNOW)
- Build: `npm run build`
- Test: `npm test -- --testPathPattern=<file>`
- Lint: `npm run lint`
- Quality: `npm run quality` (typecheck + lint + test)

## Code Style (FOLLOW THESE)
- ES modules only (import/export, NOT require)
- Strict TypeScript -- no `any` types
- kebab-case filenames, PascalCase types, camelCase functions

## Architecture (REFERENCE)
- Clean Architecture: src/{cli,core,scaffold,modules}
- Module system: src/modules/definitions/<name>/module.ts
- Templates: Handlebars (.hbs) in templates/

## Testing (IMPORTANT)
- TDD: Write failing test FIRST
- Use helpers from tests/helpers/ -- NEVER duplicate
- Coverage thresholds in jest.config.mjs (look them up, don't hardcode)

## Git Workflow
- Conventional commits: feat|fix|chore|refactor|test|docs
- Always push after committing
- One logical change per commit
```

### Using Emphasis Effectively

Use emphasis sparingly but effectively:
- `IMPORTANT:` for rules that are frequently violated
- `NEVER` for absolute prohibitions
- `MUST` for non-negotiable requirements
- `ALWAYS` for consistent behavior requirements

Overusing emphasis reduces its impact. If everything is IMPORTANT, nothing is.

### Multiple CLAUDE.md Locations and Precedence

More specific instructions take precedence over broader ones:

1. **Managed policy** (`/Library/Application Support/ClaudeCode/CLAUDE.md`) -- Organization-wide
2. **User memory** (`~/.claude/CLAUDE.md`) -- Personal, all projects
3. **Project** (`./CLAUDE.md` or `./.claude/CLAUDE.md`) -- Team-shared
4. **Project local** (`./CLAUDE.local.md`) -- Personal, auto-gitignored
5. **Child directories** -- Loaded on demand when Claude reads files there

### Importing Files with @path Syntax

```markdown
See @README.md for project overview.
See @package.json for available npm commands.

# Additional Instructions
- Git workflow: @docs/git-instructions.md
- Personal: @~/.claude/my-project-instructions.md
```

- Both relative and absolute paths allowed
- Relative paths resolve relative to the FILE containing the import
- Max depth: 5 hops for recursive imports
- Not evaluated inside code spans/blocks

### .claude/rules/ -- Path-Specific Rules

```markdown
---
paths:
  - "src/api/**/*.ts"
  - "lib/**/*.ts"
---

# API Development Rules
- All API endpoints must include input validation
- Use the standard error response format
- Include OpenAPI documentation comments
```

Rules WITHOUT a `paths` field load unconditionally.

Glob patterns supported:
- `**/*.ts` -- All TypeScript files anywhere
- `src/**/*` -- All files under src/
- `src/**/*.{ts,tsx}` -- Brace expansion for multiple extensions

### Anti-Patterns

1. **Kitchen sink CLAUDE.md** -- 500+ lines that Claude ignores half of
2. **Redundant with code** -- Don't describe what the code already shows
3. **Stale instructions** -- Review and prune when Claude misbehaves
4. **Duplicate rules** -- Same rule in CLAUDE.md AND .claude/rules/ causes confusion
5. **Over-specification** -- Describing every function's behavior instead of patterns

---

## 5. Agent Teams

### Overview

Agent teams coordinate multiple Claude Code instances working together. One session acts as team lead, coordinating work, assigning tasks, and synthesizing results. Teammates work independently, each in its own context window, and communicate directly.

**Enable with:**
```json
{
  "env": {
    "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"
  }
}
```

### When to Use Agent Teams vs Subagents

| | Subagents | Agent Teams |
|---|-----------|-------------|
| **Context** | Own window; results return to caller | Own window; fully independent |
| **Communication** | Report back to main agent only | Teammates message each other directly |
| **Coordination** | Main agent manages all work | Shared task list with self-coordination |
| **Best for** | Focused tasks where only result matters | Complex work requiring discussion |
| **Token cost** | Lower (results summarized) | Higher (each teammate = separate instance) |

### Architecture

| Component | Role |
|-----------|------|
| **Team lead** | Main session that creates team, spawns teammates, coordinates |
| **Teammates** | Separate Claude Code instances working on assigned tasks |
| **Task list** | Shared work items at `~/.claude/tasks/{team-name}/` |
| **Mailbox** | Messaging system for inter-agent communication |

Team config stored at: `~/.claude/teams/{team-name}/config.json`

### Task Lifecycle

Tasks flow through three states: `pending` -> `in_progress` -> `completed`

Task claiming uses file locking to prevent race conditions.

### Communication Patterns

#### Direct Message (Default)
```
SendMessage: type="message", recipient="researcher", content="...", summary="Brief status"
```
Use for: responding to one teammate, follow-ups, sharing findings relevant to one person.

#### Broadcast (Use Sparingly)
```
SendMessage: type="broadcast", content="...", summary="Critical blocking issue"
```
Use ONLY for: critical issues requiring immediate team-wide attention. Each broadcast sends N separate messages (one per teammate).

### Plan Approval Workflow

1. Teammate works in read-only plan mode
2. Teammate finishes planning, sends `plan_approval_request` to lead
3. Lead reviews plan:
   - Approve: `plan_approval_response` with `approve: true`
   - Reject: `plan_approval_response` with `approve: false, content: "feedback"`
4. If rejected, teammate revises and resubmits

Enable for a teammate:
```
CLAUDE_CODE_PLAN_MODE_REQUIRED=1
```

### Shutdown Protocol

1. Lead sends: `SendMessage: type="shutdown_request", recipient="researcher"`
2. Teammate responds: `SendMessage: type="shutdown_response", request_id="...", approve: true`
3. After all teammates shutdown: Lead runs `TeamDelete` to clean up resources

### Task Sizing -- The 5-6 Sweet Spot

Having 5-6 tasks per teammate keeps everyone productive and lets the lead reassign work if someone gets stuck.

- **Too small**: Coordination overhead exceeds benefit
- **Too large**: Teammates work too long without check-ins
- **Just right**: Self-contained units producing clear deliverables (a function, test file, review)

### File Conflict Avoidance

Two teammates editing the same file leads to overwrites. Strategies:
1. **Break work by file ownership** -- each teammate owns different files
2. **Use `isolation: worktree`** -- each agent works in isolated git worktree
3. **Sequential dependencies** -- use `blockedBy` to serialize conflicting tasks
4. **Interface-first** -- have architect define interfaces, then implementers work on separate modules

### Hooks for Quality Enforcement

```json
{
  "hooks": {
    "TaskCompleted": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "\"$CLAUDE_PROJECT_DIR\"/.claude/hooks/task-quality-gate.sh"
          }
        ]
      }
    ],
    "TeammateIdle": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "\"$CLAUDE_PROJECT_DIR\"/.claude/hooks/teammate-check.sh"
          }
        ]
      }
    ]
  }
}
```

### Real-World Team Composition Examples

#### Feature Implementation Team
```
Create an agent team for implementing the OAuth feature:
- architect: Design interfaces and plan module boundaries (Plan mode required)
- implementer-backend: Implement server-side auth flow
- implementer-frontend: Implement client-side login UI
- tester: Write tests for all new code
- reviewer: Review all changes before completion
```

#### Parallel Code Review
```
Create an agent team to review PR #142:
- security-reviewer: Focus on security implications
- performance-reviewer: Check performance impact
- test-reviewer: Validate test coverage
Have them each review and report findings.
```

#### Debugging Team
```
Users report login fails after timeout. Spawn 5 agent teammates:
- hypothesis-1: Investigate token refresh logic
- hypothesis-2: Check session timeout handling
- hypothesis-3: Examine database connection pooling
- hypothesis-4: Review load balancer configuration
- hypothesis-5: Analyze error logs for patterns
Have them debate and disprove each other's theories.
```

### Anti-Patterns

1. **Using teams for sequential tasks** -- Single session or subagents are more effective
2. **Not pre-approving permissions** -- Permission requests bubble up and create friction
3. **Letting lead implement** -- Tell it "Wait for your teammates to complete before proceeding"
4. **Unscoped spawn prompts** -- Give teammates detailed context since they don't inherit conversation history
5. **Running unattended too long** -- Monitor and steer. Check in on progress regularly.
6. **Overusing broadcast** -- Costs scale linearly with team size. Default to direct messages.

### Limitations

- No session resumption with in-process teammates
- Task status can lag (teammates sometimes fail to mark tasks complete)
- One team per session
- No nested teams (teammates can't spawn their own teams)
- Lead is fixed for team lifetime
- Permissions set at spawn for all teammates
- Split panes require tmux or iTerm2

---

## 6. Settings Configuration

### Settings Files and Precedence

From highest to lowest priority:
1. **Managed** -- System-level admin policy
2. **CLI arguments** -- `--flag` overrides
3. **Local** -- `.claude/settings.local.json` (personal, gitignored)
4. **Project** -- `.claude/settings.json` (shared via git)
5. **User** -- `~/.claude/settings.json` (all projects)

### Permission System

#### Rule Syntax
```
Tool                    # All uses of tool
Tool(specifier)         # Specific use pattern
```

Examples:
```
Bash                    # All bash commands
Bash(npm run *)         # Commands starting with "npm run"
Read(./.env)            # Reading .env file
Edit(./src/**)          # Editing files in src/
WebFetch(domain:example.com)
Task(**)                # All subagent spawning
Task(Explore)           # Specific subagent
Skill(commit)           # Specific skill
Skill(deploy *)         # Skill prefix match
```

#### Evaluation Order
1. **Deny rules** -- Reject immediately (highest priority)
2. **Ask rules** -- Request user confirmation
3. **Allow rules** -- Approve (lowest priority)
4. First matching rule wins

#### Complete Permission Example
```json
{
  "permissions": {
    "allow": [
      "Bash(npm run *)",
      "Bash(git diff *)",
      "Bash(git status)",
      "Bash(git log *)",
      "Read(./src/**)",
      "Edit(./src/**)",
      "WebFetch(domain:github.com)"
    ],
    "deny": [
      "Bash(curl *)",
      "Bash(rm -rf *)",
      "Bash(sudo *)",
      "Read(./.env)",
      "Read(./.env.*)",
      "Read(./secrets/**)",
      "Task(dangerous-agent)"
    ],
    "ask": [
      "Bash(git push *)",
      "Bash(git commit *)"
    ],
    "defaultMode": "acceptEdits"
  }
}
```

### Key Environment Variables

#### Feature Flags
| Variable | Purpose |
|----------|---------|
| `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS` | Enable agent teams (`1`) |
| `CLAUDE_AUTOCOMPACT_PCT_OVERRIDE` | Context compaction threshold (1-100%) |
| `CLAUDE_CODE_DISABLE_AUTO_MEMORY` | Disable auto memory (`1`) |
| `CLAUDE_CODE_DISABLE_BACKGROUND_TASKS` | Disable background tasks |
| `CLAUDE_CODE_PLAN_MODE_REQUIRED` | Require plan approval (agent teams) |
| `CLAUDE_CODE_ADDITIONAL_DIRECTORIES_CLAUDE_MD` | Load CLAUDE.md from --add-dir dirs |

#### Model Configuration
| Variable | Purpose |
|----------|---------|
| `ANTHROPIC_MODEL` | Default model |
| `ANTHROPIC_DEFAULT_HAIKU_MODEL` | Override Haiku-class model |
| `ANTHROPIC_DEFAULT_SONNET_MODEL` | Override Sonnet-class model |
| `ANTHROPIC_DEFAULT_OPUS_MODEL` | Override Opus-class model |
| `CLAUDE_CODE_SUBAGENT_MODEL` | Model for subagents |
| `CLAUDE_CODE_EFFORT_LEVEL` | `"low"`, `"medium"`, `"high"` |
| `MAX_THINKING_TOKENS` | Extended thinking budget (0 = disable) |

#### Token & Context
| Variable | Purpose |
|----------|---------|
| `CLAUDE_CODE_MAX_OUTPUT_TOKENS` | Max output (default: 32K, max: 64K) |
| `MAX_MCP_OUTPUT_TOKENS` | Max MCP tool response tokens |
| `SLASH_COMMAND_TOOL_CHAR_BUDGET` | Character budget for skill metadata |

#### Execution
| Variable | Purpose |
|----------|---------|
| `BASH_DEFAULT_TIMEOUT_MS` | Default bash timeout |
| `BASH_MAX_TIMEOUT_MS` | Maximum bash timeout |
| `BASH_MAX_OUTPUT_LENGTH` | Max output chars |
| `MCP_TIMEOUT` | MCP server startup timeout (ms) |
| `MCP_TOOL_TIMEOUT` | MCP tool execution timeout (ms) |

### Complete Settings Example for Flutter Project

```json
{
  "$schema": "https://json.schemastore.org/claude-code-settings.json",
  "permissions": {
    "allow": [
      "Bash(npm run *)",
      "Bash(npm test *)",
      "Bash(npx *)",
      "Bash(git diff *)",
      "Bash(git status)",
      "Bash(git log *)",
      "Bash(flutter *)",
      "Bash(dart *)",
      "Read(./src/**)",
      "Read(./templates/**)",
      "Read(./tests/**)",
      "Edit(./src/**)",
      "Edit(./templates/**)",
      "Edit(./tests/**)"
    ],
    "deny": [
      "Bash(rm -rf *)",
      "Bash(sudo *)",
      "Read(./.env)",
      "Read(./.env.*)"
    ],
    "defaultMode": "acceptEdits"
  },
  "env": {
    "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1",
    "CLAUDE_AUTOCOMPACT_PCT_OVERRIDE": "70",
    "NODE_ENV": "development"
  },
  "model": "claude-sonnet-4-6",
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "\"$CLAUDE_PROJECT_DIR\"/.claude/hooks/auto-format.sh",
            "timeout": 30
          }
        ]
      }
    ],
    "TaskCompleted": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "\"$CLAUDE_PROJECT_DIR\"/.claude/hooks/quality-gate.sh"
          }
        ]
      }
    ]
  }
}
```

---

## 7. Memory System

### Memory Hierarchy

| Memory Type | Location | Purpose | Loaded |
|-------------|----------|---------|--------|
| **Managed policy** | System dirs | Organization-wide rules | Always, full |
| **Project memory** | `./CLAUDE.md` or `./.claude/CLAUDE.md` | Team-shared instructions | Always, full |
| **Project rules** | `./.claude/rules/*.md` | Modular topic-specific rules | Always (or path-conditional) |
| **User memory** | `~/.claude/CLAUDE.md` | Personal preferences, all projects | Always, full |
| **Project local** | `./CLAUDE.local.md` | Personal project preferences | Always, full |
| **Auto memory** | `~/.claude/projects/<project>/memory/` | Claude's automatic notes | First 200 lines of MEMORY.md |
| **Child CLAUDE.md** | `./subdir/CLAUDE.md` | Subdirectory-specific rules | On demand (when files in subdir accessed) |

### Auto Memory Directory Structure

```
~/.claude/projects/<project>/memory/
  MEMORY.md              # Concise index, first 200 lines loaded every session
  debugging.md           # Detailed notes on debugging patterns
  api-conventions.md     # API design decisions
  architecture.md        # Key architectural decisions
  ...                    # Any topic files Claude creates
```

### MEMORY.md -- The 200-Line Limit

- Only the first 200 lines of `MEMORY.md` are loaded into Claude's system prompt at startup
- Content beyond 200 lines is NOT loaded automatically
- Claude is instructed to keep it concise by moving detailed notes into separate topic files
- Topic files (debugging.md, patterns.md, etc.) are NOT loaded at startup -- Claude reads them on demand

### What to Save vs What Not to Save

**Save:**
- Project-specific build/test commands
- Discovered patterns and conventions
- Debugging insights and solutions
- Architecture notes and module relationships
- Personal workflow preferences
- Common gotchas

**Don't Save:**
- Information already in code/docs
- Temporary or session-specific context
- Detailed API documentation (link instead)
- Information that changes frequently

### .claude/rules/ as Team-Shared Persistent Context

Organize by topic:
```
.claude/rules/
  code-style.md          # Coding conventions
  testing.md             # Test patterns and requirements
  security.md            # Security requirements
  api-design.md          # API conventions
  flutter/
    widgets.md           # Widget patterns
    state-management.md  # Riverpod patterns
```

Path-conditional rules:
```markdown
---
paths:
  - "src/modules/**/*.ts"
---

# Module Development Rules
- Every module exports a ModuleManifest
- Module IDs are kebab-case
- Templates go in templates/modules/<name>/
```

### CLAUDE.local.md for Personal Overrides

Auto-gitignored. Use for:
- Your sandbox URLs
- Preferred test data
- Personal tooling shortcuts
- Machine-specific paths

For worktree-friendly personal instructions, import from home directory:
```markdown
# In CLAUDE.local.md
@~/.claude/my-project-instructions.md
```

---

## 8. MCP Servers

### Configuration Scopes and Precedence

| Scope | Location | Description |
|-------|----------|-------------|
| **Local** (default) | `~/.claude.json` (under project path) | Private to you, current project only |
| **Project** | `.mcp.json` in project root | Team-shared, committed to VCS |
| **User** | `~/.claude.json` | Available across all projects |
| **Managed** | System dirs `managed-mcp.json` | Organization-wide, admin-controlled |

Precedence: Local > Project > User

### Adding Servers

```bash
# HTTP (recommended for remote servers)
claude mcp add --transport http notion https://mcp.notion.com/mcp

# SSE (deprecated, use HTTP where available)
claude mcp add --transport sse asana https://mcp.asana.com/sse

# Stdio (local processes)
claude mcp add --transport stdio --env API_KEY=xxx myserver -- npx -y @some/package

# With authentication
claude mcp add --transport http secure-api https://api.example.com/mcp \
  --header "Authorization: Bearer your-token"

# Project scope (creates .mcp.json)
claude mcp add --transport http paypal --scope project https://mcp.paypal.com/mcp
```

### .mcp.json Format (Project-Scoped)

```json
{
  "mcpServers": {
    "github": {
      "type": "http",
      "url": "https://api.githubcopilot.com/mcp/"
    },
    "local-db": {
      "command": "npx",
      "args": ["-y", "@bytebase/dbhub", "--dsn", "${DB_CONNECTION_STRING}"],
      "env": {
        "DB_PASSWORD": "${DB_PASSWORD}"
      }
    }
  }
}
```

Environment variable expansion supported in: `command`, `args`, `env`, `url`, `headers`

Syntax: `${VAR}` or `${VAR:-default}`

### Important Limitations

1. **MCP tools are NOT available in background subagents** -- Background agents auto-deny MCP tool calls
2. **Project-scoped servers require approval** -- Claude Code prompts for security approval
3. **Tool search activates** when MCP tools exceed 10% of context window
4. **Output warning** at 10,000 tokens (configurable via `MAX_MCP_OUTPUT_TOKENS`)
5. **Windows users** need `cmd /c` wrapper for npx-based stdio servers

### Common MCP Servers for Development

| Server | Purpose | Command |
|--------|---------|---------|
| GitHub | PRs, issues, repos | `claude mcp add --transport http github https://api.githubcopilot.com/mcp/` |
| Sentry | Error monitoring | `claude mcp add --transport http sentry https://mcp.sentry.dev/mcp` |
| Notion | Documentation | `claude mcp add --transport http notion https://mcp.notion.com/mcp` |
| PostgreSQL | Database queries | `claude mcp add --transport stdio db -- npx -y @bytebase/dbhub --dsn "..."` |
| Filesystem | File operations | `claude mcp add --transport stdio fs -- npx -y @modelcontextprotocol/server-filesystem /path` |

### Credential Safety

- Use environment variables in `.mcp.json` instead of hardcoded secrets
- Store secrets in shell profile or `.env` files NOT committed to VCS
- For OAuth: use `/mcp` in Claude Code to authenticate interactively
- Pre-configured OAuth: `claude mcp add --client-id ID --client-secret -- ...`
- Client secrets stored in system keychain, not config files

---

## 9. Prompt Engineering for Agent System Prompts

### The Evolution: Prompt -> Context -> Agent Engineering

1. **Prompt Engineering** -- Crafting perfect individual prompts
2. **Context Engineering** -- Optimizing context through CLAUDE.md, skills, memory
3. **Agent Engineering** -- Designing specialized, reusable, efficient AI agents

### Writing Effective Agent System Prompts

A good system prompt reads like a short contract. Follow this structure:

```markdown
You are: [role -- one line]

## Goal
[What success looks like]

## Workflow
1. [Step 1]
2. [Step 2]
3. [Step 3]

## Constraints
- [Constraint 1]
- [Constraint 2]

## Output Format
[What the output should look like]

## Scope Boundaries
### Do
- [Allowed action 1]
- [Allowed action 2]

### Do NOT
- [Prohibited action 1]
- [Prohibited action 2]

If unsure: Say so explicitly and ask 1 clarifying question.
```

### Key Principles from Anthropic's Context Engineering Blog

1. **Tool Curation** -- One of the most common failure modes is bloated tool sets. If a human engineer can't definitively say which tool should be used, the AI agent can't either.

2. **Be Informative Yet Tight** -- Keep context informative but concise. Every token in context competes for attention.

3. **Describe End State** -- Claude does better with prompts that describe the end state and leave room for figuring out how to get there.

4. **State Preconditions** -- State clearly when NOT to take action. Agents are eager to act on prompts.

5. **Context Window Awareness** -- Include in agent prompts: "Your context window will be automatically compacted as it approaches its limit. Do not stop tasks early due to token budget concerns."

### XML-Style Delimiters for Structured Prompts

```markdown
<role>
You are a senior Flutter developer specializing in Clean Architecture with Riverpod.
</role>

<task>
Implement the feature described below following TDD methodology.
</task>

<constraints>
- Write failing test FIRST
- Use existing patterns from the codebase
- Never use `any` types
</constraints>

<output>
Provide a summary of:
1. Files created/modified
2. Tests added
3. Quality gate status
</output>
```

### Few-Shot Prompting in System Prompts

Provide examples of expected behavior:

```markdown
## Examples

### Good commit message:
feat: [P10-004] Add --no-claude flag to add command

### Bad commit message:
updated stuff

### Good test name:
it('returns empty array when no modules match the filter')

### Bad test name:
it('test filter')
```

---

## 10. Common Anti-Patterns and Solutions

### 1. Kitchen Sink Sessions

**Problem:** Start with one task, ask something unrelated, go back to first task. Context full of irrelevant information.

**Solution:** `/clear` between unrelated tasks. One session = one logical task.

### 2. Over-Specified CLAUDE.md

**Problem:** 500+ line CLAUDE.md where important rules get lost in noise. Claude ignores half of it.

**Solution:** Ruthlessly prune. If Claude already does something correctly without the instruction, delete it. Convert deterministic rules to hooks.

### 3. Vague Requirements

**Problem:** "Fix the login bug" or "Make it better" -- Claude guesses wrong, multiple iterations wasted.

**Solution:** Include: symptom, likely location, what "fixed" looks like, verification method.

### 4. No Verification Loop

**Problem:** Claude produces plausible-looking code that doesn't handle edge cases.

**Solution:** Always provide verification (tests, scripts, screenshots). If you can't verify it, don't ship it. This is the SINGLE highest-leverage practice.

### 5. Infinite Exploration

**Problem:** "Investigate X" without scoping. Claude reads hundreds of files, consuming all context.

**Solution:** Scope investigations narrowly OR delegate to subagents (exploration stays in subagent's context).

### 6. Massive Unreviewed Refactors

**Problem:** Claude refactors entire modules in one pass. Subtle bugs introduced across many files.

**Solution:** Small, incremental changes. Review each step. Use checkpoints (`Esc+Esc` to rewind).

### 7. Correcting Over and Over

**Problem:** Claude makes mistake, you correct, still wrong, correct again. Context polluted with failed approaches.

**Solution:** After TWO failed corrections, `/clear` and write a better initial prompt incorporating what you learned.

### 8. Comprehension Debt

**Problem:** Claude writes 200 lines, tests pass, you ship it. Repeat 50 times. You have a codebase written by a stranger.

**Solution:** Review generated code. Ask Claude to explain non-obvious parts. Maintain understanding of your codebase.

### 9. Over-Specified Slash Commands

**Problem:** Complex list of custom slash commands engineers must learn -- hidden documentation, tribal knowledge.

**Solution:** Skills should be self-documenting through their descriptions. Use `/` autocomplete. Keep skill count manageable.

### 10. Trust Cascade in Teams

**Problem:** Team lead approves everything teammates produce without verification.

**Solution:** Use `TaskCompleted` hooks for automated quality gates. Have reviewer agent check implementer's work.

---

## 11. Advanced Patterns

### Using Worktrees for Parallel Development

Git worktrees create separate directories for branches, enabling true parallel Claude sessions:

```bash
# Create worktrees for parallel work
git worktree add ../feature-auth feature/auth
git worktree add ../feature-dashboard feature/dashboard

# Run Claude in each
cd ../feature-auth && claude
cd ../feature-dashboard && claude
```

Within Claude Code, use `/worktree` to create isolated working copies.

With subagents, set `isolation: worktree` to automatically create a temporary worktree:

```yaml
---
name: risky-refactor
description: Perform exploratory refactoring in isolation
isolation: worktree
---
```

### Context Window Management

#### Autocompact

Claude automatically compacts conversation when approaching context limits. Default threshold: ~95% capacity.

Override with: `CLAUDE_AUTOCOMPACT_PCT_OVERRIDE=70` (trigger at 70%)

During compaction, Claude preserves:
- Architectural decisions
- Unresolved bugs
- Implementation details
- 5 most recently accessed files

#### Manual Compaction

```
/compact Focus on the API changes and ignore the debugging we did earlier
```

#### Compaction Instructions in CLAUDE.md

```markdown
When compacting, always preserve:
- The full list of modified files
- All test commands and their results
- Any architectural decisions made during this session
```

#### Selective Rewind

`Esc + Esc` or `/rewind` -> Select a checkpoint -> "Summarize from here" condenses messages from that point forward while keeping earlier context intact.

### Subagent Spawning Patterns

#### Parallel Research
```
Research auth, database, and API modules in parallel using separate subagents.
Each should report: key files, patterns used, and potential issues.
```

#### Chain Subagents
```
Use the code-reviewer to find performance issues,
then use the optimizer to fix them.
```

#### Isolate Verbose Operations
```
Use a subagent to run the test suite and report only failing tests with error messages.
```

#### Writer/Reviewer Pattern
- Session A: Implement feature
- Session B (fresh context): Review implementation
- Session A: Address review feedback

### Hook Chains for Complex Workflows

Combine multiple hooks for sophisticated automation:

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          { "type": "command", "command": "./hooks/auto-format.sh" },
          { "type": "command", "command": "./hooks/auto-lint.sh", "async": true },
          { "type": "command", "command": "./hooks/run-affected-tests.sh", "async": true }
        ]
      }
    ],
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          { "type": "command", "command": "./hooks/block-dangerous.sh" }
        ]
      }
    ],
    "Stop": [
      {
        "hooks": [
          {
            "type": "agent",
            "prompt": "Check if all tasks are complete and tests pass. $ARGUMENTS",
            "timeout": 120
          }
        ]
      }
    ],
    "SessionStart": [
      {
        "matcher": "startup",
        "hooks": [
          { "type": "command", "command": "./hooks/load-project-context.sh" }
        ]
      }
    ]
  }
}
```

### Skill Composition

Skills can reference other skills and supporting files:

```yaml
---
name: full-feature
description: Implement a complete feature end-to-end
disable-model-invocation: true
context: fork
agent: general-purpose
---

Implement feature: $ARGUMENTS

Follow this workflow:
1. Read the skill at .claude/skills/api-conventions/SKILL.md for API patterns
2. Read the skill at .claude/skills/testing-patterns/SKILL.md for test patterns
3. Design the feature following these conventions
4. Implement with TDD
5. Run quality gates
6. Create a PR
```

### Agent Delegation Patterns

#### Coordinator Pattern
```yaml
---
name: coordinator
description: Coordinates work across specialized agents
tools: Task(worker, researcher, reviewer), Read, Bash
model: opus
---

You are a project coordinator. Break tasks into subtasks and delegate to:
- worker: Implementation tasks
- researcher: Investigation and analysis
- reviewer: Code review and quality checks

Monitor progress and synthesize results.
```

#### Gate Pattern
```yaml
---
name: quality-gate
description: Enforces quality standards before completion
tools: Read, Grep, Glob, Bash
model: sonnet
permissionMode: plan
---

Verify the following quality gates:
1. All tests pass: `npm test`
2. No type errors: `npm run typecheck`
3. No lint errors: `npm run lint`
4. Coverage meets thresholds
5. No TODO/FIXME left in changed files

Report: PASS or FAIL with details for each gate.
```

### Fan-Out Pattern for Large Migrations

```bash
# Generate task list
claude -p "List all TypeScript files needing migration" > files.txt

# Process each file in parallel
for file in $(cat files.txt); do
  claude -p "Migrate $file from React to Vue. Return OK or FAIL." \
    --allowedTools "Edit,Read,Grep,Glob,Bash(npm test *)" &
done
wait
```

### Environment Variable Configuration via Settings

```json
{
  "env": {
    "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1",
    "CLAUDE_AUTOCOMPACT_PCT_OVERRIDE": "70",
    "CLAUDE_CODE_EFFORT_LEVEL": "high",
    "MAX_THINKING_TOKENS": "16000",
    "CLAUDE_CODE_MAX_OUTPUT_TOKENS": "64000",
    "BASH_DEFAULT_TIMEOUT_MS": "120000",
    "NODE_ENV": "development"
  }
}
```

---

## Sources

### Official Anthropic Documentation
- [Create custom subagents](https://code.claude.com/docs/en/sub-agents)
- [Extend Claude with skills](https://code.claude.com/docs/en/skills)
- [Hooks reference](https://code.claude.com/docs/en/hooks)
- [Manage Claude's memory](https://code.claude.com/docs/en/memory)
- [Claude Code settings](https://code.claude.com/docs/en/settings)
- [Best Practices for Claude Code](https://code.claude.com/docs/en/best-practices)
- [Orchestrate teams of Claude Code sessions](https://code.claude.com/docs/en/agent-teams)
- [Connect Claude Code to tools via MCP](https://code.claude.com/docs/en/mcp)

### Anthropic Engineering Blog
- [Effective context engineering for AI agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)
- [Claude Code: Best practices for agentic coding](https://www.anthropic.com/engineering/claude-code-best-practices)
- [Equipping agents for the real world with Agent Skills](https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills)
- [How Anthropic teams use Claude Code (PDF)](https://www-cdn.anthropic.com/58284b19e702b49db9302d5b6f135ad8871e7658.pdf)

### Anthropic Resources
- [Skill authoring best practices](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices)
- [The Complete Guide to Building Skills for Claude (PDF)](https://resources.anthropic.com/hubfs/The-Complete-Guide-to-Building-Skill-for-Claude.pdf)
- [Prompting best practices](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices)

### Community Resources
- [Claude Agent Skills: A First Principles Deep Dive](https://leehanchung.github.io/blogs/2025/10/26/claude-skills-deep-dive/)
- [Inside Claude Code Skills: Structure, prompts, invocation](https://mikhail.io/2025/10/claude-code-skills/)
- [From Tasks to Swarms: Agent Teams in Claude Code](https://alexop.dev/posts/from-tasks-to-swarms-agent-teams-in-claude-code/)
- [How I Use Every Claude Code Feature](https://blog.sshh.io/p/how-i-use-every-claude-code-feature)
- [Claude's Context Engineering Secrets](https://01.me/en/2025/12/context-engineering-from-claude/)
- [Spotify: Background Coding Agents: Context Engineering](https://engineering.atspotify.com/2025/11/context-engineering-background-coding-agents-part-2)

### GitHub Configuration Collections
- [trailofbits/claude-code-config](https://github.com/trailofbits/claude-code-config) -- Opinionated defaults from Trail of Bits
- [affaan-m/everything-claude-code](https://github.com/affaan-m/everything-claude-code) -- Battle-tested configs (Anthropic hackathon winner)
- [VoltAgent/awesome-claude-code-subagents](https://github.com/VoltAgent/awesome-claude-code-subagents) -- 100+ specialized subagents
- [ChrisWiles/claude-code-showcase](https://github.com/ChrisWiles/claude-code-showcase) -- Comprehensive configuration example
- [wshobson/agents](https://github.com/wshobson/agents) -- 112 agents, 16 orchestrators, 146 skills
- [travisvn/awesome-claude-skills](https://github.com/travisvn/awesome-claude-skills) -- Curated skill list
- [disler/claude-code-hooks-mastery](https://github.com/disler/claude-code-hooks-mastery) -- Hook patterns and examples
- [anthropics/skills](https://github.com/anthropics/skills) -- Official Anthropic skill examples
