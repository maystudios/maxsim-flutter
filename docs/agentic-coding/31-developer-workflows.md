# 31 — Developer Workflows & Daily Practices with Claude Code

> Sources: [Anthropic Best Practices](https://code.claude.com/docs/en/best-practices), [Anthropic Common Workflows](https://code.claude.com/docs/en/common-workflows), [incident.io Worktrees](https://incident.io/blog/shipping-faster-with-claude-code-and-git-worktrees), [Anthropic Internal Usage](https://www.anthropic.com/news/how-anthropic-teams-use-claude-code), [sshh.io Feature Guide](https://blog.sshh.io/p/how-i-use-every-claude-code-feature), [Addy Osmani: Agent Teams](https://addyosmani.com/blog/claude-code-agent-teams/), [Agentic Coding Handbook](https://tweag.github.io/agentic-coding-handbook/)

## Daily Developer Routine

### Session Lifecycle

**Morning Startup:**
1. `claude --continue` or `claude --resume <session-name>` to pick up previous work
2. `/context` to check token usage from resumed session
3. Start fresh with `/clear` if resuming would carry stale context

**Mid-Session Hygiene:**
- `/context` every 5-10 exchanges to monitor the 200K token window
- `/clear` between unrelated tasks — the **single most impactful habit**
- After 2 failed corrections: `/clear` and restart with a better prompt

**Session Organization:**
- `/rename` early — descriptive names like `oauth-migration`
- `P` in `/resume` picker to preview, `B` to filter by branch
- Different workstreams → separate, persistent sessions

### The "Document & Clear" Method

For long-running tasks:
1. Have Claude dump plan and progress into a `.md` file
2. `/clear` to reset state
3. Start fresh, telling Claude to read the markdown and continue

### Anthropic Internal Stats

- Claude used in **59%** of daily work (up from 28% twelve months ago)
- Average **+50%** productivity boost (up from +20%)

## Git Integration Patterns

### Git Worktrees (Built-in)

```bash
claude -w feature-auth    # Start in worktree with new branch
claude -w bugfix-123      # Another parallel session
claude -w                 # Auto-generated random name
```

Worktrees at `<repo>/.claude/worktrees/<name>`, branches named `worktree-<name>`. Auto-cleanup on exit if no changes.

### incident.io Case Study

Scaled from zero to **4-7 concurrent AI agents** in 4 months across ~500K LOC TypeScript.

Custom `w` function:
```bash
w myproject new-feature          # Create worktree
w myproject new-feature claude   # Run Claude in that worktree
```

- **18% build improvement** discovered by Claude analyzing Makefile (cost: $8)
- New hire shipped customer value **by day 2**
- UI feature: 30 seconds prompt → 10 minutes execution → **90% working result**

### Writer/Reviewer Pattern

| Session A (Writer) | Session B (Reviewer) |
|---|---|
| Implement feature | — |
| — | Review with fresh context (no bias) |
| Address feedback | — |

## AI Pair Programming

### Explore-Plan-Implement-Commit Cycle

1. **Explore** (Plan Mode): Read files, answer questions, no changes
2. **Plan**: Create implementation plan; `Ctrl+G` to edit in text editor
3. **Implement** (Normal Mode): Code against the plan
4. **Commit**: Descriptive message + PR

**When to skip planning**: If you could describe the diff in one sentence.

### Verification-First (Highest Leverage)

Give Claude a way to verify its own work:

| Bad | Good |
|-----|------|
| "implement email validation" | "write validateEmail. Test: user@example.com=true, invalid=false. Run tests after." |
| "make dashboard look better" | "[paste screenshot] implement this design. Screenshot and compare." |

### Let Claude Interview You

```
I want to build [brief description]. Interview me using AskUserQuestion.
Ask about technical implementation, UI/UX, edge cases, concerns, tradeoffs.
Keep interviewing until covered, then write spec to SPEC.md.
```

Then start **fresh session** to execute the spec — clean context.

## Task Decomposition

### Single-Agent Sizing

- Keep diffs **under 200 lines** when possible
- One logical change per commit
- Request ASCII wireframes before implementation (minimal tokens)
- Ask for plan first, approve, then request step 1 diff only

### Multi-Agent Task Decomposition (Addy Osmani)

- **5-6 tasks** per teammate
- Self-contained units with clear deliverables
- **File ownership boundaries** (prevent same-file edits)
- Explicit task-specific briefs in spawn prompts

**Use multi-agent for**: Parallel investigation, cross-layer features, simultaneous exploration
**Avoid for**: Sequential work, single-file modifications, heavy dependencies

### Fan-Out Pattern (Large Migrations)

```bash
for file in $(cat files.txt); do
  claude -p "Migrate $file from React to Vue. Return OK or FAIL." \
    --allowedTools "Edit,Bash(git commit *)"
done
```

Test on 2-3 files first, refine prompt, then run at scale.

## Context Management

### Token Budget

| Component | Token Cost |
|-----------|-----------|
| System prompt | ~5-15K |
| CLAUDE.md files | ~1-10K |
| Tool schemas | ~500-2,000 per MCP server |
| Response buffer | ~33-45K |
| **Available for work** | **~140-150K** |

### Key Techniques

- Auto-compaction at ~83.5% (167K/200K) — summarizes history
- Custom: `/compact Focus on code samples and API usage`
- `/clear` between unrelated tasks
- Skills for on-demand context loading
- @-imports for modular documentation

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Esc` | Cancel current generation |
| `Esc Esc` | Rewind to last checkpoint |
| `Ctrl+G` | Open Plan Mode editor |
| `Alt+T` / `Option+T` | Toggle thinking level |
| `Shift+Tab` | Toggle Delegate/Architect mode |
| `Tab` | Accept inline suggestion |
| `Ctrl+C` | Exit Claude Code |

## Plan Mode

- Activated with `Ctrl+G` or `Shift+Tab`
- Claude explores codebase and designs approach without making changes
- Perfect for risk mitigation — "leave Claude running in plan mode without worrying about unauthorized changes"
- Exit Plan Mode to execute

## Slash Commands & Skills

| Command | Action |
|---------|--------|
| `/clear` | Reset context |
| `/compact` | Compress conversation |
| `/context` | Show token usage |
| `/cost` | Show session cost (API) |
| `/stats` | Show usage stats (subscription) |
| `/resume` | Resume previous session |
| `/rename` | Rename current session |
| `/model` | Switch model or set effort |
| `/mcp` | Manage MCP servers |
| `/init` | Bootstrap CLAUDE.md |

Custom commands in `.claude/commands/*.md`, skills in `.claude/skills/`.

## Productivity Metrics

| Metric | Source |
|--------|--------|
| 3x overall speedup (solo dev, 6mo → 2mo) | Community reports |
| 10x on some tasks, 0x on others | Variable by task type |
| +50% average productivity (Anthropic internal) | Official |
| +98% PR throughput | Faros AI measurement |
| 59% of daily work uses Claude | Anthropic internal |

## Key Takeaway

> The most effective Claude Code workflow is **Explore-Plan-Implement-Commit** with `/clear` between unrelated tasks. Verification-first prompting (including test commands and success criteria) is the highest-leverage practice. For parallel work, git worktrees with separate Claude sessions enable 4-7 concurrent agents. Task sizing should target <200 line diffs for single agents, 5-6 tasks per teammate for teams.
