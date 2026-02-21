# 30 — Cost Optimization & Token Management for Claude Code

> Sources: [Anthropic Pricing](https://platform.claude.com/docs/en/about-claude/pricing), [Anthropic Cost Management](https://code.claude.com/docs/en/costs), [Anthropic Context Engineering](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents), [Prompt Caching](https://www.anthropic.com/news/prompt-caching), [Batch API](https://claude.com/blog/message-batches-api), [Faros AI ROI](https://www.faros.ai/blog/how-to-measure-claude-code-roi-developer-productivity-insights-with-faros-ai), [AICosts Subagent Analysis](https://www.aicosts.ai/blog/claude-code-subagent-cost-explosion-887k-tokens-minute-crisis), [Paper Compute](https://papercompute.com/blog/true-cost-of-claude-code/)

## Model Pricing (February 2026)

| Model | Input/MTok | Output/MTok | Cache Read | Cache Write (5m) |
|-------|-----------|-------------|-----------|-----------------|
| **Opus 4.6** | $5.00 | $25.00 | $0.50 | $6.25 |
| **Sonnet 4.6** | $3.00 | $15.00 | $0.30 | $3.75 |
| **Haiku 4.5** | $1.00 | $5.00 | $0.10 | $1.25 |

**Modifiers**: Fast Mode 6x, Long Context (>200K) 2x, Data Residency 1.1x, Batch API 0.5x.

## Token Consumption Patterns

| Metric | Value |
|--------|-------|
| Average daily cost per dev | **$6** |
| 90th percentile daily | **<$12** |
| Agent teams multiplier | **~7x** standard sessions |
| Context loading overhead | **~20K tokens** per subagent start |

### Cost by Agent Count

| Active Agents | Hourly Cost |
|---------------|-------------|
| 1 agent | $3-$8 |
| 3 agents | $15-$40 |
| 10 agents | $50-$150 |
| 25+ agents | $200-$500 |
| 49 agents | $3,000-$6,000 |

**Real-world incident**: 887K tokens/minute across 49 subagents, $8K-$15K for one session.

## Prompt Caching (90% Savings)

| Operation | vs Base Input |
|-----------|--------------|
| Cache write (5m) | 1.25x (25% premium) |
| Cache write (1h) | 2.0x (100% premium) |
| **Cache hit/read** | **0.10x (90% savings)** |

- Breakeven after **2 cache hits**
- Real-world case: **$720/month → $72/month** (90% reduction)
- Claude Code **automatically** applies prompt caching

## Auto-Compact & Context Management

- Triggers at **~95%** context capacity
- CLAUDE.md optimization: **54% reduction** in initial context (7,584 → 3,434 tokens)
- **60% context optimization** through structured compaction

### Three-Tier Documentation Strategy

| Tier | Loading | Token Impact |
|------|---------|-------------|
| CLAUDE.md | Always loaded | ~800-2,000 tokens |
| Skills | On-demand | 0 when unused |
| Reference docs | Never auto-loaded | 0 when unused |

## Model Routing Strategies

### OpusPlan Hybrid

- Plan mode: Opus for complex reasoning
- Execution mode: Sonnet for code generation
- **60-80% cheaper** than pure Opus, near-Opus planning quality

### Monthly Cost by Strategy

| Strategy | Cost/Dev/Month | Quality |
|----------|---------------|---------|
| Pure Opus 4.6 | $300-600 | Highest |
| OpusPlan hybrid | $120-250 | High+ |
| Pure Sonnet 4.6 | $100-200 | High |
| Sonnet + Haiku subagents | $80-150 | Good+ |

### Subagent Model Routing

```bash
export CLAUDE_CODE_SUBAGENT_MODEL="claude-sonnet-4-5-20250929"
```

Running main session on Opus with Sonnet/Haiku subagents = **80% cost reduction** on delegated work.

## Batch API (50% Discount)

| Model | Batch Input | Batch Output | Standard Savings |
|-------|-----------|-------------|-----------------|
| Opus 4.6 | $2.50 | $12.50 | 50% |
| Sonnet 4.6 | $1.50 | $7.50 | 50% |
| Haiku 4.5 | $0.50 | $2.50 | 50% |

**Batch + Caching combined**: Up to **95% total savings**. Up to 10,000 queries per batch, processed within 24 hours.

## ROI Frameworks

### Faros AI Enterprise Measurement

| Metric | Value |
|--------|-------|
| Tasks completed increase | **+21%** |
| PR throughput increase | **+98%** |
| Top performer story completion | **+164%** |
| Cost per incremental PR | **$37.50** |
| ROI | **4:1** |

**Productivity paradox**: Code review times increased 91%, DORA metrics "largely unchanged" at org level.

### ROI by Use Case

| Use Case | ROI Range |
|----------|-----------|
| TypeScript verification | 150-370% |
| Security audits | 200-380% |
| API documentation | 300-650% |
| Database migrations | 213-400% |

## Max Plan vs API

| Factor | Max $200/month | API Pay-per-token |
|--------|---------------|-------------------|
| Heavy daily use | **~18x cheaper** | Precise cost control |
| Rate limits | Weekly resets | No inherent limits |
| Budget | Fixed, predictable | Variable |
| Agent teams | Regular use | Occasional |

## Maximum Savings Cheat Sheet

| Strategy | Savings | Effort |
|----------|---------|--------|
| Prompt caching (reads) | **90%** on cached input | Automatic |
| Batch API | **50%** on all tokens | Async workflow |
| Batch + Caching | **Up to 95%** | Both required |
| OpusPlan hybrid | **60-80%** vs pure Opus | One-time config |
| Haiku subagents | **80%** vs Opus subagents | Per-subagent config |
| CLAUDE.md optimization | **54-62%** startup tokens | One-time refactor |
| Extended thinking reduction | **Up to 75%** on thinking | `MAX_THINKING_TOKENS=8000` |
| Hook preprocessing | **~100x** on verbose output | Per-hook setup |
| MCP server pruning | Variable | Periodic review |

## Key Takeaway

> The biggest cost lever is **model routing**: Opus for orchestration, Sonnet for implementation, Haiku for focused subtasks. Combined with prompt caching (90% savings), batch API (50% discount), and CLAUDE.md optimization (54% reduction), total costs can be reduced by 80-95% compared to naive Opus usage. Monitor with `/cost`, Datadog, or the Analytics API.
