# 28 — Vibe Coding vs Structured Agentic Coding — The Full Spectrum

> Sources: [Karpathy: Vibe Coding (X post)](https://x.com/karpathy/status/1886192184808149383), [Simon Willison: Not All AI-Assisted Programming](https://simonwillison.net/2025/Mar/19/vibe-coding/), [Willison: Vibe Engineering](https://simonwillison.net/2025/Oct/7/vibe-engineering/), [Osmani: The 70% Problem](https://addyo.substack.com/p/the-70-problem-hard-truths-about), [arXiv:2505.19443 Vibe vs Agentic](https://arxiv.org/abs/2505.19443), [Red Hat: Uncomfortable Truth](https://developers.redhat.com/articles/2026/02/17/uncomfortable-truth-about-vibe-coding), [The New Stack: Honeymoon Over](https://thenewstack.io/vibe-coding-six-months-later-the-honeymoons-over/), [Futurism: Inventor Doesn't Use It](https://futurism.com/artificial-intelligence/inventor-vibe-coding-doesnt-work), [arXiv:2512.11922 Vibe Coding in Practice](https://arxiv.org/abs/2512.11922), [Thoughtworks: SDD](https://www.thoughtworks.com/en-us/insights/blog/agile-engineering-practices/spec-driven-development-unpacking-2025-new-engineering-practices), [Martin Fowler: SDD Tools](https://martinfowler.com/articles/exploring-gen-ai/sdd-3-tools.html), [GitLab: Vibe to Agentic Roadmap](https://about.gitlab.com/the-source/ai/from-vibe-coding-to-agentic-ai-a-roadmap-for-technical-leaders/)

## Definition: What is Vibe Coding?

**Andrej Karpathy** (February 2025): "You fully give in to the vibes, embrace exponentials, and forget that the code even exists. It's not really coding — I just see stuff, say stuff, run stuff, and copy-paste stuff, and it mostly works."

**Simon Willison's Golden Rule**: "I won't commit any code to my repository if I couldn't explain exactly what it does to somebody else. If an LLM wrote it and you reviewed, tested, and understood it — that's software development, not vibe coding."

## The Five-Dimension Taxonomy (arXiv:2505.19443)

| Dimension | Vibe Coding | Agentic Coding |
|-----------|-------------|----------------|
| **Autonomy** | Low-moderate (assistant) | Moderate-high (independent planning) |
| **Developer Role** | Creative partner/prompter | System architect/supervisor |
| **Execution** | Developer-managed | Containerized, self-validation |
| **Feedback** | Post-hoc, human-driven | Integrated, goal-aware loops |
| **Safety** | External static analysis | Embedded guardrails, isolation |

## The Spectrum

```
Vibe Coding ←─────────────────────────────────→ Structured Agentic Coding
    │                                                      │
    ├── No code review                    TDD-first ──────┤
    ├── Accept all suggestions        Spec-driven dev ────┤
    ├── Copy-paste errors back      Multi-agent teams ────┤
    ├── No testing                    Quality gates ──────┤
    ├── No architecture plan      Architecture-first ────┤
    └── "It works" = done         Verification-first ────┘
```

**Simon Willison** proposes calling the disciplined end **"Vibe Engineering"** — "a different, harder, more sophisticated way of working with AI tools."

## When Vibe Coding Works

- Throwaway prototypes and weekend projects
- Personal tools with no security/financial exposure
- Educational contexts for learning frameworks
- Proof-of-concept and rapid ideation
- Sandboxed environments (Claude Artifacts, Replit)

## When Vibe Coding Fails Catastrophically

**James Gosling** (Java creator): "Not ready for the enterprise because in the enterprise, software has to work every f***ing time."

### The Evidence

- **45%** of AI-generated code contains security vulnerabilities (Georgetown CSET)
- **2.74x** higher security vulnerability rates in AI-authored PRs
- **1.7x** more "major" issues compared to human-written code
- **69 vulnerabilities** found across 15 vibe-coded test applications
- **Base44**: AI-generated authorization bypass vulnerability
- **Tea App**: Breach exposing ~72,000 images including 13,000 government IDs

### The Karpathy Irony

When building Nanochat (~8,000 lines of code), Karpathy **hand-coded the entire thing**. He admitted: "I tried to use Claude/Codex agents a few times but they just didn't work well enough at all." The inventor of vibe coding abandoned it for real work.

## The 70%/80% Problem (Addy Osmani)

### The 70% Problem
AI rapidly produces ~70% of a solution: scaffolding, patterns, boilerplate. The remaining 30% — edge cases, security, production integration — "can be just as time consuming as it ever was."

**The Knowledge Paradox**: Experienced developers accelerate what they already understand. Juniors accept flawed solutions without catching gaps.

### The 80% Problem (Evolution)
- The gap from 70% to 80% is most accessible in **greenfield contexts**
- In mature codebases: "the agent doesn't know what it doesn't know"
- The challenge shifted from syntax to governance: "Shipping software is not a syntax problem. It's a policy problem."

### The Productivity Paradox
- Engineers report being "dramatically more productive"
- Yet "the actual software we use daily doesn't seem like it's getting noticeably better"
- Trust declining: favorable views dropped from 70% → 60% in two years
- Experienced developers were **19% slower** using AI despite perceiving improvements

## Structured Alternatives

### Spec-Driven Development (SDD)

**Three levels** (Fowler/Boeckeler):
1. **Spec-first**: Initial specifications guide AI development
2. **Spec-anchored**: Specifications persist for ongoing maintenance
3. **Spec-as-source**: Specifications become primary artifacts; humans edit specs only

**Results**: MIT Sloan/Microsoft/GitHub study: **56% programming time reduction**

**Fowler's Concerns**: Inflexible workflows, reviewing many markdown files is "tedious", agents frequently ignore instructions, encodes waterfall-era assumptions

### TDD-Driven Agents

- Write test specifications before code generation
- Apply Red-Green-Refactor with AI generation
- Tests serve as safety net when agents make mistakes
- **94.3%** success rate with human-written tests (TDFlow)
- **38.43%** improvement in pass@1 with test-driven interaction (TiCoder)

### PRD-to-Code Pipeline

PRD → Spec → Plan → Tasks → Implement → Test → Review — each step with human gates and AI verification.

## GitLab's Six Evolutionary Stages

1. AI assistance for routine tasks
2. Expansion across the development lifecycle
3. Governance framework establishment
4. Autonomous agent introduction
5. Scaled agent implementation
6. Continuous improvement and organizational AI literacy

## The "Death of Vibe Coding" Timeline

- **Feb 2025**: Karpathy coins the term. Euphoria.
- **Mid 2025**: 25% of YC W25 cohort had nearly entirely AI-generated codebases
- **Late 2025**: Honeymoon ends. "Spending more time cleaning up than if they'd started with discipline"
- **Feb 2026**: Emerging consensus: vibe coding is dead for production

**Prediction**: 75% of tech leaders will face severe technical debt from AI-driven practices prioritizing speed over understanding (Pixelmojo)

## Key Takeaway

> "Vibe coding is dead as a standalone methodology for anything beyond prototyping. The future belongs to **structured agentic coding**: TDD-first, spec-driven, architecture-aware, with multi-layer verification at every step."
