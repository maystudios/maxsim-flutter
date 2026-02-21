# 27 — Real-World CLAUDE.md Files & Project Configuration

> Sources: [Trail of Bits Config](https://github.com/trailofbits/claude-code-config), [serpro69 Starter Kit](https://github.com/serpro69/claude-starter-kit), [ChrisWiles Showcase](https://github.com/ChrisWiles/claude-code-showcase), [arXiv:2511.09268 (328 files)](https://arxiv.org/html/2511.09268), [arXiv:2509.14744 (253 files)](https://arxiv.org/abs/2509.14744), [arXiv:2511.12884 (2,303 files)](https://arxiv.org/abs/2511.12884), [Anthropic Best Practices](https://code.claude.com/docs/en/best-practices), [HumanLayer CLAUDE.md](https://www.humanlayer.dev/blog/writing-a-good-claude-md), [Brandon Casci: Consistency](https://www.brandoncasci.com/2025/07/30/from-chaos-to-control-teaching-claude-code-consistency.html), [ClaudeFast Rules Guide](https://claudefa.st/blog/guide/mechanics/rules-directory), [NikiforovAll Plugins](https://github.com/NikiforovAll/claude-code-rules)

## Empirical Studies — What The Data Shows

### Study A: 328 Files from 100 Repos (arXiv:2511.09268)

| Category | Frequency |
|----------|-----------|
| Software Architecture | **72.6%** |
| Development Guidelines | 44.8% |
| Project Overview | 39.0% |
| Testing Guidelines | 35.4% |
| Testing Commands | 33.2% |
| Dependencies | 30.8% |
| General Guidelines | 25.6% |
| Integration/Usage | 18.0% |

**Key finding**: Architecture appears in ALL top-5 co-occurrence patterns.

### Study B: 253 Files from 242 Repos (arXiv:2509.14744)

Most prevalent: Build and Run (77.1%), Implementation Details (71.9%), Architecture (64.8%), Testing (60.5%)

Least prevalent: Security (8.7%), UI/UX (8.3%), Performance (12.7%)

**Key finding**: "Manifests are primarily optimized to help agents execute and maintain code efficiently rather than address broader quality attributes."

### Study C: 2,303 Files across Tools (arXiv:2511.12884)

Median Flesch Reading Ease: 16.6 — classified as "very difficult to read" (comparable to legal contracts). As projects evolve, context files accumulate **"context debt"** where instructions meant to clarify obscure actual requirements.

## Production-Grade Reference Implementations

### Trail of Bits (Security-First Gold Standard)

```
~/.claude/
├── CLAUDE.md         # Global: philosophy, quality limits, language toolchains
├── settings.json     # Deny: ~/.ssh/**, ~/.aws/**, ~/.gnupg/**, crypto wallets
└── hooks/
    ├── block-dangerous.sh   # Blocks rm -rf, direct pushes to main
    ├── audit-log.sh         # Logs all tool invocations
    └── anti-rationalize.sh  # Stop hook preventing justification of bad code
```

Key principles: "No speculative features, no premature abstraction, replace rather than deprecate."

### serpro69/claude-starter-kit

- 47 Task Master commands
- 7 skills (analysis, implementation, testing, documentation, guidelines, review, COVE)
- 3 sub-agents: task-orchestrator (Opus), task-executor (Sonnet), task-checker (Sonnet)
- 4 MCP servers (Context7, Serena, Task Master, Pal)
- GitHub Actions template-sync for pulling upstream config updates

## Best Patterns from Production

### Pattern 1: Ruthless Brevity
- Anthropic: "For each line, ask: Would removing this cause mistakes? If not, cut it."
- HumanLayer: Root CLAUDE.md **under 60 lines**
- One project went from 1,400+ lines to ~200 after discovering bloat caused instructions to be ignored

### Pattern 2: WHY-WHAT-HOW Framework
- **WHAT**: Tech stack, project structure, key directories
- **WHY**: Project purpose, architectural decisions, business context
- **HOW**: Build/test/lint commands, workflows, verification methods

### Pattern 3: Include/Exclude Decision Matrix

| Include | Exclude |
|---------|---------|
| Bash commands Claude cannot guess | Anything Claude can infer from code |
| Style rules that differ from defaults | Standard language conventions |
| Testing instructions and runners | Detailed API docs (link instead) |
| Architectural decisions | Info that changes frequently |
| Common gotchas | Self-evident practices |

### Pattern 4: Verification-First Design
Include exact test commands, expected outputs, linting/type-checking as mandatory final steps. This is the single highest-leverage pattern.

### Pattern 5: Anti-Pattern Documentation
"The 'never do this' section might be more valuable than the 'always do this' section."

### Pattern 6: Progressive Disclosure
```markdown
# CLAUDE.md (~60-120 lines)
See @docs/api-patterns.md for API conventions.
See @docs/testing-guide.md for test setup.
```

## Rules Directory Organization

```
.claude/rules/
├── code-style.md          # Formatting, naming, imports
├── testing.md             # Test patterns, runner config
├── security.md            # Secret handling, auth patterns
├── git-workflow.md        # Commit conventions, branch rules
├── frontend/
│   ├── react.md           # Component patterns (paths: src/components/**/*.tsx)
│   └── styles.md          # CSS conventions
└── backend/
    ├── api.md             # Endpoint patterns (paths: src/api/**/*.ts)
    └── database.md        # Query patterns
```

Path-specific targeting via YAML frontmatter ensures rules only load when relevant files are accessed.

## CLAUDE.md in Monorepos

**Ancestor loading (upward)**: Walks up from cwd to root at startup — immediate context.
**Descendant loading (downward)**: Lazy-loaded only when accessing those subdirectories.
**Sibling branches**: Never loaded — working in frontend/ doesn't load backend/CLAUDE.md.

```
/monorepo/
├── CLAUDE.md          # Shared conventions (always loaded)
├── frontend/
│   └── CLAUDE.md      # Component patterns (lazy-loaded)
├── backend/
│   └── CLAUDE.md      # API patterns (lazy-loaded)
└── api/
    └── CLAUDE.md      # Service patterns (lazy-loaded)
```

## Settings.json Best Practices

### Permission Deny Rules (from Trail of Bits)
```json
{
  "permissions": {
    "deny": [
      "~/.ssh/**", "~/.gnupg/**", "~/.aws/**",
      "~/.azure/**", "~/.kube/**", "~/.npmrc",
      "~/.git-credentials", "~/.config/gh/**"
    ]
  }
}
```

### Settings Hierarchy

| Scope | Location | Priority |
|-------|----------|----------|
| Global | `~/.claude/settings.json` | Lowest |
| Project (shared) | `.claude/settings.json` | Medium |
| Local (personal) | `.claude/settings.local.json` | Highest |

Deny rules always take precedence over allow rules.

## Key Takeaway

> Architecture is the #1 most important content in CLAUDE.md (72.6% of files include it). Keep the file under 200 lines, use @imports for details, include verification commands, and document anti-patterns explicitly.
