# 32 — MCP (Model Context Protocol) Deep Dive — Servers, SDK & Ecosystem

> Sources: [MCP Architecture](https://modelcontextprotocol.io/docs/learn/architecture), [MCP Security Spec](https://modelcontextprotocol.io/specification/draft/basic/security_best_practices), [Tool Search API](https://platform.claude.com/docs/en/agents-and-tools/tool-use/tool-search-tool), [Claude Agent SDK](https://platform.claude.com/docs/en/agent-sdk/overview), [MCP Roadmap](https://modelcontextprotocol.io/development/roadmap), [Cloudflare MCP](https://blog.cloudflare.com/building-ai-agents-with-mcp-authn-authz-and-durable-objects/), [Astrix Security Report](https://astrix.security/learn/blog/state-of-mcp-server-security-2025/), [FastMCP](https://github.com/jlowin/fastmcp), [MCP Apps](http://blog.modelcontextprotocol.io/posts/2026-01-26-mcp-apps/), [Pento Year Review](https://www.pento.ai/blog/a-year-of-mcp-2025-review), [AAIF Announcement](https://www.anthropic.com/news/donating-the-model-context-protocol-and-establishing-of-the-agentic-ai-foundation), [Advanced Tool Use](https://www.anthropic.com/engineering/advanced-tool-use)

## MCP Architecture

**Model Context Protocol (MCP)** is an open standard (JSON-RPC 2.0 based) that provides a universal interface between AI agents and external tools/data sources.

### Core Components

| Component | Role |
|-----------|------|
| **Host** | Application managing connections (Claude Code, Cursor, VS Code) |
| **Client** | Maintains 1:1 connection per server, handles capability negotiation |
| **Server** | Exposes tools, resources, and prompts via standardized interface |

### Protocol Primitives

| Primitive | Direction | Purpose |
|-----------|-----------|---------|
| **Tools** | Server → Client | Executable functions (API calls, queries, computations) |
| **Resources** | Server → Client | Read-only data (files, database records, API responses) |
| **Prompts** | Server → Client | Templated interaction patterns |
| **Elicitation** | Server → Client | Request user input mid-operation (June 2025 spec) |
| **Sampling** | Client → Server | Server requests LLM completions from client |

### Transport Layers

- **stdio** — Local processes, fastest, most common for development
- **Streamable HTTP** — Remote servers, replaced SSE in November 2025 spec
- **WebSocket** — Bidirectional real-time communication (via Cloudflare Durable Objects)

## Popular MCP Servers

| Server | Category | Key Capability |
|--------|----------|---------------|
| **Context7** | Documentation | Live, version-specific library docs |
| **GitHub** | Development | Repository management, PR operations |
| **Filesystem** | System | Secure file operations with access controls |
| **PostgreSQL/SQLite** | Database | Structured database operations with SQL execution |
| **Sentry** | Observability | Error tracking and monitoring integration |
| **Slack** | Communication | Message management and channel operations |
| **Figma** | Design | Design file access and component inspection |

**Ecosystem scale**: 5,800+ registered MCP servers, 97M+ monthly SDK downloads (Feb 2026).

## Building Custom MCP Servers

### TypeScript SDK

```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

const server = new McpServer({ name: "my-server", version: "1.0.0" });

server.tool("greet", { name: z.string() }, async ({ name }) => ({
  content: [{ type: "text", text: `Hello, ${name}!` }]
}));

const transport = new StdioServerTransport();
await server.connect(transport);
```

### Python SDK (FastMCP)

FastMCP powers **70% of MCP servers across all languages** with over 1M daily downloads:

```python
from fastmcp import FastMCP
mcp = FastMCP("my-server")

@mcp.tool()
def greet(name: str) -> str:
    return f"Hello, {name}!"
```

### SDK Comparison

| Feature | TypeScript SDK | Python (FastMCP) |
|---------|---------------|-----------------|
| Type Safety | Native TS + Zod | Type hints + Pydantic |
| Transport | stdio + Streamable HTTP | stdio + Streamable HTTP |
| Ideal For | Node.js backends, VS Code extensions | Data science, ML pipelines, rapid prototyping |

## MCP Security

### Threat Landscape (5,200 servers analyzed)

- **88%** of servers require credentials
- **53%** rely on insecure, long-lived static secrets
- Only **8.5%** use modern OAuth authentication
- Prevalence of "confused deputy" vulnerabilities

### Required Best Practices

1. **OAuth 2.1 with PKCE** as default authentication
2. **Least-privilege access** with granular permissions
3. **TLS everywhere** for all HTTP transport
4. **Rate limiting** — AI agents trigger tools much faster than humans
5. **Per-request authorization** verification
6. **Input validation** — never trust agent-generated inputs
7. **Resource Indicators** — prevent malicious token scope escalation (June 2025 spec)

## Tool Search (95% Context Reduction)

### The Problem

Every MCP tool definition is preloaded into the context window. With 50+ tools, this consumes **~77K tokens** before any work begins.

### The Solution

Mark tools with `defer_loading: true` for on-demand discovery:

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Initial context (50 tools) | ~77K tokens | ~8.7K tokens | **~95% reduction** |
| Agent token usage | ~134K tokens | ~5K tokens | **96% reduction** |
| Opus 4 accuracy | 49% | 74% | **+25pp** |
| Opus 4.5 accuracy | 79.5% | 88.1% | **+8.6pp** |

### Search Variants

| Variant | Query Format |
|---------|-------------|
| **Regex** | Python `re.search()` patterns (max 200 chars) |
| **BM25** | Natural language queries |

**Auto-activation in Claude Code**: MCP Tool Search activates automatically when tool descriptions would consume >10% of the context window.

## Claude Agent SDK

The Agent SDK lets you build production AI agents with the same tools and agent loop as Claude Code.

### Core API

```typescript
import { query } from "@anthropic-ai/claude-agent-sdk";

for await (const message of query({
  prompt: "Find and fix the bug in auth.py",
  options: { allowedTools: ["Read", "Edit", "Bash"] }
})) {
  console.log(message);
}
```

### Key Capabilities

1. **Hooks**: Run custom code at lifecycle points (PreToolUse, PostToolUse, Stop, SessionStart, SessionEnd)
2. **Subagents**: Spawn specialized agents via the Task tool
3. **MCP Integration**: Connect to external MCP servers
4. **Sessions**: Maintain context across exchanges; resume or fork sessions
5. **Permissions**: Fine-grained control (bypassPermissions, acceptEdits, tool allowlists)
6. **30+ hour sustained operation** through server-side conversation compaction

### Multi-Agent Pattern

```typescript
const options = {
  allowedTools: ["Read", "Glob", "Grep", "Task"],
  agents: {
    "code-reviewer": {
      description: "Expert code reviewer",
      prompt: "Analyze code quality and suggest improvements.",
      tools: ["Read", "Glob", "Grep"]
    }
  }
};
```

## MCP Apps (January 2026)

MCP Apps enable servers to supply **interactive UIs** rendered inside Claude's chat window.

Initial partners: **Amplitude, Asana, Box, Canva, Clay, Figma, Hex, monday.com, Slack**.

No formal app store yet — the ecosystem is open but unstructured. Developers build on the protocol rather than applying to a platform.

## Cross-Tool MCP Adoption

| Tool | MCP Support | Notable Features |
|------|-------------|-----------------|
| **Claude Code** | Native (full host) | Tool Search, Agent SDK, Auto-discovery |
| **Cursor** | Native | Preconfigured MCP handlers |
| **Cline** | Native + Marketplace | MCP Marketplace with curated categories |
| **VS Code + Copilot** | Native | Max 128 tools per request |
| **Windsurf** | Native | MCP connections supported |
| **Microsoft Copilot Studio** | Native | Agent extension via MCP |

**Timeline**: OpenAI (March 2025), Google DeepMind (April 2025), Microsoft (2025), AAIF donation (December 2025).

## Remote MCP Servers & Authentication

### OAuth 2.1 as the Standard

- **PKCE** mandatory since 2025-11-25 spec
- **Protected Resource Metadata (PRM)**: Well-known JSON describing scopes and trusted auth servers
- **Client ID Metadata Documents (CIMD)**: Replacing Dynamic Client Registration as default

### Cloudflare Workers Implementation

- Workers for HTTP request handling
- Durable Objects as stateful session coordinators with SQLite (10GB per object)
- WebSocket Hibernation: Objects sleep during inactivity, wake instantly (pay only for active compute)
- Pre-built auth: Stytch, Auth0, WorkOS integrations

## Agentic AI Foundation (AAIF)

MCP donated to the Linux Foundation in December 2025:

- **Co-founders**: Anthropic, Block, OpenAI
- **Platinum members**: Amazon, Anthropic, Block, Bloomberg, Cloudflare, Google, Microsoft, OpenAI
- **Founding projects**: MCP (Anthropic), goose (Block), AGENTS.md (OpenAI)
- **Governance**: AAIF Governing Board for strategy; projects retain full technical autonomy

## Future Roadmap (Targeting June 2026)

1. **Asynchronous Operations** — Full async for long-running tasks
2. **Statelessness & Scalability** — Horizontal scaling for enterprise
3. **Server Identity** — `.well-known` URLs for pre-connection capability discovery
4. **Official Extensions** — Curated protocol extensions for healthcare, finance, education
5. **MCP Registry GA** — Transitioning from preview to production
6. **Multi-Language SDKs** — Java, Go reference implementations
7. **Human-in-the-Loop** — Standardized mid-task user confirmation mechanisms

## Key Takeaway

> MCP has evolved from a single-vendor protocol to an industry standard backed by the Agentic AI Foundation. With 97M+ monthly SDK downloads, 5,800+ servers, and universal adoption across Claude, Copilot, Cursor, and Gemini, it is now the universal interface layer for AI agent integrations. The critical developments for 2026 are Tool Search (95% context reduction), the Agent SDK, and OAuth 2.1 for remote security.
