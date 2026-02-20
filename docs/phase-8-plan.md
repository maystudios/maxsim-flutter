# Phase 8: Agentic Coding Output Overhaul

## Vision

Transform maxsim-flutter's generated Claude Code setup from a basic 5-agent monolithic
configuration into a best-in-class agentic coding infrastructure based on 2025-2026
research findings. The generated Flutter projects will have:

- **Slim, modular CLAUDE.md** (~80 lines) with path-specific `.claude/rules/` imports
- **3 focused agents** (builder, tester, reviewer) instead of 5 generic ones
- **Intelligent model routing** — right model per role (haiku/sonnet/opus) + sub-agent guidance
- **Quality-enforcing hooks** (format on edit, block dangerous commands, test on complete)
- **7 domain-specific skills** (4 improved + 3 new) with model hints
- **Machine-readable PRD format** with verifiable acceptance criteria and dependencies
- **Preset-based config** (minimal/standard/full) replacing granular boolean flags

## Research Basis

Key findings from 20+ sources (empirical studies, Anthropic docs, DORA 2025 report):

| Finding | Source | Impact |
|---------|--------|--------|
| CLAUDE.md should be <150 lines with modular imports | Anthropic Best Practices | Reduces agent context pollution |
| 3 focused agents outperform 7 generic ones | Single vs Multi-Agent research | Less coordination overhead |
| Hooks guarantee behavior (unlike LLM instructions) | Claude Code Hooks Guide | Deterministic quality enforcement |
| Machine-readable acceptance criteria reduce clarification 50-70% | Agentic PRD research | Faster story completion |
| Path-specific rules with YAML frontmatter | Claude Code Rules docs | Context-aware agent guidance |
| Security section missing from 85.5% of CLAUDE.md files | Empirical study (2303 repos) | Critical gap to fill |
| TDD + AI = 2-3x productivity gain | DORA 2025 report | Our TDD setup is key differentiator |
| Progressive phase disclosure prevents scope bleed | BMAD Method | Agents focus on current phase only |
| Haiku = 90% of Sonnet quality at 1/3 cost for read-only tasks | Anthropic benchmarks | Reviewer agent should use haiku |
| Right model per role saves 40-60% on API costs | Claude Code model docs | Intelligent routing = cost optimization |

## Decisions Made

1. **CLAUDE.md**: Modular with `.claude/rules/` — slim index file with `@` imports
2. **Agents**: 3 focused (flutter-builder, flutter-tester, flutter-reviewer)
3. **Hooks**: Quality-focused (PostToolUse format, PreToolUse block, TaskCompleted test)
4. **PRD**: Complete overhaul with verifiable predicates, dependencies, story points
5. **Skills**: 7 total (4 improved + security-review, performance-check, add-feature)
6. **Config**: Presets (minimal/standard/full) replacing granular booleans
7. **Phase**: Continue as Phase 8 in existing prd.json

---

## Stories

### Sub-phase 8A: Config & Foundation

#### P8-001: Add claude.preset to config schema

**Priority**: P0 | **Points**: 3

Replace the granular `claude.generateAgents`, `claude.generateSkills`, `claude.generateHooks`,
`claude.agentTeams` boolean flags with a single `claude.preset` field.

**Files to change**:
- `src/core/config/schema.ts` — Add `preset` field, deprecate old booleans
- `src/core/context.ts` — Update `ProjectContext` type if needed

**New schema**:
```typescript
claude: z.object({
  enabled: z.boolean().default(true),
  preset: z.enum(['minimal', 'standard', 'full']).default('standard'),
  overrides: z.object({
    agents: z.boolean().optional(),
    skills: z.boolean().optional(),
    hooks: z.boolean().optional(),
    rules: z.boolean().optional(),
    commands: z.boolean().optional(),
    mcp: z.boolean().optional(),
  }).optional(),
  mcpServers: z.array(z.string()).default([]),
}).default({})
```

**Preset definitions**:
- `minimal`: CLAUDE.md + rules only
- `standard`: CLAUDE.md + rules + 3 agents + hooks + skills + commands
- `full`: CLAUDE.md + rules + 3 agents + all hooks + all skills + commands + MCP

**Acceptance Criteria**:
- [ ] `MaxsimConfigSchema` accepts `claude.preset: 'minimal' | 'standard' | 'full'`
- [ ] Old boolean flags (`generateAgents`, etc.) still work for backward compatibility
- [ ] `claude.overrides` can override individual preset components
- [ ] Zod validation rejects invalid preset values
- [ ] `npm run typecheck` passes
- [ ] >= 4 tests (schema validation happy path, each preset, override, backward compat)

---

#### P8-002: Implement preset resolver

**Priority**: P0 | **Points**: 3

Create a function that resolves `claude.preset` + `claude.overrides` into concrete
boolean flags for each component.

**Files to create/change**:
- `src/claude-setup/preset-resolver.ts` (NEW)
- `src/claude-setup/setup-orchestrator.ts` — Use resolved presets

**Function signature**:
```typescript
interface ResolvedClaudeOptions {
  claudeMd: boolean;
  rules: boolean;
  agents: boolean;
  hooks: boolean;
  skills: boolean;
  commands: boolean;
  mcp: boolean;
}

export function resolvePreset(
  preset: 'minimal' | 'standard' | 'full',
  overrides?: Partial<ResolvedClaudeOptions>,
): ResolvedClaudeOptions;
```

**Acceptance Criteria**:
- [ ] `resolvePreset('minimal')` returns only claudeMd + rules enabled
- [ ] `resolvePreset('standard')` returns all except MCP
- [ ] `resolvePreset('full')` returns all enabled
- [ ] Overrides correctly override preset defaults
- [ ] >= 6 tests (3 presets + 3 override scenarios)

---

#### P8-003: Update interactive create wizard for preset selection

**Priority**: P1 | **Points**: 2

Add preset selection to the interactive `create` command prompts.

**Files to change**:
- `src/cli/prompts.ts` — Add preset prompt
- `src/cli/create-command.ts` — Wire preset into context

**Acceptance Criteria**:
- [ ] Interactive mode shows preset selection: minimal / standard (default) / full
- [ ] Non-interactive `--yes` defaults to `standard`
- [ ] `--config` file with `claude.preset` is respected
- [ ] >= 2 tests

---

### Sub-phase 8B: CLAUDE.md & Rules

#### P8-004: Overhaul CLAUDE.md generator (slim ~80 lines)

**Priority**: P0 | **Points**: 5

Completely rewrite `claude-md-generator.ts` to produce a slim CLAUDE.md (~80 lines)
that acts as an index file with `@` imports to `.claude/rules/` files.

**Files to change**:
- `src/claude-setup/claude-md-generator.ts` — Complete rewrite

**Generated CLAUDE.md structure**:
```markdown
# CLAUDE.md - {projectName}

{description}

**Active modules:** auth, api, theme
**Platforms:** android, ios

## Build Commands

flutter pub get
flutter test
flutter analyze
dart run build_runner build --delete-conflicting-outputs

## Quality Gates

Before committing, ALL must pass:
- `flutter analyze` — zero errors
- `flutter test` — all tests pass
- `dart format --set-exit-if-changed .` — code formatted

## Rules

@.claude/rules/architecture.md
@.claude/rules/riverpod.md
@.claude/rules/go-router.md
@.claude/rules/testing.md
@.claude/rules/security.md
{conditional module rules}

## Development Workflow

- Commit: `feat: [StoryID] - description`
- File naming: `snake_case.dart`
- Implementation order: domain -> data -> presentation
- Stories in `prd.json` — mark `passes: true` when done

## Key Paths

- `lib/core/router/app_router.dart` — Routes
- `lib/core/providers/app_providers.dart` — Global providers
- `lib/core/theme/app_theme.dart` — Theme
- `pubspec.yaml` — Dependencies
- `prd.json` — Stories to implement
```

**Acceptance Criteria**:
- [ ] Generated CLAUDE.md is <= 100 lines
- [ ] Contains `@` imports to all generated rule files
- [ ] Module-conditional content (only shows enabled modules)
- [ ] Build commands, quality gates, and key paths included
- [ ] `npm run typecheck` passes
- [ ] >= 4 tests (full module set, minimal, no-claude, content assertions)

---

#### P8-005: Create rules-writer module

**Priority**: P0 | **Points**: 8

Create a new `rules-writer.ts` module that generates `.claude/rules/` files with
path-specific YAML frontmatter.

**Files to create**:
- `src/claude-setup/rules-writer.ts` (NEW)

**Rules to generate**:

1. **architecture.md** — Clean Architecture layer rules
   - Paths: `lib/**/*.dart`
   - Content: Layer dependency rules, import constraints, directory structure

2. **riverpod.md** — Riverpod patterns and conventions
   - Paths: `lib/**/*.dart`
   - Content: Provider types, ref.watch vs ref.read, naming conventions, AsyncNotifier

3. **go-router.md** — Router patterns
   - Paths: `lib/core/router/**/*.dart`
   - Content: TypedGoRoute, named routes, ShellRoute, conditional auth guard

4. **testing.md** — Testing conventions
   - Paths: `test/**/*.dart`
   - Content: Test structure, mocking, naming, coverage

5. **security.md** — Security guidelines (ALWAYS generated)
   - No path restriction
   - Content: No hardcoded secrets, input validation, API key handling, dependency trust

6. **Module-specific rules** (conditional):
   - `auth.md` — Auth patterns (if auth module enabled)
   - `api.md` — API client patterns (if api module enabled)
   - `database.md` — Database patterns (if database module enabled)
   - `i18n.md` — Localization patterns (if i18n module enabled)

**Example generated rule file**:
```markdown
---
paths:
  - "lib/**/*.dart"
---

# Clean Architecture Rules

## Layer Dependencies

- `domain/` has NO imports from `data/` or `presentation/`
- `data/` depends only on `domain/` (implements repository interfaces)
- `presentation/` depends on `domain/` (never directly on `data/`)

## Import Constraints

- Cross-feature imports go through `lib/core/` barrel exports
- Never import implementation details, only interfaces
- Use Riverpod providers for dependency injection, not manual wiring

## Directory Structure

Each feature follows:
lib/features/<name>/
  domain/     → entities, repository interfaces, use cases
  data/       → models, data sources, repository implementations
  presentation/ → pages, widgets, Riverpod providers
```

**Acceptance Criteria**:
- [ ] `writeRules(context, outputPath)` generates `.claude/rules/` directory
- [ ] Each rule file has YAML frontmatter with `paths` array
- [ ] `architecture.md` always generated with layer rules
- [ ] `security.md` always generated
- [ ] Module-specific rules only generated when module is enabled
- [ ] Rules content is concise and actionable (not prose)
- [ ] `npm run typecheck` passes
- [ ] >= 8 tests (each rule file, conditional generation, path filtering)

---

#### P8-006: Add security rules to generated projects

**Priority**: P0 | **Points**: 3

This is covered within P8-005 but the security.md content deserves explicit spec.

**security.md content**:
```markdown
---
description: Security guidelines for all code in this project
---

# Security Rules

## Secrets & Credentials
- NEVER hardcode API keys, tokens, or passwords in source code
- Use environment variables or secure storage (flutter_secure_storage)
- Add `.env` and credential files to `.gitignore`

## Input Validation
- Validate all user input before processing
- Sanitize strings used in queries or displayed in UI
- Use strong typing — avoid `dynamic` types

## Dependencies
- Only add packages from pub.dev with established maintainers
- Review new dependencies before adding
- Keep dependencies up to date

## API Security
- Use HTTPS for all API calls
- Validate SSL certificates (don't disable certificate verification)
- Handle auth tokens securely (store in secure storage, not SharedPreferences)

## File & Data Handling
- Never log sensitive data (passwords, tokens, PII)
- Use parameterized queries for database operations
- Encrypt sensitive local data at rest
```

**Acceptance Criteria**:
- [ ] security.md is always generated regardless of preset
- [ ] Content covers secrets, input validation, dependencies, API security, data handling
- [ ] No path restriction (applies to all code)
- [ ] >= 2 tests

---

### Sub-phase 8C: Agent Definitions

#### P8-007: Overhaul agent-writer with 3 focused agents + intelligent model routing

**Priority**: P0 | **Points**: 8

Rewrite `agent-writer.ts` to generate 3 focused agents instead of 5.
Each agent gets the optimal model for its role, better prompts with domain knowledge,
proper tool restrictions, and sub-agent usage guidance.

**Files to change**:
- `src/claude-setup/agent-writer.ts` — Complete rewrite

**3 agents with intelligent model selection**:

1. **flutter-builder.md** (model: **sonnet**, tools: Read, Write, Edit, Grep, Glob, Bash)
   - Sonnet is the sweet spot: fast enough for iteration, smart enough for implementation
   - Implements features following Clean Architecture
   - TDD-aware: checks for tests before implementation
   - Domain-first implementation order
   - Module-aware (conditional sections based on enabled modules)
   - Runs quality checks before marking tasks complete
   - **Sub-agent guidance**: Use Explore (haiku) for codebase search, don't spawn
     sub-agents for tasks achievable in < 3 tool calls

2. **flutter-tester.md** (model: **sonnet**, tools: Read, Write, Edit, Grep, Glob, Bash)
   - Sonnet: test writing requires comparable reasoning to implementation
   - Writes tests BEFORE implementation (TDD)
   - Unit tests for use cases, widget tests for pages
   - Uses mocktail for mocking
   - Reports failures with reproduction steps
   - Verifies acceptance criteria from stories
   - **Sub-agent guidance**: Use Explore (haiku) for finding test patterns in codebase

3. **flutter-reviewer.md** (model: **haiku**, tools: Read, Grep, Glob)
   - Haiku: read-only review is perfect for lightweight model (90% Sonnet quality, 3x cheaper)
   - Clean Architecture compliance checklist
   - Riverpod pattern verification
   - Security review (references security rules)
   - go_router pattern verification
   - **No sub-agents**: reviewer works directly with Read/Grep/Glob

**Model selection rationale** (embedded in each agent's body):
```
## Model Selection
This agent uses {model} because:
- sonnet: Best balance of speed and capability for {implementation/testing}
- haiku: Optimal for read-only analysis (90% of Sonnet quality at 1/3 cost)

## Sub-Agent Usage
When you need to search the codebase:
- Use Explore agent (haiku) for file search and grep operations
- Use Plan agent (inherit model) for complex architecture decisions

Do NOT spawn sub-agents for:
- Simple file reads (use Read tool directly)
- Single grep searches (use Grep tool directly)
- Tasks achievable in fewer than 3 tool calls
```

**Key improvements over current agents**:
- Fewer agents = less coordination overhead
- Architect role merged into builder (builder reads stories directly)
- Docs role removed (unnecessary for most projects)
- **Intelligent model routing**: haiku for review, sonnet for implementation/testing
- **Sub-agent guidance**: explicit rules for when to spawn vs. do directly
- Each agent references `.claude/rules/` for consistent guidance
- Module context injected dynamically

**Acceptance Criteria**:
- [ ] `writeAgents()` generates exactly 3 agent files (not 5)
- [ ] flutter-builder uses `model: sonnet` with all implementation tools
- [ ] flutter-tester uses `model: sonnet` with all tools including Bash
- [ ] flutter-reviewer uses `model: haiku` with read-only tools (Read, Grep, Glob)
- [ ] Each agent body includes model selection rationale
- [ ] Builder and tester include sub-agent usage guidance
- [ ] Reviewer explicitly states "no sub-agents needed"
- [ ] Each agent body includes module context from enabled modules
- [ ] Agent prompts reference `.claude/rules/` files
- [ ] `npm run typecheck` passes
- [ ] >= 8 tests (agent count, each agent's tools/model/content, sub-agent guidance)

---

### Sub-phase 8D: Hooks System

#### P8-008: Create hook script generators

**Priority**: P0 | **Points**: 5

Generate executable hook scripts and a comprehensive hooks configuration.

**Files to create/change**:
- `src/claude-setup/hooks-writer.ts` — Complete rewrite

**Generated hook scripts**:

1. **`.claude/hooks/block-dangerous.sh`** (PreToolUse on Bash):
   ```bash
   #!/bin/bash
   # Block dangerous commands
   INPUT=$(cat)
   CMD=$(echo "$INPUT" | jq -r '.tool_input.command // empty')

   # Block patterns
   if echo "$CMD" | grep -qE '(rm -rf|--no-verify|--force|git reset --hard|git clean -f)'; then
     echo "BLOCKED: Dangerous command detected" >&2
     exit 2
   fi
   exit 0
   ```

2. **`.claude/hooks/format-dart.sh`** (PostToolUse on Edit|Write):
   ```bash
   #!/bin/bash
   # Auto-format Dart files after edit
   INPUT=$(cat)
   FILE=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')

   if [[ "$FILE" == *.dart ]]; then
     dart format "$FILE" 2>/dev/null || true
   fi
   exit 0
   ```

3. **`.claude/settings.local.json`** — Registers all hooks:
   ```json
   {
     "hooks": {
       "PreToolUse": [{
         "matcher": "Bash",
         "hooks": [{"type": "command", "command": ".claude/hooks/block-dangerous.sh"}]
       }],
       "PostToolUse": [{
         "matcher": "Edit|Write",
         "hooks": [{"type": "command", "command": ".claude/hooks/format-dart.sh"}]
       }],
       "TaskCompleted": [{
         "hooks": [{"type": "command", "command": "flutter analyze && flutter test"}]
       }]
     }
   }
   ```

**Acceptance Criteria**:
- [ ] `writeHooks()` generates `.claude/hooks/` directory with 2 shell scripts
- [ ] Shell scripts have executable permissions (mode 0o755)
- [ ] `block-dangerous.sh` reads JSON from stdin, blocks dangerous patterns, exits 2 on block
- [ ] `format-dart.sh` reads JSON from stdin, formats .dart files only
- [ ] `settings.local.json` registers PreToolUse, PostToolUse, and TaskCompleted hooks
- [ ] Hooks only generated when preset includes hooks (standard/full)
- [ ] `npm run typecheck` passes
- [ ] >= 6 tests (script content, settings structure, preset gating, file permissions)

---

### Sub-phase 8E: Skills

#### P8-009: Improve existing skill content

**Priority**: P1 | **Points**: 3

Enhance the 4 existing skills with better examples, more practical patterns.

**Files to change**:
- `src/claude-setup/skill-writer.ts` — Improve content generators

**Improvements**:
- `flutter-patterns.md`: Add freezed data class patterns, error handling with AsyncValue
- `go-router-patterns.md`: Add ShellRoute example, nested navigation, redirect patterns
- `module-conventions.md`: Add "how to add a feature" as concrete step-by-step
- `prd.md`: Update to reflect new PRD format with acceptance criteria + dependencies

**Acceptance Criteria**:
- [ ] Each skill content is improved with more practical examples
- [ ] prd.md skill reflects new PRD schema (acceptance criteria, dependencies, etc.)
- [ ] flutter-patterns includes freezed and AsyncValue error handling
- [ ] `npm run typecheck` passes
- [ ] >= 4 tests (content assertions for each skill)

---

#### P8-010: Create security-review and performance-check skills with model hints

**Priority**: P1 | **Points**: 5

Add two new skills to the generator. Each skill includes a `model` hint in the
YAML frontmatter so Claude Code uses the optimal model when the skill is invoked.

**Files to change**:
- `src/claude-setup/skill-writer.ts` — Add new skill generators

**Model hint rationale**:
- `security-review`: Uses **sonnet** — security analysis needs strong reasoning but
  not full opus capability. Most vulnerability patterns are well-known.
- `performance-check`: Uses **haiku** — performance checks are mostly checklist-based
  (const constructors, ListView.builder, autoDispose) — perfect for lightweight model.
- `add-feature`: Uses **sonnet** — feature scaffolding needs implementation-level reasoning.

**New skills**:

1. **security-review.md**:
   ```markdown
   ---
   name: security-review
   description: Review code for security vulnerabilities and best practices
   model: sonnet
   ---

   # Security Review Checklist

   ## Check for Hardcoded Secrets
   - Search for API keys, tokens, passwords in source files
   - Verify .gitignore excludes .env, *.key, *.pem files
   - Check for secrets in pubspec.yaml comments

   ## Input Validation
   - User input is validated before use
   - No raw SQL or string concatenation for queries
   - Email/URL validation uses proper patterns

   ## API Security
   - All HTTP calls use HTTPS
   - Auth tokens stored in flutter_secure_storage (not SharedPreferences)
   - Certificate pinning for production APIs

   ## Data Protection
   - Sensitive data not logged (passwords, tokens, PII)
   - Local data encrypted at rest where appropriate
   - Proper error messages (no stack traces in production)
   ```

2. **performance-check.md**:
   ```markdown
   ---
   name: performance-check
   description: Check for common Flutter performance issues
   model: haiku
   ---

   # Performance Review Checklist

   ## Widget Rebuilds
   - Use `const` constructors wherever possible
   - Avoid rebuilding entire widget trees — use smaller widgets
   - Use `select()` with Riverpod to watch specific fields

   ## Provider Efficiency
   - Use `.autoDispose` for providers not needed globally
   - Avoid expensive computations in `build()` methods
   - Use `ref.invalidate()` instead of manual state reset

   ## Images & Assets
   - Use appropriate image resolution for device
   - Cache network images (cached_network_image)
   - Compress large assets before bundling

   ## Lists & Scrolling
   - Use `ListView.builder` for long lists (not `ListView`)
   - Add `key` parameters for dynamic list items
   - Avoid nested scrollable widgets
   ```

**Acceptance Criteria**:
- [ ] `writeSkills()` generates 6 skill files (4 existing + 2 new)
- [ ] security-review.md has `model: sonnet` in frontmatter
- [ ] performance-check.md has `model: haiku` in frontmatter
- [ ] security-review.md covers secrets, input validation, API security, data protection
- [ ] performance-check.md covers rebuilds, providers, images, lists
- [ ] Skills only generated when preset includes skills (standard/full)
- [ ] `npm run typecheck` passes
- [ ] >= 5 tests (new skill content, count, preset gating, model hints)

---

#### P8-011: Create add-feature command

**Priority**: P1 | **Points**: 3

Add an `/add-feature` slash command to generated projects.

**Files to change**:
- `src/claude-setup/commands-writer.ts` — Add new command

**Generated command `.claude/commands/add-feature.md`**:
A step-by-step guided workflow for adding a new feature following Clean Architecture.
Uses `model: sonnet` hint (feature scaffolding needs implementation-level reasoning).
10 steps: create directory structure, domain entities (freezed), repository interface,
use cases, data model, data source, repository implementation, Riverpod providers,
page (ConsumerWidget), route registration. Includes conditional sections based on modules.

**Acceptance Criteria**:
- [ ] `writeCommands()` generates add-feature.md alongside existing commands
- [ ] Command includes 10 concrete steps
- [ ] Steps reference Clean Architecture layers in correct order
- [ ] Conditional auth guard section if auth module enabled
- [ ] `npm run typecheck` passes
- [ ] >= 2 tests

---

### Sub-phase 8F: PRD Format

#### P8-012: Define new PRD schema

**Priority**: P0 | **Points**: 5

Create a Zod schema for the new PRD format with machine-readable acceptance criteria
and story dependencies.

**Files to create/change**:
- `src/claude-setup/prd-schema.ts` (NEW) — Zod schema for PRD
- `src/claude-setup/prd-generator.ts` — Use new schema

**New PRD story schema**:
```typescript
const PrdStorySchema = z.object({
  id: z.string(),                    // e.g., "P2-AUTH-001"
  phase: z.number().int().min(1).max(4),
  priority: z.enum(['P0', 'P1', 'P2', 'P3']),
  title: z.string(),
  description: z.string(),
  module: z.string().optional(),      // Which module this belongs to
  storyPoints: z.number().int().min(1).max(13),
  dependencies: z.array(z.string()).default([]),  // Story IDs this depends on
  acceptanceCriteria: z.array(z.object({
    description: z.string(),         // Human-readable
    predicate: z.string().optional(), // Machine-verifiable (optional)
  })),
  passes: z.boolean().default(false),
});

const PrdSchema = z.object({
  version: z.literal('2.0.0'),
  project: z.string(),
  generatedAt: z.string(),           // ISO timestamp
  phases: z.array(z.object({
    phase: z.number(),
    title: z.string(),
    description: z.string(),
  })),
  stories: z.array(PrdStorySchema),
});
```

**Predicate examples**:
- `file_exists('lib/features/auth/domain/repositories/auth_repository.dart')`
- `flutter_analyze.exit_code == 0`
- `flutter_test.exit_code == 0`
- `test_count('test/features/auth/') >= 3`
- `no_imports_from('domain/', 'data/')`
- `dart_format.exit_code == 0`

**Acceptance Criteria**:
- [ ] `PrdSchema` validates the new PRD format with Zod
- [ ] Schema includes id, phase, priority, title, description, module, storyPoints
- [ ] `acceptanceCriteria` is array of objects with description + optional predicate
- [ ] `dependencies` is array of story IDs
- [ ] Schema exports TypeScript types
- [ ] `npm run typecheck` passes
- [ ] >= 6 tests (schema validation, invalid data rejection, type inference)

---

#### P8-013: Overhaul PRD generator

**Priority**: P0 | **Points**: 8

Rewrite `prd-generator.ts` to produce the new PRD format with machine-readable
acceptance criteria, story dependencies, and story points.

**Files to change**:
- `src/claude-setup/prd-generator.ts` — Complete rewrite

**Key changes**:
- Story IDs use module prefix: `P1-CORE-001`, `P2-AUTH-001`, etc.
- Each story has `storyPoints` (1-13, Fibonacci)
- Each acceptance criterion has a human description + optional machine predicate
- Stories declare explicit `dependencies` on other story IDs
- Phase metadata included at top level
- `generatedAt` timestamp for versioning

**Example output**:
```json
{
  "version": "2.0.0",
  "project": "my_app",
  "generatedAt": "2026-02-20T12:00:00Z",
  "phases": [
    {"phase": 1, "title": "Core Setup", "description": "Project structure, routing, state management"},
    {"phase": 2, "title": "Feature Modules", "description": "Auth, API, database, and other modules"},
    {"phase": 3, "title": "Integration & Polish", "description": "Integration tests and quality audit"}
  ],
  "stories": [
    {
      "id": "P1-CORE-001",
      "phase": 1,
      "priority": "P0",
      "title": "Setup Clean Architecture project structure",
      "description": "...",
      "module": "core",
      "storyPoints": 3,
      "dependencies": [],
      "acceptanceCriteria": [
        {
          "description": "Feature directories exist with domain/data/presentation layers",
          "predicate": "dir_exists('lib/features/home/domain')"
        },
        {
          "description": "Flutter analyze passes with zero errors",
          "predicate": "flutter_analyze.exit_code == 0"
        }
      ],
      "passes": false
    }
  ]
}
```

**Acceptance Criteria**:
- [ ] `generatePrd()` returns JSON conforming to PrdSchema
- [ ] Story IDs use module prefix pattern
- [ ] Each story has storyPoints (Fibonacci: 1, 2, 3, 5, 8, 13)
- [ ] Acceptance criteria include both description and predicate
- [ ] Phase 2 stories correctly depend on Phase 1 completion
- [ ] Module-conditional stories only appear for enabled modules
- [ ] `npm run typecheck` passes
- [ ] >= 8 tests (all module combinations, dependencies, schema validation)

---

### Sub-phase 8G: Integration

#### P8-014: Update setup-orchestrator for new flow

**Priority**: P0 | **Points**: 5

Rewrite the orchestrator to use preset resolution and call the new rules-writer.

**Files to change**:
- `src/claude-setup/setup-orchestrator.ts` — Major update

**New flow**:
```
1. Resolve preset -> ResolvedClaudeOptions
2. Always: Generate slim CLAUDE.md
3. If rules: Generate .claude/rules/ files
4. If agents: Generate 3 agent files
5. If hooks: Generate hook scripts + settings.local.json
6. If skills: Generate 6-7 skill files
7. If commands: Generate slash commands
8. If mcp: Generate .mcp.json
9. If !skipPrd: Generate prd.json (new format)
```

**Acceptance Criteria**:
- [ ] Orchestrator uses `resolvePreset()` to determine what to generate
- [ ] Rules are generated as a new step
- [ ] All generated file paths included in `filesWritten` return
- [ ] Minimal preset generates only CLAUDE.md + rules
- [ ] Standard preset generates everything except MCP
- [ ] Full preset generates everything including MCP
- [ ] `npm run typecheck` passes
- [ ] >= 6 tests (each preset, file list assertions)

---

#### P8-015: Update add and upgrade commands

**Priority**: P1 | **Points**: 3

Update the `add` and `upgrade` commands to work with the new claude setup.

**Files to change**:
- `src/cli/add-command.ts` — Use new setup orchestrator
- `src/cli/upgrade-command.ts` — Handle new file structure

**Key changes**:
- `upgrade` command backs up `.claude/rules/` alongside agents
- `add` command regenerates rules when modules change
- Both commands use preset resolution

**Acceptance Criteria**:
- [ ] `add` command regenerates CLAUDE.md and rules when module added
- [ ] `upgrade` command backs up existing rules as .bak files
- [ ] Both commands respect `claude.preset` from config
- [ ] `npm run typecheck` passes
- [ ] >= 4 tests (add with new setup, upgrade with rules backup)

---

#### P8-016: Integration tests for new generated output

**Priority**: P1 | **Points**: 5

Write comprehensive integration tests validating the complete generated output.

**Files to create/change**:
- `tests/integration/claude-setup-v2.test.ts` (NEW)

**Test scenarios**:
1. Minimal preset: Only CLAUDE.md + rules generated
2. Standard preset: CLAUDE.md + rules + agents + hooks + skills + commands
3. Full preset: Everything + MCP
4. Full module set: All 9 modules enabled, verify all conditional content
5. No modules: Core only, verify no module-specific rules
6. CLAUDE.md line count: Assert <= 100 lines
7. Agent count: Assert exactly 3 agents generated
8. Hook scripts: Assert executable permissions
9. PRD format: Assert conforms to new schema
10. Rule files: Assert YAML frontmatter with paths

**Acceptance Criteria**:
- [ ] >= 10 integration test cases
- [ ] Tests use `useTempDir()` helper
- [ ] Tests validate actual file content (not just existence)
- [ ] CLAUDE.md line count enforced in tests
- [ ] Agent count enforced in tests
- [ ] All tests pass with `npm test`

---

#### P8-017: Snapshot tests for generated files

**Priority**: P2 | **Points**: 3

Add Jest snapshot tests for all generated files to catch unintended changes.

**Files to create/change**:
- `tests/unit/claude-setup-snapshots.test.ts` (NEW)

**Snapshots for**:
- Generated CLAUDE.md (standard preset, auth+api modules)
- Generated architecture.md rule
- Generated security.md rule
- Generated flutter-builder.md agent
- Generated prd.json (standard preset, auth module)

**Acceptance Criteria**:
- [ ] >= 5 snapshot tests
- [ ] Snapshots capture representative generated content
- [ ] `npm test -- -u` can update snapshots
- [ ] All snapshots pass

---

#### P8-018: Update existing tests for backward compatibility

**Priority**: P1 | **Points**: 3

Update existing tests that reference old agent names, old CLAUDE.md format,
or old config schema fields.

**Files to change**:
- `tests/unit/claude-md-generator.test.ts` — Update for new format
- `tests/unit/agent-writer.test.ts` — Update for 3 agents
- `tests/unit/hooks-writer.test.ts` — Update for new hooks
- `tests/unit/skill-writer.test.ts` — Update for new skills
- `tests/unit/prd-generator.test.ts` — Update for new format
- `tests/unit/config-schema.test.ts` — Add preset tests
- `tests/integration/create-command.test.ts` — May need updates

**Acceptance Criteria**:
- [ ] All existing tests updated to reflect new output
- [ ] No `it.skip()` or `it.todo()` left behind
- [ ] `npm test` passes all tests
- [ ] Coverage thresholds maintained

---

## Summary

| Sub-phase | Stories | Total Points |
|-----------|---------|-------------|
| 8A: Config & Foundation | P8-001 to P8-003 | 8 |
| 8B: CLAUDE.md & Rules | P8-004 to P8-006 | 16 |
| 8C: Agent Definitions + Model Routing | P8-007 | 8 |
| 8D: Hooks System | P8-008 | 5 |
| 8E: Skills | P8-009 to P8-011 | 11 |
| 8F: PRD Format | P8-012 to P8-013 | 13 |
| 8G: Integration | P8-014 to P8-018 | 19 |
| **Total** | **18 stories** | **80 points** |

## Implementation Order (Dependencies)

```
P8-001 (config schema) ─┬─> P8-002 (preset resolver) ──> P8-003 (wizard)
                        │
                        └─> P8-004 (CLAUDE.md) ──┐
                                                  │
P8-005 (rules-writer) ──> P8-006 (security) ─────┤
                                                  │
P8-007 (agents) ──────────────────────────────────┤
                                                  │
P8-008 (hooks) ───────────────────────────────────┤
                                                  │
P8-009 (skills) ──> P8-010 (new skills) ──────────┤
                                                  │
P8-011 (add-feature) ────────────────────────────┤
                                                  │
P8-012 (PRD schema) ──> P8-013 (PRD generator) ──┤
                                                  │
                                                  └──> P8-014 (orchestrator)
                                                          │
                                                          ├──> P8-015 (add/upgrade)
                                                          ├──> P8-016 (integration tests)
                                                          ├──> P8-017 (snapshots)
                                                          └──> P8-018 (update existing tests)
```

## Recommended Team for Implementation

| Agent | Stories | Why |
|-------|---------|-----|
| `typescript-architect` | Review all stories before implementation | Design interfaces for new modules |
| `tdd-driver` | P8-001, P8-002, P8-004, P8-005, P8-007, P8-008, P8-012, P8-013, P8-014 | Core TDD implementation |
| `tester` | P8-016, P8-017, P8-018 | Test-focused stories |
| `typescript-builder` | P8-003, P8-006, P8-009, P8-010, P8-011, P8-015 | Implementation with existing tests |
| `reviewer` | All stories | Review every PR |
| `quality-gate-enforcer` | All stories | Final check before commit |

---
---

# Phase 9: Bootstrap Agentic — AI-Powered App Planning

## Vision

Add a `maxsim-flutter plan` command that guides users through a complete AI-powered
app planning process. Instead of just scaffolding a technical skeleton, the tool becomes
a **full-stack app architect** that:

1. Understands what the user wants to build (conversational)
2. Makes intelligent architecture decisions (decision tree)
3. Proactively suggests features based on app type
4. Generates 3 reviewable artifacts before any code is written
5. Seamlessly transitions into scaffolding + agentic coding

## Research Basis

| Finding | Source | Impact |
|---------|--------|--------|
| GitHub Spec Kit's `/specify` → `/plan` → `/tasks` pipeline | Microsoft/GitHub | Gold standard for spec-driven development |
| BMAD Method: 7-agent planning before coding | BMAD-CODE | Analyst → PM → Architect → Stories |
| Conversational requirements reduce errors by 30% | Eltegra AI research | Funnel questions > single prompt |
| Agentic PRDs with predicates reduce clarification 50-70% | ProdMoh | Machine-readable acceptance criteria |
| "70% problem" — tools stall on complex logic without a spec | Substack analysis | Project Brief prevents this |
| Proactive feature suggestions increase project completeness | Lovable/Bolt comparison | AI should suggest, not just ask |

## Architecture: The Plan Command

```
$ maxsim-flutter plan
    │
    ├── CLI Phase (clack/prompts)
    │   ├── Ask project name
    │   ├── Ask 1-2 sentence description
    │   └── Generate planning workspace
    │
    ├── Generated Artifacts
    │   ├── .claude/skills/plan-app.md  (Opus skill)
    │   ├── docs/project-brief-template.md
    │   └── maxsim.config.yaml (partial)
    │
    └── User opens Claude Code
        └── /plan-app
            ├── Step 1: Understand Vision (2 questions)
            ├── Step 2: Define Core Features (2-3 questions)
            ├── Step 3: Technical Decisions (decision tree)
            ├── Step 4: Suggest Modules (proactive, with rationale)
            ├── Step 5: Generate project-brief.md (user reviews)
            ├── Step 6: Generate architecture.md (user reviews)
            ├── Step 7: Generate prd.json v2 (user reviews)
            ├── Step 8: Finalize maxsim.config.yaml
            └── Step 9: "Run maxsim-flutter create --config maxsim.config.yaml"
```

## Decisions Made

1. **Entry point**: New `plan` CLI command (not a flag on `create`)
2. **AI engine**: Claude Code delegation via generated Skill (no API key needed)
3. **Model**: Skill uses `model: opus` (complex architecture reasoning)
4. **Outputs**: 3 artifacts — project-brief.md, architecture.md, prd.json
5. **Proactive**: AI suggests features based on app type with rationale

---

## Stories

### Sub-phase 9A: Plan Command & Workspace

#### P9-001: Implement `plan` CLI command

**Priority**: P0 | **Points**: 5

Create a new `maxsim-flutter plan` command that collects basic info and generates
a planning workspace.

**Files to create/change**:
- `src/cli/commands/plan.ts` (NEW) — Plan command
- `src/cli/index.ts` — Register plan command

**Command flow**:
```
$ maxsim-flutter plan

  maxsim-flutter — Plan a new Flutter app

  ◆ Project name
  │ task_master
  │
  ◆ Describe your app in 1-2 sentences
  │ A task manager where teams can assign tasks,
  │ set deadlines, and track progress
  │
  ◇ Generating planning workspace...
  │
  ✓ Created task_master/.claude/skills/plan-app.md
  ✓ Created task_master/docs/project-brief-template.md
  ✓ Created task_master/maxsim.config.yaml (partial)
  │
  Next steps:
    cd task_master
    claude              # Open Claude Code
    /plan-app           # Start AI-guided planning
```

**Acceptance Criteria**:
- [ ] `maxsim-flutter plan` command is registered and works
- [ ] Prompts for project name (validated: snake_case)
- [ ] Prompts for app description (free text, 1-2 sentences)
- [ ] Creates project directory
- [ ] Generates `.claude/skills/plan-app.md`
- [ ] Generates `docs/project-brief-template.md`
- [ ] Generates partial `maxsim.config.yaml` with name + description
- [ ] Prints clear next-steps instructions
- [ ] `npm run typecheck` passes
- [ ] >= 4 tests

---

#### P9-002: Generate project-brief template

**Priority**: P0 | **Points**: 3

Generate a markdown template that the plan-app skill fills in during the
conversational planning process.

**Files to create**:
- `src/plan/brief-template-generator.ts` (NEW)

**Generated `docs/project-brief-template.md`**:
```markdown
# Project Brief — {projectName}

> Generated by maxsim-flutter plan. Fill in during /plan-app session.

## Problem Statement
<!-- What problem does this app solve? Who has this problem? -->

## Target Users
<!-- Who are the primary users? What are their key characteristics? -->

### Persona 1: {name}
- Role:
- Pain points:
- Goals:

## Core User Journeys
<!-- The 3-5 most important things a user can do -->

1.
2.
3.

## Explicit Non-Goals
<!-- What is OUT of scope for v1? -->

-

## Success Metrics
<!-- How do we know the app is successful? -->

-

## App Description
{description}
```

**Acceptance Criteria**:
- [ ] Template includes all sections (problem, users, journeys, non-goals, metrics)
- [ ] Project name and description pre-filled from CLI input
- [ ] Markdown renders correctly
- [ ] `npm run typecheck` passes
- [ ] >= 2 tests

---

### Sub-phase 9B: The Plan-App Skill

#### P9-003: Generate plan-app skill — Vision & Features phase

**Priority**: P0 | **Points**: 8

The core of Phase 9. Generate a comprehensive `/plan-app` Claude Code skill that
guides the user through the entire planning process. This story covers Steps 1-3.

**Files to create**:
- `src/plan/skill-generator.ts` (NEW)

**Generated `.claude/skills/plan-app.md`** (Steps 1-3):

```markdown
---
name: plan-app
description: Plan a new Flutter app from scratch with AI guidance
model: opus
---

You are an expert Flutter architect helping plan **{projectName}**.

The user described their app as: "{description}"

Guide them through a structured planning process. Ask questions one at a time.
Wait for answers before proceeding. Be conversational but focused.

## Step 1: Understand the Vision (2 questions)

Ask these questions one at a time:

1. "What problem does {projectName} solve? Who experiences this problem?"
2. "What does a successful session look like for a user? Walk me through it."

After answers, summarize and confirm:
"So {projectName} is a [type] app that helps [users] to [outcome]. Correct?"

## Step 2: Define Core Features (2-3 questions)

3. "What are the 3 most important things a user should be able to do?"
4. "Are there any features you explicitly do NOT want in v1?"
5. (Only if unclear) "Will users work alone or in teams/groups?"

## Step 3: Technical Decisions (decision tree)

Based on the answers, guide through architecture:

6. "Does {projectName} need user accounts / login?"
   → If yes: "Which auth provider? Firebase Auth (recommended for mobile),
     Supabase Auth (recommended if you need a database too), or custom?"

7. "Does {projectName} need to store data on a server?"
   → If yes + Supabase auth: "I recommend Supabase for the backend too."
   → If yes + other: "I recommend adding the API module with Dio."
   → If local only: "I recommend Drift (SQLite) for local storage."

8. "Which platforms should ship day one?"
   → Show: Android, iOS, Web, macOS, Windows, Linux
```

**Acceptance Criteria**:
- [ ] Skill uses `model: opus` for complex reasoning
- [ ] Project name and description injected into skill body
- [ ] Steps 1-3 generate 6-8 focused questions in funnel order
- [ ] Decision tree for auth, backend, database, platforms
- [ ] Questions are asked one at a time (not all at once)
- [ ] `npm run typecheck` passes
- [ ] >= 4 tests (skill content, variable injection, question count)

---

#### P9-004: Generate plan-app skill — Module suggestions phase

**Priority**: P0 | **Points**: 5

Add Steps 4-5 to the plan-app skill: proactive module suggestions based on app type
and artifact generation.

**Extends**: `src/plan/skill-generator.ts`

**Generated skill content (Steps 4-5)**:

```markdown
## Step 4: Suggest Modules (proactive)

Based on the app type and features discussed, suggest modules WITH rationale.

Use this decision matrix:

### If app involves teams/collaboration:
- auth (REQUIRED: team members need accounts)
- api (REQUIRED: shared data needs backend)
- push (RECOMMENDED: notifications for assignments/deadlines)
- analytics (NICE-TO-HAVE: team productivity insights)
- i18n (IF international teams)

### If app is e-commerce/marketplace:
- auth (REQUIRED: user accounts)
- api (REQUIRED: product catalog backend)
- database (REQUIRED: cart/favorites persistence)
- analytics (REQUIRED: conversion tracking)
- push (RECOMMENDED: order status updates)
- deep-linking (RECOMMENDED: product sharing)

### If app is content/social:
- auth (REQUIRED: user profiles)
- api (REQUIRED: content backend)
- push (REQUIRED: engagement notifications)
- analytics (RECOMMENDED: content performance)
- deep-linking (RECOMMENDED: content sharing)
- theme (RECOMMENDED: personalization)

### If app is utility/tool (single user):
- database (RECOMMENDED: local data persistence)
- theme (NICE-TO-HAVE: dark mode)
- No auth needed unless syncing across devices

### Always consider:
- cicd (RECOMMENDED for all projects)
- theme (RECOMMENDED for all projects — dark mode is expected)

Present suggestions as:
"Based on {projectName} being a [type] app, I recommend:
 ✓ auth (Firebase) — [reason]
 ✓ api — [reason]
 ✓ push — [reason]
 ○ analytics — [optional reason]
 ✗ database — [not needed because...]

Would you like to add or remove any modules?"

## Step 5: Confirm Selections

Summarize ALL decisions:
"Here's the plan for {projectName}:
 - Platforms: Android, iOS
 - Auth: Firebase Auth
 - Backend: API module (Dio)
 - Modules: auth, api, push, theme, cicd
 - Non-goals: [from Step 2]

Shall I generate the project documents?"
```

**Acceptance Criteria**:
- [ ] Module suggestions are context-aware (based on app type)
- [ ] Each suggestion includes a rationale (WHY this module)
- [ ] Modules categorized as REQUIRED / RECOMMENDED / NICE-TO-HAVE
- [ ] Decision matrix covers 4+ app types
- [ ] Confirmation step summarizes all choices
- [ ] `npm run typecheck` passes
- [ ] >= 4 tests (suggestion matrix, rationale presence, app type coverage)

---

#### P9-005: Generate plan-app skill — Artifact generation phase

**Priority**: P0 | **Points**: 8

Add Steps 6-9 to the plan-app skill: generate the 3 output artifacts.

**Extends**: `src/plan/skill-generator.ts`

**Generated skill content (Steps 6-9)**:

```markdown
## Step 6: Generate project-brief.md

Fill in `docs/project-brief-template.md` with all gathered information:
- Problem statement from Step 1
- Target users / personas from Step 1
- Core user journeys from Step 2
- Non-goals from Step 2
- Success metrics (derive from user journeys)

Write the file using the Edit tool. Tell the user:
"I've written the Project Brief. Please review docs/project-brief.md
and let me know if anything needs adjustment."

## Step 7: Generate architecture.md

Create `docs/architecture.md` with:

### Tech Stack
- Framework: Flutter
- State Management: Riverpod (AsyncNotifier pattern)
- Navigation: go_router (TypedGoRoute)
- [Conditional based on modules selected]

### Module Architecture
[For each selected module, explain the role and key decisions]

### Provider Tree (ASCII diagram)
```
ProviderScope
├── routerProvider (GoRouter)
├── themeProvider (ThemeMode)
├── authRepositoryProvider
│   └── authDataSourceProvider
├── apiClientProvider (Dio)
│   ├── authInterceptorProvider
│   └── retryInterceptorProvider
└── [module-specific providers]
```

### Navigation Flow (ASCII diagram)
```
/ (HomeRoute)
├── /login (LoginRoute) [if auth]
├── /register (RegisterRoute) [if auth]
├── /settings (SettingsRoute)
│   ├── /settings/theme [if theme]
│   └── /settings/language [if i18n]
└── /[feature-routes from user journeys]
```

### Database Schema (if applicable)
[For each entity from user journeys, define fields and relationships]

Write the file. Tell the user:
"I've written the Architecture Document. Please review docs/architecture.md."

## Step 8: Generate maxsim.config.yaml

Update the partial `maxsim.config.yaml` with all decisions:
- project name, org, description
- platforms
- modules with provider/engine selections
- claude.preset: 'standard' (or 'full' if many modules)

## Step 9: Generate prd.json

Generate a complete prd.json (v2 format) with:

### Phase 1: Foundation (P0, always)
- Project structure setup
- go_router configuration
- Riverpod ProviderScope
- Home screen implementation

### Phase 2: Core Features (from user journeys)
For EACH user journey from Step 2, generate 1-3 stories:
- Domain layer (entities, repositories, use cases)
- Data layer (data sources, implementations)
- Presentation layer (providers, pages, widgets)

### Phase 3: Module Integration
One story per enabled module (from existing prd-generator logic)

### Phase 4: Polish & Testing
- Integration tests for core flows
- Final quality audit

Each story includes:
- Machine-readable acceptance criteria with predicates
- Dependencies on prior stories
- Story points (Fibonacci)
- Module assignment

Tell the user:
"I've generated {N} stories across 4 phases in prd.json.
Review them and when ready, run:
  maxsim-flutter create --config maxsim.config.yaml

Then start agentic coding:
  claude
  > Create an agent team from prd.json and implement all stories."
```

**Acceptance Criteria**:
- [ ] Skill generates project-brief.md from conversation data
- [ ] Skill generates architecture.md with provider tree and navigation flow
- [ ] Skill generates complete maxsim.config.yaml
- [ ] Skill generates prd.json using v2 format (from Phase 8)
- [ ] Architecture includes ASCII diagrams for provider tree and navigation
- [ ] PRD stories are derived from user journeys (not just module-based)
- [ ] Clear next-steps instructions at the end
- [ ] `npm run typecheck` passes
- [ ] >= 6 tests (each artifact generation, content validation)

---

### Sub-phase 9C: Supporting Infrastructure

#### P9-006: Create app-type classifier for module suggestions

**Priority**: P1 | **Points**: 3

Build a simple classifier that maps app descriptions to app types for the
module suggestion matrix.

**Files to create**:
- `src/plan/app-type-classifier.ts` (NEW)

**App types and keywords**:
```typescript
type AppType = 'team-collaboration' | 'e-commerce' | 'content-social'
             | 'utility-tool' | 'fitness-health' | 'education' | 'general';

interface AppTypeResult {
  type: AppType;
  confidence: number;  // 0-1
  suggestedModules: ModuleSuggestion[];
}

interface ModuleSuggestion {
  moduleId: string;
  priority: 'required' | 'recommended' | 'nice-to-have';
  rationale: string;
}
```

**Classification logic** (keyword matching, no AI needed):
- "team", "collaborate", "assign", "workspace" → team-collaboration
- "shop", "cart", "product", "order", "payment" → e-commerce
- "post", "feed", "social", "share", "follow" → content-social
- "track", "log", "calculate", "convert", "tool" → utility-tool
- Default: general (suggest auth + api + theme)

This is a hint for the AI skill, not a hard constraint. The skill uses it as a
starting point and adjusts based on conversation.

**Acceptance Criteria**:
- [ ] Classifier returns AppType + confidence + suggested modules
- [ ] Covers 6+ app types
- [ ] Each app type maps to specific module suggestions with rationale
- [ ] Default "general" type has sensible suggestions
- [ ] `npm run typecheck` passes
- [ ] >= 6 tests (each app type, keyword matching, default case)

---

#### P9-007: Create architecture document generator

**Priority**: P1 | **Points**: 5

Build the architecture.md generator that creates ASCII diagrams and
architecture documentation.

**Files to create**:
- `src/plan/architecture-generator.ts` (NEW)

**Generates**:
- Tech stack section with rationale
- Module architecture overview
- ASCII provider tree diagram (based on selected modules)
- ASCII navigation flow diagram (based on user journeys)
- Database schema outline (if database module selected)

**Example provider tree**:
```
ProviderScope
├── routerProvider ─── GoRouter
├── appThemeModeProvider ─── ThemeMode [theme]
├── authRepositoryProvider [auth]
│   ├── authDataSourceProvider
│   └── isLoggedInProvider (computed)
├── dioClientProvider [api]
│   ├── authInterceptorProvider [auth+api]
│   └── retryInterceptorProvider
├── databaseProvider [database]
└── analyticsServiceProvider [analytics]
    └── analyticsObserverProvider
```

**Acceptance Criteria**:
- [ ] Generates provider tree as ASCII art based on enabled modules
- [ ] Generates navigation flow as ASCII art
- [ ] Tech stack section adapts to module selections
- [ ] Database schema section only appears when database module enabled
- [ ] `npm run typecheck` passes
- [ ] >= 4 tests (full modules, minimal, provider tree, nav flow)

---

#### P9-008: Create journey-to-stories converter

**Priority**: P0 | **Points**: 8

The key differentiator: convert user journeys from the project brief into
concrete PRD stories with acceptance criteria.

**Files to create**:
- `src/plan/journey-to-stories.ts` (NEW)

**This is a template/prompt that the plan-app skill uses**, not runtime AI logic.
The skill instructs Claude to decompose each user journey into stories following
this pattern:

**For each user journey**:
```
Journey: "User can create and assign tasks to team members"

→ Story 1: Domain layer
  - Create Task entity (freezed)
  - Create TaskRepository interface
  - Create CreateTaskUseCase, AssignTaskUseCase

→ Story 2: Data layer
  - Create TaskModel (json_serializable)
  - Create TaskRemoteDataSource
  - Create TaskRepositoryImpl

→ Story 3: Presentation layer
  - Create taskRepositoryProvider, taskListProvider
  - Create TaskListPage, CreateTaskPage
  - Add routes: /tasks, /tasks/create

→ Story 4: Tests
  - Unit tests for use cases
  - Widget tests for pages
  - Integration test for full flow
```

**Story generation rules** (embedded in skill):
1. Each journey produces 2-4 stories
2. Stories follow Clean Architecture layers (domain → data → presentation)
3. Each story has machine-readable acceptance criteria
4. Stories declare dependencies (data depends on domain, presentation depends on both)
5. Story points assigned by complexity (entity=2, full feature=5, integration=3)

**Acceptance Criteria**:
- [ ] Journey decomposition template produces domain/data/presentation stories
- [ ] Each generated story has >= 3 acceptance criteria with predicates
- [ ] Stories have correct dependencies (domain first, then data, then presentation)
- [ ] Story points follow Fibonacci (1, 2, 3, 5, 8)
- [ ] Test stories generated for each feature
- [ ] `npm run typecheck` passes
- [ ] >= 6 tests (decomposition pattern, dependency chain, criteria format)

---

### Sub-phase 9D: Integration & Testing

#### P9-009: Wire plan command into CLI

**Priority**: P1 | **Points**: 3

Register the plan command, ensure it works end-to-end with all generators.

**Files to change**:
- `src/cli/index.ts` — Register plan command
- `src/plan/index.ts` (NEW) — Plan module barrel export

**Acceptance Criteria**:
- [ ] `maxsim-flutter plan` appears in help output
- [ ] Command creates project directory
- [ ] All 3 generated files exist after running
- [ ] `npm run typecheck` passes
- [ ] >= 3 tests

---

#### P9-010: Integration tests for plan command

**Priority**: P1 | **Points**: 5

End-to-end tests for the plan command and generated skill.

**Files to create**:
- `tests/integration/plan-command.test.ts` (NEW)

**Test scenarios**:
1. Plan command creates correct directory structure
2. Generated plan-app.md skill has correct model (opus)
3. Generated skill includes all 9 steps
4. Generated skill has module suggestion matrix
5. Project brief template has all sections
6. App type classifier returns correct types
7. Architecture generator produces valid ASCII diagrams
8. Journey-to-stories produces valid story structure
9. Partial maxsim.config.yaml is valid YAML
10. Generated artifacts work with `create --config`

**Acceptance Criteria**:
- [ ] >= 10 integration test cases
- [ ] Tests validate generated skill content
- [ ] Tests validate architecture ASCII diagrams
- [ ] Tests validate journey decomposition
- [ ] All tests pass with `npm test`

---

#### P9-011: Update documentation and README

**Priority**: P2 | **Points**: 2

Document the new plan command in README and CONTRIBUTING.md.

**Files to change**:
- `README.md` — Add plan command section
- `CONTRIBUTING.md` — Add plan module architecture

**Acceptance Criteria**:
- [ ] README includes `maxsim-flutter plan` with example workflow
- [ ] README shows the 3-artifact output
- [ ] CONTRIBUTING.md describes `src/plan/` module structure
- [ ] `npm run typecheck` passes

---

## Summary

| Sub-phase | Stories | Total Points |
|-----------|---------|-------------|
| 9A: Plan Command & Workspace | P9-001 to P9-002 | 8 |
| 9B: Plan-App Skill | P9-003 to P9-005 | 21 |
| 9C: Supporting Infrastructure | P9-006 to P9-008 | 16 |
| 9D: Integration & Testing | P9-009 to P9-011 | 10 |
| **Total** | **11 stories** | **55 points** |

## Implementation Order (Dependencies)

```
P9-001 (plan command) ──> P9-002 (brief template)
                              │
P9-006 (app classifier) ─────┤
                              │
                              └──> P9-003 (skill: vision)
                                      │
                                      └──> P9-004 (skill: modules)
                                              │
P9-007 (arch generator) ───────────────────────┤
P9-008 (journey-to-stories) ───────────────────┤
                                              │
                                              └──> P9-005 (skill: artifacts)
                                                      │
                                                      └──> P9-009 (wire CLI)
                                                              │
                                                              ├──> P9-010 (integration tests)
                                                              └──> P9-011 (docs)
```

## Phase 8 + 9 Combined Summary

| Phase | Stories | Points | Focus |
|-------|---------|--------|-------|
| Phase 8: Agentic Output Overhaul | 18 | 80 | Better agents, rules, hooks, skills, PRD |
| Phase 9: Bootstrap Agentic | 11 | 55 | AI-powered app planning before coding |
| **Total** | **29 stories** | **135 points** | |

## The Complete User Journey (After Phase 8 + 9)

```
$ maxsim-flutter plan
  → "What are you building?"
  → AI asks 6-8 smart questions
  → AI suggests modules with rationale
  → Generates project-brief.md ← USER REVIEWS
  → Generates architecture.md  ← USER REVIEWS
  → Generates prd.json         ← USER REVIEWS

$ maxsim-flutter create --config maxsim.config.yaml
  → Scaffolds Flutter app with Clean Architecture
  → Generates slim CLAUDE.md + .claude/rules/
  → Generates 3 focused agents (sonnet/haiku)
  → Generates quality hooks (format, block, test)
  → Generates 7 skills with model hints
  → Generates machine-readable PRD

$ claude
  > Create an agent team from prd.json.
  > Implement all stories phase by phase.
  → Builder (sonnet) implements features
  → Tester (sonnet) writes tests first
  → Reviewer (haiku) checks quality
  → Hooks enforce formatting & safety
  → Stories track progress with predicates
  → App is built autonomously ✓
```
