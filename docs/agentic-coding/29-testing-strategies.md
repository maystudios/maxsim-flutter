# 29 — Testing Strategies for AI-Generated Code

> Sources: [TDFlow (arXiv)](https://arxiv.org/html/2510.23761v1), [TiCoder (arXiv)](https://arxiv.org/html/2404.10100v1), [Anthropic PBT Agent](https://red.anthropic.com/2026/property-based-testing/), [Meta Mutation Testing](https://engineering.fb.com/2025/09/30/security/llms-are-the-key-to-mutation-testing-and-better-compliance/), [CodeRabbit Report](https://www.coderabbit.ai/blog/state-of-ai-vs-human-code-generation-report), [CodeScene Quality](https://codescene.com/blog/agentic-ai-coding-best-practice-patterns-for-speed-with-quality), [Kleppmann: Vericoding](https://martin.kleppmann.com/2025/12/08/ai-formal-verification.html), [Fowler: TDD (Jan 2026)](https://martinfowler.com/fragments/2026-01-08.html), [Thoughtbot: TDD](https://thoughtbot.com/blog/prevent-the-robocalypse-with-tdd), [Superpowers](https://github.com/obra/superpowers), [OpenObserve QA](https://openobserve.ai/blog/autonomous-qa-testing-ai-agents-claude-code/)

## The Case for Test-First with AI

### TDFlow: The Definitive Evidence

| Benchmark | Human-Written Tests | LLM-Generated Tests |
|-----------|-------------------|-------------------|
| SWE-Bench Lite | **88.8%** pass rate | N/A |
| SWE-Bench Verified | **94.3%** pass rate | **68.0%** pass rate |
| Cost per issue | **$1.51** | — |

The **26.3 percentage point gap** between human-written tests (test-first) and LLM tests (test-after) is the most compelling evidence for TDD with AI. Out of 800 runs, only 7 instances of test hacking were found.

### TiCoder (Microsoft Research)

- **38.43%** average absolute improvement in pass@1 within 5 user interactions
- Significantly **less cognitive load** for developers
- Developers are **more likely to correctly evaluate** AI suggestions

## TDD with Claude Code

### Red-Green-Refactor with AI

Martin Fowler (Feb 2026, Agile Manifesto 25th anniversary): TDD has **never been more important** because AI produces code that "works" superficially but lacks rigor. TDD is "the forcing function that makes you understand what's being built."

**Critical insight — context pollution**: When a single agent writes both tests and implementation, the test writer's knowledge contaminates the implementer. **Sub-agents are essential** for genuine test-first development. Context isolation ensures the test-writing agent does not know how the code will be implemented.

### TDD Enforcement Tools

| Tool | Method | Key Feature |
|------|--------|-------------|
| **Superpowers** (27K+ GitHub stars) | Claude Code skills framework | Deletes code that appears before tests |
| **TDD Guard** | Claude Code hooks | Blocks implementation without failing tests |
| **CLAUDE.md approach** | Embedded instructions | Consistent TDD across sessions |
| **Eval-Driven Development** (Fireworks AI) | pytest-centric framework | Write evals before code for agent development |

## Mutation Testing

### Meta's ACH System (Production Scale)

| Metric | Value |
|--------|-------|
| Test acceptance rate (engineers) | **73%** |
| Tests judged as privacy-relevant | **36%** |
| Equivalence detector precision | **0.95** |
| Equivalence detector recall | **0.96** |
| Platforms | Facebook, Instagram, WhatsApp, Quest, Ray-Ban |

Engineers "appreciated being able to focus on evaluating tests rather than having to construct them."

## Property-Based Testing

### Anthropic's Red Team PBT Agent

Tested **100+ popular Python packages** using a custom Claude Code command:

| Metric | Value |
|--------|-------|
| Bug reports generated | **984** |
| Top-scoring reports: valid | **86%** |
| Top-scoring reports: reportable | **81%** |
| Zero-day vulnerabilities found | **500+** |

Agent workflow: Read code + docs → Propose properties → Write Hypothesis tests → Run & self-reflect → Generate bug reports.

Notable bugs: NumPy `random.wald` returning negative numbers, AWS Lambda Powertools iterator bug, Hugging Face Tokenizers CSS output issue.

### PGS Framework

Two collaborative LLM agents (Generator + Tester) achieved **37.3% higher correct response rate** than conventional methods.

## AI-on-AI Code Review

### CodeRabbit Study (470 PRs)

| Defect Category | AI vs Human |
|-----------------|-------------|
| Issues per PR (overall) | **1.7x** more (10.83 vs 6.45) |
| Logic & correctness | **75% higher** |
| Code readability | **3x more common** |
| Security vulnerabilities | **Up to 2.74x** |
| Excessive I/O operations | **~8x more common** |

### Multi-Model Review Pattern

Run code through **different LLMs** for review to catch model-specific biases. Properly configured, AI reviewers catch **70-80% of low-hanging fruit**, freeing humans for architecture review.

## Formal Verification ("Vericoding")

Martin Kleppmann (Dec 2025): AI will make formal verification mainstream. Instead of humans reviewing AI code, have the AI **prove** its code is correct. "Vericoding" vs "vibecoding."

**Astrogator** achieved: 83% accuracy verifying correct code, 92% accuracy identifying incorrect code.

## Coverage Metrics for AI Code

| Context | Recommended Coverage |
|---------|---------------------|
| Minimum baseline | **70%** |
| Standard target | **80%** |
| AI-generated code (2026) | **>80% + cyclomatic complexity <15 + defect density <1%** |
| CodeScene's own product | **~99%** |

**Key finding**: AI coding assistants **increase defect risk by 30%** when applied to unhealthy codebases (peer-reviewed, CodeScene).

## Testing Anti-Patterns

### Eight Failure Patterns (Augment Code)

1. **Hallucinated APIs** — 1 in 5 AI code samples references fake libraries
2. **Security vulnerabilities** — 45% of AI code contains security flaws; Java hits 70%
3. **Missing edge cases** — omitted null checks, early returns, guardrails
4. **Performance anti-patterns** — O(n²) where O(n) exists
5. **SQL Injection (CWE-89)**
6. **Cryptographic Failures (CWE-327)**
7. **Cross-Site Scripting (CWE-79)**
8. **Log Injection (CWE-117)**

### Multi-Agent QA (OpenObserve)

Eight specialized AI agents automate their entire E2E testing pipeline:

| Metric | Before | After |
|--------|--------|-------|
| Feature analysis time | 45-60 min | **5-10 min** |
| Flaky test reduction | baseline | **85%** |
| Test coverage | 380 tests | **700+ tests** |

## Key Takeaway

> Test-first with human-written tests achieves **94.3%** resolution (TDFlow) vs 68.0% with AI tests — a 26.3pp gap. The strongest testing strategy combines TDD discipline, context-isolated sub-agents, property-based testing for invariant violations, and mutation testing for compliance. AI-on-AI review catches 70-80% of surface issues but cannot replace human judgment on architecture.
