# Agentic Coding Research Summary (Feb 2026)

Compiled from 30+ sources for Phase 8 + 9 planning.

## Key Sources

- Anthropic: Claude Code Best Practices, Hooks Guide, Agent Teams docs
- DORA 2025 Report: TDD + AI = 2-3x productivity amplification
- Empirical study of 2,303 CLAUDE.md files from 1,925 OSS repos
- Agentic PRD design (prodmoh.com, BMAD Method)
- Single vs Multi-Agent comparison research

## Top Findings

### CLAUDE.md Best Practices
- Keep under 150 lines — if agents ignore rules, file is too long
- Use `.claude/rules/` with path-specific YAML frontmatter
- Only include what agents can't infer from code
- Security section missing from 85.5% of files — critical gap
- Repository-specific rules yield +10.87% accuracy vs generic rules
- "Write DRY code" = low signal; "Extract to src/modules/shared/ after 3 repetitions" = high signal

### Agent Architecture
- 3 focused agents outperform 7 generic ones (less coordination overhead)
- Effective agents use 6-8 tools, not more
- Haiku for read-only agents (90% of Sonnet capability, 3x cheaper)
- Hooks guarantee behavior (deterministic), LLM instructions don't
- TDD Guard pattern: block implementation without tests

### PRD Format
- Machine-readable acceptance criteria reduce clarification 50-70%
- Verifiable predicates > prose ("flutter_analyze.exit_code == 0" > "no errors")
- Dependencies between stories prevent scope bleed
- Progressive disclosure: agents see only current phase

### Quality Gates
- AI acts as amplifier of existing practices (DORA 2025)
- Contextual failure output > binary pass/fail
- Fast feedback first (typecheck, lint) before slow gates (coverage)
- AI-on-AI review (reviewer agent checks builder output) is emerging pattern

### "Less is More"
- Start single-agent, scale only when testing reveals limitations
- Multi-agent overhead burns budget for simple tasks
- Full teams for cross-cutting concerns only
- Session cleanup: /clear after 2 failed corrections

## Config Hierarchy (Claude Code)

| Type | Location | Shared? |
|------|----------|---------|
| Always-apply rules | `./CLAUDE.md` | Yes, git |
| Path-specific rules | `.claude/rules/*.md` | Yes, git |
| Project-specific agents | `.claude/agents/*.md` | Yes, git |
| Personal preferences | `~/.claude/CLAUDE.md` | No |
| Project hooks | `.claude/settings.json` | Yes, git |
| User hooks | `~/.claude/settings.json` | No |
| Auto-learned memory | `~/.claude/projects/<project>/memory/` | No |

## Bootstrap Agentic (Phase 9 Research)

### GitHub Spec Kit Pattern
- `/specify` → `/plan` → `/tasks` — 3-phase spec-driven development
- Spec captures "what/why", Plan captures "how", Tasks capture "do"
- "Constitution" file (= CLAUDE.md) enforces project conventions during planning

### BMAD Method
- 7 planning agents: Analyst → PM → Architect → Scrum Master → PO → Dev → QA
- "Control Manifest" per story: allowed files, forbidden packages, constraints
- Planning phase completes BEFORE any code is written

### Conversational Requirement Gathering
- Funnel order: Problem → Scope → Constraints → Architecture → Confirmation
- 25% fewer clarification meetings, 30% fewer requirement errors
- One question at a time beats dumping all questions at once

### Feature Decomposition
- INVEST criteria: Independent, Negotiable, Valuable, Estimable, Small, Testable
- Each user journey → 2-4 stories (domain → data → presentation → tests)
- Explicit dependency chains prevent parallel work conflicts

### App Bootstrapping Tools (Lovable, Bolt, v0)
- All converge on: natural language → spec confirmation → phased generation
- "70% problem": tools stall on complex logic without a spec to refer back to
- Proactive feature suggestions increase project completeness

### Key Sources (Phase 9)
- [GitHub Spec Kit](https://github.com/github/spec-kit/blob/main/spec-driven.md)
- [BMAD Method](https://github.com/bmad-code-org/BMAD-METHOD)
- [Agentic PRD Design (ProdMoh)](https://prodmoh.com/blog/agentic-prd)
- [AI-Driven Prototyping Comparison](https://addyo.substack.com/p/ai-driven-prototyping-v0-bolt-and)
- [Eltegra AI Requirements Engineering](https://www.eltegra.ai/blog/engineering-grade-requirements-generation)
- [Anthropic Agent Skills](https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills)
