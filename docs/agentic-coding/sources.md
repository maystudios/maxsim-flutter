# Source Registry — Agentic Coding Research

> Compiled: 2026-02-21 (Updated with Phase 3 specialized deep dives)
> Total sources evaluated: 300+
> Sources deeply analyzed: 200+

## Quality Rating System

| Rating | Description | Criteria |
|--------|-------------|----------|
| **S-Tier** | Official, authoritative | Anthropic docs, engineering blog |
| **A-Tier** | High quality, verified | Production case studies, established tech blogs |
| **B-Tier** | Good, community-verified | Popular GitHub repos, well-researched guides |
| **C-Tier** | Useful, verify independently | Medium articles, tutorials, opinion pieces |
| **Research** | Academic, empirical | Papers, studies, data-driven analysis |

---

## S-Tier — Official Anthropic Sources

### Documentation
| # | Title | URL | Topics |
|---|-------|-----|--------|
| 1 | Best Practices for Claude Code | https://code.claude.com/docs/en/best-practices | All core patterns |
| 2 | Agent Teams Documentation | https://code.claude.com/docs/en/agent-teams | Multi-agent orchestration |
| 3 | Create Custom Subagents | https://code.claude.com/docs/en/sub-agents | Agent definitions |
| 4 | Skills Documentation | https://code.claude.com/docs/en/skills | Skill system |
| 5 | Hooks Reference | https://code.claude.com/docs/en/hooks | Automation hooks |
| 6 | Memory System | https://code.claude.com/docs/en/memory | CLAUDE.md, rules, memory |
| 7 | Settings Configuration | https://code.claude.com/docs/en/settings | Permissions, env vars |
| 8 | MCP Integration | https://code.claude.com/docs/en/mcp | MCP servers |
| 9 | Security | https://code.claude.com/docs/en/security | Security model |
| 10 | Common Workflows | https://code.claude.com/docs/en/common-workflows | Workflow recipes |
| 11 | Model Configuration | https://code.claude.com/docs/en/model-config | Model selection |
| 12 | Plugins Reference | https://code.claude.com/docs/en/plugins | Plugin system |
| 13 | Agent SDK Overview | https://platform.claude.com/docs/en/agent-sdk/overview | Programmatic SDK |

### Engineering Blog
| # | Title | URL | Topics |
|---|-------|-----|--------|
| 14 | Effective Context Engineering for AI Agents | https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents | Context management |
| 15 | Claude Code: Best Practices for Agentic Coding | (redirects to docs) | Best practices |
| 16 | Equipping Agents with Agent Skills | https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills | Skills design |
| 17 | How Anthropic Teams Use Claude Code | https://www.anthropic.com/news/how-anthropic-teams-use-claude-code | Internal usage |
| 18 | Claude Code Sandboxing | https://www.anthropic.com/engineering/claude-code-sandboxing | Security |
| 19 | Building Agents with Claude Agent SDK | https://www.anthropic.com/engineering/building-agents-with-the-claude-agent-sdk | SDK |

### Reports & Resources
| # | Title | URL | Topics |
|---|-------|-----|--------|
| 20 | Eight Trends Defining Software in 2026 | https://claude.com/blog/eight-trends-defining-how-software-gets-built-in-2026 | Industry trends |
| 21 | 2026 Agentic Coding Trends Report (PDF) | https://resources.anthropic.com/hubfs/2026%20Agentic%20Coding%20Trends%20Report.pdf | Full report |
| 22 | How Anthropic Teams Use Claude Code (PDF) | https://www-cdn.anthropic.com/58284b19e702b49db9302d5b6f135ad8871e7658.pdf | Case studies |
| 23 | Skill Authoring Best Practices | https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices | Skill design |
| 24 | Prompting Best Practices | https://claude.com/blog/best-practices-for-prompt-engineering | Prompting |
| 25 | Using CLAUDE.MD Files | https://claude.com/blog/using-claude-md-files | CLAUDE.md |

---

## A-Tier — Production Case Studies & Established Tech Blogs

| # | Title | URL | Topics | Rating Rationale |
|---|-------|-----|--------|-----------------|
| 26 | Martin Fowler: Context Engineering for Coding Agents | https://martinfowler.com/articles/exploring-gen-ai/context-engineering-coding-agents.html | Context engineering | Established authority |
| 27 | incident.io: Shipping Faster with Worktrees | https://incident.io/blog/shipping-faster-with-claude-code-and-git-worktrees | Parallel dev | Production case study |
| 28 | Spotify: Context Engineering for Background Agents | https://engineering.atspotify.com/2025/11/context-engineering-background-coding-agents-part-2 | Context management | Production case study |
| 29 | Addy Osmani: The 80% Problem | https://addyo.substack.com/p/the-80-problem-in-agentic-coding | Anti-patterns | Google engineer, data-driven |
| 30 | Kent Beck on TDD + AI | https://newsletter.pragmaticengineer.com/p/tdd-ai-agents-and-coding-with-kent | TDD | TDD creator |
| 31 | O'Reilly: Auto-Reviewing Claude's Code | https://www.oreilly.com/radar/auto-reviewing-claudes-code/ | Code review | Established publisher |
| 32 | Armin Ronacher: Agentic Coding Recommendations | https://lucumr.pocoo.org/2025/6/12/agentic-coding/ | Best practices | Flask creator |
| 33 | CodeScene: Speed with Quality | https://codescene.com/blog/agentic-ai-coding-best-practice-patterns-for-speed-with-quality | Quality patterns | Data-driven analysis |
| 34 | Backslash: Claude Code Security | https://www.backslash.security/blog/claude-code-security-best-practices | Security | Security firm |
| 35 | Stack Overflow: Bugs with AI Agents | https://stackoverflow.blog/2026/01/28/are-bugs-and-incidents-inevitable-with-ai-coding-agents/ | Error patterns | Major platform |

---

## B-Tier — Community Guides & GitHub Repos

| # | Title | URL | Topics | Rating Rationale |
|---|-------|-----|--------|-----------------|
| 36 | awesome-claude-code | https://github.com/hesreallyhim/awesome-claude-code | Ecosystem | Curated, comprehensive |
| 37 | VoltAgent/awesome-subagents | https://github.com/VoltAgent/awesome-claude-code-subagents | 100+ agents | Large collection |
| 38 | wshobson/agents | https://github.com/wshobson/agents | 112 agents, 146 skills | Massive collection |
| 39 | trailofbits/claude-code-config | https://github.com/trailofbits/claude-code-config | Security config | Security experts |
| 40 | affaan-m/everything-claude-code | https://github.com/affaan-m/everything-claude-code | Battle-tested configs | Hackathon winner |
| 41 | disler/claude-code-hooks-mastery | https://github.com/disler/claude-code-hooks-mastery | Hook patterns | Comprehensive |
| 42 | anthropics/skills | https://github.com/anthropics/skills | Official skills | Official examples |
| 43 | ChrisWiles/claude-code-showcase | https://github.com/ChrisWiles/claude-code-showcase | Config showcase | Well-documented |
| 44 | travisvn/awesome-claude-skills | https://github.com/travisvn/awesome-claude-skills | Skill list | Curated |
| 45 | Piebald-AI/claude-code-system-prompts | https://github.com/Piebald-AI/claude-code-system-prompts | System prompts | Version-tracked |
| 46 | HumanLayer: Writing a Good CLAUDE.md | https://www.humanlayer.dev/blog/writing-a-good-claude-md | CLAUDE.md | Well-researched |
| 47 | Builder.io: CLAUDE.md Guide | https://www.builder.io/blog/claude-md-guide | CLAUDE.md | Practical |
| 48 | Dometrain: Perfect CLAUDE.md | https://dometrain.com/blog/creating-the-perfect-claudemd-for-claude-code/ | CLAUDE.md | Detailed |
| 49 | sshh.io: Every Claude Code Feature | https://blog.sshh.io/p/how-i-use-every-claude-code-feature | All features | Comprehensive |
| 50 | alexop.dev: Agent Teams Deep Dive | https://alexop.dev/posts/from-tasks-to-swarms-agent-teams-in-claude-code/ | Agent teams | Detailed |
| 51 | alexop.dev: Spec-Driven Development | https://alexop.dev/posts/spec-driven-development-claude-code-in-action/ | SDD | Practical |
| 52 | alexop.dev: Claude Code Full Stack | https://alexop.dev/posts/understanding-claude-code-full-stack/ | Architecture | Comprehensive |
| 53 | alexop.dev: Forcing Claude Code to TDD | https://alexop.dev/posts/custom-tdd-workflow-claude-code-vue/ | TDD | Practical |
| 54 | Shipyard: Claude Code Cheatsheet | https://shipyard.build/blog/claude-code-cheat-sheet/ | Quick reference | Concise |
| 55 | ykdojo/claude-code-tips | https://github.com/ykdojo/claude-code-tips | 45 tips | Practical |
| 56 | Pimzino/claude-code-spec-workflow | https://github.com/Pimzino/claude-code-spec-workflow | SDD workflow | Automated |

---

## C-Tier — Useful Articles (Verify Independently)

| # | Title | URL | Topics |
|---|-------|-----|--------|
| 57 | Medium: Practical Best Practices | https://medium.com/@habib.mrad.83/claude-code-practical-best-practices-for-agentic-coding-2be1b62cfeff | Best practices |
| 58 | eesel.ai: 7 Essential Best Practices | https://www.eesel.ai/blog/claude-code-best-practices | Tips |
| 59 | QuantumByte: Best Practices Guide | https://quantumbyte.ai/articles/claude-code-best-practices | Patterns |
| 60 | Substack: Complete Guide | https://natesnewsletter.substack.com/p/the-claude-code-complete-guide-learn | Tutorial |
| 61 | SidBharath: Complete Tutorial | https://www.siddharthbharath.com/claude-code-the-complete-guide/ | Tutorial |
| 62 | Medium: Subagents Multi-Agent Workflow | https://medium.com/@techofhp/claude-code-and-subagents-how-to-build-your-first-multi-agent-workflow-3cdbc5e430fa | Multi-agent |
| 63 | Medium: Git Worktrees with Claude Code | https://medium.com/@dtunai/mastering-git-worktrees-with-claude-code-for-parallel-development-workflow-41dc91e645fe | Worktrees |
| 64 | DataCamp: Claude Agent SDK Tutorial | https://www.datacamp.com/tutorial/how-to-use-claude-agent-sdk | SDK |
| 65 | Nader: Building Agents Guide | https://nader.substack.com/p/the-complete-guide-to-building-agents | SDK |
| 66 | aimultiple: Optimizing Agentic Coding | https://aimultiple.com/agentic-coding | Overview |
| 67 | F22Labs: 10 Productivity Workflows | https://www.f22labs.com/blogs/10-claude-code-productivity-tips-for-every-developer/ | Tips |
| 68 | Geeky Gadgets: 50 Tips & Tricks | https://www.geeky-gadgets.com/claude-code-tips-2/ | Tips |
| 69 | Claude Context Engineering: 6 Pillars | https://claudefa.st/blog/guide/mechanics/context-engineering | Context |
| 70 | Apiyi: Agent Teams Tutorial | https://help.apiyi.com/en/claude-4-6-agent-teams-how-to-use-guide-en.html | Teams |

---

## Research — Academic & Empirical

| # | Title | URL | Topics | Key Finding |
|---|-------|-----|--------|-------------|
| 71 | TDFlow: Agentic TDD (arXiv) | https://arxiv.org/html/2510.23761v1 | TDD | 94.3% success with human tests |
| 72 | Context Engineering Multi-Agent (arXiv) | https://arxiv.org/html/2508.08322v1 | Multi-agent context | Framework for LLM context |
| 73 | Latent Space: AI Agents meet TDD | https://www.latent.space/p/anita-tdd | TDD | TDD as AI superpower |
| 74 | DORA 2025 Report | (referenced) | TDD + AI | 2-3x productivity amplification |
| 75 | Empirical Study of 2,303 CLAUDE.md Files | (referenced) | CLAUDE.md | +10.87% with repo-specific rules |

---

## Phase 2 Deep Dive Sources (Files 16-24)

### Debugging & Error Recovery
| # | Title | URL | Topics | Rating |
|---|-------|-----|--------|--------|
| 76 | eesel.ai: Debug with Claude Code | https://www.eesel.ai/blog/debug-with-claude-code | Debugging | B-Tier |
| 77 | Nathan Onn: Debugging Visibility Methods | https://www.nathanonn.com/claude-code-debugging-visibility-methods/ | Debugging | B-Tier |
| 78 | Augment Code: 8 Failure Patterns | https://www.augmentcode.com/guides/debugging-ai-generated-code-8-failure-patterns-and-fixes | AI code quality | A-Tier |
| 79 | LogRocket: Fixing AI-Generated Code | https://blog.logrocket.com/fixing-ai-generated-code/ | Debugging | B-Tier |
| 80 | ClaudeLog: Plan Mode | https://claudelog.com/mechanics/plan-mode/ | Debugging workflow | B-Tier |
| 81 | Armin Ronacher: Plan Mode | https://lucumr.pocoo.org/2025/12/17/what-is-plan-mode/ | Plan mode | A-Tier |
| 82 | Microsoft: Debug-Gym | https://www.microsoft.com/en-us/research/blog/debug-gym-an-environment-for-ai-coding-tools-to-learn-how-to-debug-code-like-programmers/ | AI debugging | Research |
| 83 | claude-debugs-for-you (GitHub) | https://github.com/jasonjmcghee/claude-debugs-for-you | Interactive debugging | B-Tier |

### Advanced Prompting & Think Tool
| # | Title | URL | Topics | Rating |
|---|-------|-----|--------|--------|
| 84 | Anthropic: Chain of Thought Prompting | https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/chain-of-thought | CoT | S-Tier |
| 85 | Anthropic: Extended Thinking Tips | https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/extended-thinking-tips | Thinking | S-Tier |
| 86 | Anthropic: The Think Tool | https://www.anthropic.com/engineering/claude-think-tool | Think tool | S-Tier |
| 87 | Anthropic: XML Tags | https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/use-xml-tags | Prompting | S-Tier |
| 88 | Anthropic: Building Effective Agents | https://www.anthropic.com/research/building-effective-agents | Agent patterns | S-Tier |
| 89 | Prompting Guide: Chain of Thought | https://www.promptingguide.ai/techniques/cot | CoT | B-Tier |

### CI/CD Integration
| # | Title | URL | Topics | Rating |
|---|-------|-----|--------|--------|
| 90 | claude-code-action (GitHub) | https://github.com/anthropics/claude-code-action | GitHub Actions | S-Tier |
| 91 | Claude Code: Headless Mode | https://code.claude.com/docs/en/headless | CI automation | S-Tier |
| 92 | Agent SDK: Python Reference | https://platform.claude.com/docs/en/agent-sdk/python | SDK | S-Tier |
| 93 | Agent SDK: TypeScript Reference | https://platform.claude.com/docs/en/agent-sdk/typescript | SDK | S-Tier |

### Multi-Agent Coordination
| # | Title | URL | Topics | Rating |
|---|-------|-----|--------|--------|
| 94 | Google: Scaling Agent Systems | https://research.google/blog/towards-a-science-of-scaling-agent-systems-when-and-why-agent-systems-work/ | Scaling | Research |
| 95 | The 17x Error Trap | https://towardsdatascience.com/why-your-multi-agent-system-is-failing-escaping-the-17x-error-trap-of-the-bag-of-agents/ | Error amplification | Research |
| 96 | WeThinkApp: Orchestration Patterns | https://www.wethinkapp.ai/blog/design-patterns-for-multi-agent-orchestration | Patterns | A-Tier |
| 97 | Mike Mason: Coherence Through Orchestration | https://mikemason.ca/writing/ai-coding-agents-jan-2026/ | Orchestration | A-Tier |
| 98 | AWS: Strands Agents | https://aws.amazon.com/blogs/machine-learning/multi-agent-collaboration-patterns-with-strands-agents-and-amazon-nova/ | Frameworks | A-Tier |
| 99 | Atoms.dev: Task Decomposition | https://atoms.dev/insights/task-decomposition-for-coding-agents-architectures-advancements-and-future-directions/a95f933f2c6541fc9e1fb352b429da15 | Decomposition | Research |
| 100 | arXiv: ChatDev | https://arxiv.org/html/2307.07924v5 | Multi-agent dev | Research |
| 101 | arXiv: SwarmSys | https://arxiv.org/html/2510.10047 | Swarm intelligence | Research |
| 102 | DataCamp: Framework Comparison | https://www.datacamp.com/tutorial/crewai-vs-langgraph-vs-autogen | Frameworks | B-Tier |
| 103 | Paddo.dev: Claude Code Hidden Swarm | https://paddo.dev/blog/claude-code-hidden-swarm/ | Internal architecture | B-Tier |
| 104 | PubNub: Sub-Agents Best Practices | https://www.pubnub.com/blog/best-practices-for-claude-code-sub-agents/ | Subagents | B-Tier |

### Code Quality Data
| # | Title | URL | Topics | Rating |
|---|-------|-----|--------|--------|
| 105 | CodeRabbit: AI vs Human Code (Dec 2025) | https://www.coderabbit.ai/blog/state-of-ai-vs-human-code-generation-report | Quality metrics | Research |
| 106 | GitClear: AI Code Quality 2025 | https://www.gitclear.com/ai_assistant_code_quality_2025_research | Code churn/clones | Research |
| 107 | CMU/Cursor Study (Dec 2025) | https://blog.robbowley.net/2025/12/04/ai-is-still-making-code-worse-a-new-cmu-study-confirms/ | Quality degradation | Research |
| 108 | arXiv: Human vs AI Code (500K samples) | https://arxiv.org/abs/2508.21634 | Structural analysis | Research |
| 109 | Science: Who is Using AI to Code? | https://www.science.org/doi/10.1126/science.adz9311 | 30M commits study | Research |
| 110 | Qodo: State of AI Code Quality 2025 | https://www.qodo.ai/reports/state-of-ai-code-quality/ | Quality survey | A-Tier |
| 111 | Allstacks: Comprehension Debt | https://www.allstacks.com/blog/comprehension-debt-the-hidden-cost-of-ai-generated-code | Comprehension debt | A-Tier |
| 112 | Margaret-Anne Storey: Cognitive Debt | https://margaretstorey.com/blog/2026/02/09/cognitive-debt/ | Cognitive debt | Research |

### Production Case Studies & ROI
| # | Title | URL | Topics | Rating |
|---|-------|-----|--------|--------|
| 113 | TELUS Claude Case Study | https://claude.com/customers/telus | Enterprise | S-Tier |
| 114 | Zapier Claude Case Study | https://claude.com/customers/zapier | Enterprise | S-Tier |
| 115 | Cognition: Devin Annual Review | https://cognition.ai/blog/devin-annual-performance-review-2025 | AI engineer | A-Tier |
| 116 | CNBC: Goldman Sachs + Devin | https://www.cnbc.com/2025/07/11/goldman-sachs-autonomous-coder-pilot-marks-major-ai-milestone.html | Enterprise | A-Tier |
| 117 | METR: AI Makes Devs 19% Slower | https://metr.org/blog/2025-07-10-early-2025-ai-experienced-os-dev-study/ | Productivity RCT | Research |
| 118 | Fortune: Replit Database Disaster | https://fortune.com/2025/07/23/ai-coding-tool-replit-wiped-database-called-it-a-catastrophic-failure/ | Safety failure | A-Tier |
| 119 | Faros AI: Productivity Paradox | https://www.faros.ai/blog/ai-software-engineering | Metrics | A-Tier |
| 120 | Jellyfish: 2025 AI Metrics | https://jellyfish.co/blog/2025-ai-metrics-in-review/ | Platform data | A-Tier |
| 121 | Bain: From Pilots to Payoff | https://www.bain.com/insights/from-pilots-to-payoff-generative-ai-in-software-development-technology-report-2025/ | Enterprise ROI | A-Tier |
| 122 | McKinsey: State of AI | https://www.mckinsey.com/capabilities/quantumblack/our-insights/the-state-of-ai | Industry survey | A-Tier |
| 123 | SaaStr: Anthropic $14B ARR | https://www.saastr.com/anthropic-just-hit-14-billion-in-arr-up-from-1-billion-just-14-months-ago/ | Market data | A-Tier |

### Memory Systems
| # | Title | URL | Topics | Rating |
|---|-------|-----|--------|--------|
| 124 | ProductTalk: Give Claude a Memory | https://www.producttalk.org/give-claude-code-a-memory/ | Memory layers | B-Tier |
| 125 | Cuong Tham: Memory Management | https://cuong.io/blog/2025/06/15-claude-code-best-practices-memory-management | Memory tips | B-Tier |
| 126 | ClaudeFast: Session Memory | https://claudefa.st/blog/guide/mechanics/session-memory | Session memory | B-Tier |
| 127 | Yuanchang: Auto Memory & Hooks | https://yuanchang.org/en/posts/claude-code-auto-memory-and-hooks/ | Auto memory | B-Tier |
| 128 | arXiv: Memory in the Age of AI Agents | https://arxiv.org/abs/2512.13564 | Memory taxonomy | Research |
| 129 | IBM: AI Agent Memory | https://www.ibm.com/think/topics/ai-agent-memory | Memory types | A-Tier |

### AI-Friendly Architecture
| # | Title | URL | Topics | Rating |
|---|-------|-----|--------|--------|
| 130 | Gustafson: Optimizing for AI Agents | https://www.aaron-gustafson.com/notebook/optimizing-your-codebase-for-ai-coding-agents/ | Architecture | A-Tier |
| 131 | Vercel: AGENTS.md Outperforms Skills | https://vercel.com/blog/agents-md-outperforms-skills-in-our-agent-evals | Context eval | A-Tier |
| 132 | Ben Houston: Agentic Coding Best Practices | https://benhouston3d.com/blog/agentic-coding-best-practices | Type safety | A-Tier |
| 133 | Cloudurable: Architecture Comparison | https://cloudurable.com/blog/a-deeper-dive-when-the-vibe-dies-comparing-codebase-architectures-for-ai-tools/ | VSA ranking | A-Tier |
| 134 | CodeMySpec: Architecture Design | https://codemyspec.com/pages/managing-architecture | Context mapping | B-Tier |
| 135 | monorepo.tools/ai | https://monorepo.tools/ai | Monorepo + AI | B-Tier |
| 136 | Nx: AI Agent Skills | https://nx.dev/blog/nx-ai-agent-skills | Monorepo tools | A-Tier |
| 137 | a16z: Nine Developer Patterns | https://a16z.com/nine-emerging-developer-patterns-for-the-ai-era/ | Emerging patterns | A-Tier |
| 138 | vFunction: Architecture for AI | https://vfunction.com/blog/vibe-coding-architecture-ai-agents/ | Architecture gaps | A-Tier |
| 139 | Manus: Context Engineering Lessons | https://manus.im/blog/Context-Engineering-for-AI-Agents-Lessons-from-Building-Manus | Context engineering | A-Tier |

---

## Additional Resources

### Registries & Marketplaces
| Resource | URL |
|----------|-----|
| Claude Plugins Dev | https://claude-plugins.dev/ |
| Claude Code Marketplace | https://claudecodemarketplace.com/ |
| ClaudeLog (Docs/Guides) | https://claudelog.com/ |
| AwesomeClaude Cheatsheet | https://awesomeclaude.ai/code-cheatsheet |
| Developer Toolkit | https://developertoolkit.ai/en/claude-code/ |

### Learning Resources
| Resource | URL |
|----------|-----|
| Udemy: Claude Code Beginner to Pro | https://www.udemy.com/course/learn-claude-code/ |
| Agent Factory (Panaversity) | https://agentfactory.panaversity.org/docs/ |
| Steve Kinney: AI Development Tools | https://stevekinney.com/courses/ai-development/ |
| Hacker News Discussion | https://news.ycombinator.com/item?id=43735550 |

### GitHub Repositories
| Repo | Stars* | Description |
|------|--------|-------------|
| anthropics/claude-code | 50K+ | Official Claude Code |
| anthropics/claude-agent-sdk-typescript | 5K+ | Official SDK |
| anthropics/skills | 1K+ | Official skill examples |
| nwiizo/ccswarm | - | Multi-agent with worktrees |
| spillwavesolutions/parallel-worktrees | - | Parallel worktree skill |
| shanraisshan/claude-code-best-practice | - | Best practice collection |
| awattar/claude-code-best-practices | - | Best practices + examples |

*Approximate as of Feb 2026

---

## Phase 3 Sources (Files 25-32)

### Tool Comparison (File 25)
| # | Title | URL | Rating |
|---|-------|-----|--------|
| 140 | Cursor Statistics | https://devgraphiq.com/cursor-statistics/ | A-Tier |
| 141 | GitHub Copilot Plans | https://github.com/features/copilot/plans | S-Tier |
| 142 | Cline 5M Installs | https://cline.ghost.io/5m-installs-1m-open-source-grant-program/ | A-Tier |
| 143 | Aider GitHub | https://github.com/Aider-AI/aider | B-Tier |
| 144 | Augment Code Intent | https://www.augmentcode.com/blog/intent-a-workspace-for-agent-orchestration | A-Tier |
| 145 | Amazon Q Developer | https://aws.amazon.com/q/developer/features/ | A-Tier |
| 146 | Devin Annual Review | https://cognition.ai/blog/devin-annual-performance-review-2025 | A-Tier |
| 147 | Windsurf by OpenAI | https://venturebeat.com/ai/openai-acquires-windsurf/ | A-Tier |
| 148 | Tembo CLI Comparison | https://www.tembo.io/blog/coding-cli-tools-comparison | B-Tier |
| 149 | Superblocks Cursor Alternatives | https://www.superblocks.com/blog/cursor-competitors | B-Tier |

### Error Recovery (File 26)
| # | Title | URL | Rating |
|---|-------|-----|--------|
| 150 | Snorkel AI: Coding Agent Recovery | https://snorkel.ai/blog/coding-agents-dont-need-to-be-perfect-they-need-to-recover/ | A-Tier |
| 151 | Microsoft: Failure Mode Taxonomy | https://www.microsoft.com/en-us/security/blog/2025/04/24/new-whitepaper-outlines-the-taxonomy-of-failure-modes-in-ai-agents/ | A-Tier |
| 152 | Roo Code: Context Poisoning | https://docs.roocode.com/advanced-usage/context-poisoning | B-Tier |
| 153 | AuxilioBits: Redundancy Patterns | https://www.auxiliobits.com/blog/architecting-for-agent-failure-and-recovery-redundancy-patterns/ | B-Tier |
| 154 | deepsense.ai: Self-Correcting Code | https://deepsense.ai/resource/self-correcting-code-generation-using-multi-step-agent/ | Research |
| 155 | Nature: Semantic Entropy | https://www.nature.com/articles/s41586-024-07421-0 | Research |
| 156 | AWS: Resilient Agents | https://aws.amazon.com/blogs/architecture/build-resilient-generative-ai-agents/ | A-Tier |

### CLAUDE.md Examples (File 27)
| # | Title | URL | Rating |
|---|-------|-----|--------|
| 157 | arXiv: 328 CLAUDE.md Files Study | https://arxiv.org/html/2511.09268 | Research |
| 158 | arXiv: 253 CLAUDE.md Files Study | https://arxiv.org/abs/2509.14744 | Research |
| 159 | arXiv: 2,303 CLAUDE.md Files Study | https://arxiv.org/abs/2511.12884 | Research |
| 160 | serpro69 Starter Kit | https://github.com/serpro69/claude-starter-kit | B-Tier |
| 161 | ChrisWiles Showcase | https://github.com/ChrisWiles/claude-code-showcase | B-Tier |
| 162 | Brandon Casci: Consistency | https://www.brandoncasci.com/2025/07/30/from-chaos-to-control-teaching-claude-code-consistency.html | B-Tier |
| 163 | ClaudeFast Rules Guide | https://claudefa.st/blog/guide/mechanics/rules-directory | B-Tier |
| 164 | NikiforovAll Plugins | https://github.com/NikiforovAll/claude-code-rules | B-Tier |
| 165 | Martin Fowler: SDD Tools | https://martinfowler.com/articles/exploring-gen-ai/sdd-3-tools.html | A-Tier |

### Vibe Coding Spectrum (File 28)
| # | Title | URL | Rating |
|---|-------|-----|--------|
| 166 | arXiv: Vibe vs Agentic Taxonomy | https://arxiv.org/abs/2505.19443 | Research |
| 167 | Red Hat: Uncomfortable Truth | https://developers.redhat.com/articles/2026/02/17/uncomfortable-truth-about-vibe-coding | A-Tier |
| 168 | The New Stack: Honeymoon Over | https://thenewstack.io/vibe-coding-six-months-later-the-honeymoons-over/ | A-Tier |
| 169 | Futurism: Inventor Doesn't Use It | https://futurism.com/artificial-intelligence/inventor-vibe-coding-doesnt-work | A-Tier |
| 170 | arXiv: Vibe Coding in Practice | https://arxiv.org/abs/2512.11922 | Research |
| 171 | Thoughtworks: SDD | https://www.thoughtworks.com/en-us/insights/blog/agile-engineering-practices/spec-driven-development-unpacking-2025-new-engineering-practices | A-Tier |
| 172 | GitLab: Vibe to Agentic Roadmap | https://about.gitlab.com/the-source/ai/from-vibe-coding-to-agentic-ai-a-roadmap-for-technical-leaders/ | A-Tier |
| 173 | Simon Willison: Vibe Engineering | https://simonwillison.net/2025/Oct/7/vibe-engineering/ | A-Tier |
| 174 | Georgetown CSET: AI Security | (referenced in article) | Research |

### Testing Strategies (File 29)
| # | Title | URL | Rating |
|---|-------|-----|--------|
| 175 | Anthropic PBT Agent (red team) | https://red.anthropic.com/2026/property-based-testing/ | S-Tier |
| 176 | TDFlow: Agentic TDD | https://arxiv.org/html/2510.23761v1 | Research |
| 177 | TiCoder: Test-Driven Interactive | https://arxiv.org/html/2404.10100v1 | Research |
| 178 | Meta: ACH Mutation Testing | https://engineering.fb.com/2025/09/30/security/llms-are-the-key-to-mutation-testing-and-better-compliance/ | A-Tier |
| 179 | Meta: LLM Bug Catchers | https://engineering.fb.com/2025/02/05/security/revolutionizing-software-testing-llm-powered-bug-catchers-meta-ach/ | A-Tier |
| 180 | Microsoft: AI Code Review at Scale | https://devblogs.microsoft.com/engineering-at-microsoft/enhancing-code-quality-at-scale-with-ai-powered-code-reviews/ | A-Tier |
| 181 | Superpowers Framework | https://github.com/obra/superpowers | B-Tier |
| 182 | TDD Guard | https://github.com/nizos/tdd-guard | B-Tier |
| 183 | Fireworks AI: Eval-Driven Dev | https://fireworks.ai/blog/eval-driven-development-with-claude-code | A-Tier |
| 184 | Thoughtbot: Prevent Robocalypse | https://thoughtbot.com/blog/prevent-the-robocalypse-with-tdd | A-Tier |
| 185 | OpenObserve: Council of Sub Agents | https://openobserve.ai/blog/autonomous-qa-testing-ai-agents-claude-code/ | A-Tier |
| 186 | Kleppmann: Vericoding | https://martin.kleppmann.com/2025/12/08/ai-formal-verification.html | A-Tier |
| 187 | The Register: Agile + AI + TDD | https://www.theregister.com/2026/02/20/from_agile_to_ai_anniversary/ | A-Tier |
| 188 | Qodo: AI Code Quality 2025 | https://www.qodo.ai/reports/state-of-ai-code-quality/ | A-Tier |
| 189 | PGS: Property-Based Testing | https://arxiv.org/abs/2506.18315 | Research |
| 190 | Vericoding: Formal Verification | https://arxiv.org/abs/2507.13290 | Research |
| 191 | SWE-Bench Pro | https://arxiv.org/pdf/2509.16941 | Research |
| 192 | Agentic Coding Handbook: TDD | https://tweag.github.io/agentic-coding-handbook/WORKFLOW_TDD/ | B-Tier |
| 193 | Shipyard: E2E Testing | https://shipyard.build/blog/e2e-testing-claude-code/ | A-Tier |
| 194 | CodeScene: Defect Risk +30% | https://www.prnewswire.com/news-releases/ai-coding-assistants-increase-defect-risk-by-30-in-unhealthy-code-new-peer-reviewed-research-finds-302672355.html | Research |

### Cost Optimization (File 30)
| # | Title | URL | Rating |
|---|-------|-----|--------|
| 195 | Anthropic: Manage Costs | https://code.claude.com/docs/en/costs | S-Tier |
| 196 | Anthropic: Official Pricing | https://platform.claude.com/docs/en/about-claude/pricing | S-Tier |
| 197 | Anthropic: Prompt Caching | https://www.anthropic.com/news/prompt-caching | S-Tier |
| 198 | Anthropic: Batch API | https://claude.com/blog/message-batches-api | S-Tier |
| 199 | Anthropic: Extended Thinking | https://platform.claude.com/docs/en/build-with-claude/extended-thinking | S-Tier |
| 200 | Anthropic: Analytics API | https://platform.claude.com/docs/en/build-with-claude/claude-code-analytics-api | S-Tier |
| 201 | Faros AI: Claude Code ROI | https://www.faros.ai/blog/how-to-measure-claude-code-roi-developer-productivity-insights-with-faros-ai | A-Tier |
| 202 | AICosts: Subagent Cost Explosion | https://www.aicosts.ai/blog/claude-code-subagent-cost-explosion-887k-tokens-minute-crisis | A-Tier |
| 203 | Paper Compute: True Cost | https://papercompute.com/blog/true-cost-of-claude-code/ | A-Tier |
| 204 | Datadog: Monitor Claude Costs | https://www.datadoghq.com/blog/anthropic-usage-and-costs/ | A-Tier |
| 205 | ClaudeFast: Sub-Agent Costs | https://claudefa.st/blog/guide/agents/sub-agent-best-practices | B-Tier |
| 206 | UserJot: $200 Plan Worth It? | https://userjot.com/blog/claude-code-pricing-200-dollar-plan-worth-it | B-Tier |
| 207 | Tribe AI: ROI Quickstart | https://www.tribe.ai/applied-ai/a-quickstart-for-measuring-the-return-on-your-claude-code-investment | B-Tier |
| 208 | Medium: $720 to $72 Caching | https://medium.com/@labeveryday/prompt-caching-is-a-must-how-i-went-from-spending-720-to-72-monthly-on-api-costs-3086f3635d63 | B-Tier |
| 209 | CLAUDE.md Token Optimization | https://gist.github.com/johnlindquist/849b813e76039a908d962b2f0923dc9a | B-Tier |

### Developer Workflows (File 31)
| # | Title | URL | Rating |
|---|-------|-----|--------|
| 210 | Anthropic: Common Workflows | https://code.claude.com/docs/en/common-workflows | S-Tier |
| 211 | sshh.io: Every Claude Code Feature | https://blog.sshh.io/p/how-i-use-every-claude-code-feature | B-Tier |
| 212 | Addy Osmani: Agent Teams | https://addyosmani.com/blog/claude-code-agent-teams/ | A-Tier |
| 213 | Agentic Coding Handbook | https://tweag.github.io/agentic-coding-handbook/ | B-Tier |
| 214 | Martin Fowler: TDD Fragments | https://martinfowler.com/fragments/2026-01-08.html | A-Tier |

### MCP Deep Dive (File 32)
| # | Title | URL | Rating |
|---|-------|-----|--------|
| 215 | MCP Architecture | https://modelcontextprotocol.io/docs/learn/architecture | S-Tier |
| 216 | MCP Security Spec | https://modelcontextprotocol.io/specification/draft/basic/security_best_practices | S-Tier |
| 217 | Tool Search API | https://platform.claude.com/docs/en/agents-and-tools/tool-use/tool-search-tool | S-Tier |
| 218 | Claude Agent SDK | https://platform.claude.com/docs/en/agent-sdk/overview | S-Tier |
| 219 | MCP Roadmap | https://modelcontextprotocol.io/development/roadmap | S-Tier |
| 220 | MCP Apps Blog | http://blog.modelcontextprotocol.io/posts/2026-01-26-mcp-apps/ | S-Tier |
| 221 | Advanced Tool Use | https://www.anthropic.com/engineering/advanced-tool-use | S-Tier |
| 222 | AAIF Announcement | https://www.anthropic.com/news/donating-the-model-context-protocol-and-establishing-of-the-agentic-ai-foundation | S-Tier |
| 223 | Cloudflare MCP + Durable Objects | https://blog.cloudflare.com/building-ai-agents-with-mcp-authn-authz-and-durable-objects/ | A-Tier |
| 224 | Astrix Security Report | https://astrix.security/learn/blog/state-of-mcp-server-security-2025/ | A-Tier |
| 225 | Linux Foundation AAIF | https://www.linuxfoundation.org/press/linux-foundation-announces-the-formation-of-the-agentic-ai-foundation | A-Tier |
| 226 | Pento: Year of MCP | https://www.pento.ai/blog/a-year-of-mcp-2025-review | A-Tier |
| 227 | FastMCP GitHub | https://github.com/jlowin/fastmcp | B-Tier |
| 228 | awesome-mcp-servers | https://github.com/punkpeye/awesome-mcp-servers | B-Tier |
| 229 | MCP Inspector | https://github.com/modelcontextprotocol/inspector | S-Tier |
| 230 | Smithery AI | https://workos.com/blog/smithery-ai | A-Tier |
