# maxsim-flutter Architecture

This document describes the internal architecture of the maxsim-flutter CLI tool.
For the contributor workflow, see [CONTRIBUTING.md](../CONTRIBUTING.md).
For architecture decision records, see [docs/decisions/](decisions/).

---

## Overview

maxsim-flutter is a TypeScript CLI tool distributed via npm. It scaffolds Flutter
applications with Clean Architecture, Riverpod, and go_router. It also generates
a `.claude/` directory that configures Claude Code for autonomous AI-assisted
development on the generated project.

The tool has two interfaces:

- **CLI** (`maxsim-flutter create|add|upgrade|migrate|list`) — Commander.js commands
  with @clack/prompts for interactive use
- **Claude Code Plugin** (`claude-plugin/`) — Skills that wrap the CLI for
  conversational use within a Claude Code session

Both interfaces share the same core TypeScript modules.

---

## Directory Structure

```
src/
├── cli/
│   ├── commands/       create.ts, add.ts, upgrade.ts, migrate.ts, list.ts
│   └── ui/             prompts.ts (interactive prompts), spinner.ts
│
├── core/
│   ├── config/         schema.ts (Zod), loader.ts (YAML parse + validate)
│   ├── context.ts      MaxsimConfig → ProjectContext factory
│   ├── detector.ts     Analyses existing Flutter projects for migrate command
│   └── validator.ts    Environment checks (Flutter SDK, Dart, etc.)
│
├── scaffold/
│   ├── engine.ts       Main orchestrator — runs the full scaffold pipeline
│   ├── renderer.ts     Handlebars template renderer
│   ├── file-writer.ts  Atomic file writes with conflict detection
│   ├── template-helpers.ts  collectAndRenderTemplates, processPubspecPartial
│   └── post-processors/    dart-format.ts, flutter-pub-get.ts, build-runner.ts
│
├── modules/
│   ├── registry.ts     ModuleRegistry — discover, load, and register manifests
│   ├── resolver.ts     ModuleResolver — dependency resolution + topological sort
│   ├── composer.ts     pickNewerVersion — pubspec dependency merging
│   └── definitions/    core/, auth/, api/, theme/, database/, i18n/, push/,
│                       analytics/, cicd/, deep-linking/
│
├── claude-setup/
│   ├── setup-orchestrator.ts  runClaudeSetup — coordinates all generators
│   ├── claude-md-generator.ts  CLAUDE.md content
│   ├── agent-writer.ts         .claude/agents/*.md
│   ├── skill-writer.ts         .claude/skills/*.md
│   ├── hooks-writer.ts         .claude/settings.local.json
│   ├── mcp-config-writer.ts    .mcp.json
│   ├── commands-writer.ts      .claude/commands/*.md
│   └── prd-generator.ts        prd.json
│
├── ralph/
│   └── prd-generator.ts    Generates prd.json stories for generated apps
│
└── types/
    ├── module.ts       ModuleManifest, ModuleContribution, ModuleQuestion
    ├── config.ts       MaxsimConfig (inferred from Zod schema)
    └── project.ts      GeneratedFile, Platform, ScaffoldResult
```

---

## Subsystem Map

```
┌─────────────────────────────────────────────────────────────┐
│                        CLI Layer                            │
│  create  │  add  │  upgrade  │  migrate  │  list           │
└────────────────────────┬────────────────────────────────────┘
                         │ uses
┌────────────────────────▼────────────────────────────────────┐
│                       Core Layer                            │
│  MaxsimConfigSchema (Zod) → MaxsimConfig → ProjectContext   │
└──────────┬─────────────────────────────┬────────────────────┘
           │ provides context             │ provides context
┌──────────▼──────────┐       ┌──────────▼──────────────────┐
│   Scaffold Engine   │       │      Claude Setup            │
│  renderer           │       │  CLAUDE.md + agents +        │
│  file-writer        │       │  skills + hooks + prd.json   │
│  post-processors    │       └─────────────────────────────-┘
└──────────┬──────────┘
           │ uses
┌──────────▼──────────────────────────────────────────────────┐
│                     Module System                           │
│  Registry → Resolver (topo-sort) → Composer (merge deps)   │
│                 ↑                                           │
│  definitions/: core, auth, api, theme, database, …         │
└─────────────────────────────────────────────────────────────┘
```

---

## Data Flow: `maxsim-flutter create`

```
User input (CLI flags / interactive prompts)
         │
         ▼
 parseConfig(rawObject)          ← Zod validation + defaults
         │
         ▼
 createProjectContext(config)    ← typed ProjectContext
         │
         ▼
 ScaffoldEngine.run(context)
    │
    ├─ 1. collectAndRenderTemplates(templates/core/)
    │      Handlebars renders each .hbs file with TemplateContext
    │
    ├─ 2. ModuleRegistry.loadAll()
    │      Discovers src/modules/definitions/*/module.js
    │
    ├─ 3. ModuleResolver.resolve(selectedIds)
    │      Validates dependencies, detects conflicts,
    │      returns topologically sorted ModuleManifest[]
    │
    ├─ 4. For each module:
    │      collectAndRenderTemplates(templates/modules/<id>/)
    │      processPubspecPartial() → merge deps into pubspec.yaml
    │
    ├─ 5. FileWriter.writeAll(fileMap)
    │      Atomic writes, conflict detection, dry-run support
    │
    ├─ 6. runClaudeSetup(context, outputDir)   [if claude.enabled]
    │      Generates CLAUDE.md, agents, skills, hooks, prd.json
    │
    └─ 7. Post-processors
           dart format → flutter pub get → build_runner
```

---

## Module System

Each module is defined by a `ModuleManifest` object in
`src/modules/definitions/<name>/module.ts`. The manifest declares:

| Field | Purpose |
|-------|---------|
| `id` | Kebab-case identifier (e.g. `'deep-linking'`) |
| `name` | Human-readable label |
| `requires` | Module IDs this module depends on |
| `conflictsWith` | Module IDs that cannot coexist |
| `templateDir` | Path to Handlebars templates |
| `ralphPhase` | PRD phase (1–4) |
| `contributions` | pubspec deps, Riverpod providers, routes |
| `questions` | Interactive config prompts |
| `isEnabled` | Predicate that can suppress the module at runtime |

**Loading flow:**

```
ModuleRegistry.loadAll()
  → readdir(dist/modules/definitions/)
  → dynamic import(module.js) for each subdirectory
  → register(manifest) if manifest.id is valid

ModuleResolver.resolve(selectedIds)
  → add alwaysIncluded modules (core)
  → addTransitiveDependencies() — BFS expansion
  → checkConflicts()
  → topologicalSort() — Kahn's algorithm, deterministic order
```

---

## Template Pipeline

```
templates/core/              templates/modules/<id>/
      │                              │
      ▼                              ▼
collectAndRenderTemplates()   collectAndRenderTemplates()
  glob **/* (excl. .hbs ext)    (excludes pubspec.partial.yaml)
  for each file:
    renderer.render(hbsContent, templateContext)
    → GeneratedFile { relativePath, content }
                                     │
                              processPubspecPartial()
                                dependency merging
                                (newer version wins)
                                     │
                                     ▼
                              FileWriter.writeAll(Map<path, content>)
                                overwriteMode: ask | always | never
                                dry-run: log only, no writes
```

**Template context shape** (abbreviated):

```typescript
{
  project: { name, orgId, description },
  platforms: { android, ios, web, … },   // boolean flags
  modules: {
    auth: false | { provider: 'firebase' | 'supabase' | 'custom' },
    api:  false | { baseUrl? },
    // … etc
  }
}
```

---

## Config and Context

Raw YAML config flows through two transformations:

```
maxsim.config.yaml
      │  js-yaml parse
      ▼
  raw object
      │  MaxsimConfigSchema.parse()  ← Zod validation + defaults
      ▼
  MaxsimConfig                       ← typed, all fields present
      │  createProjectContext()
      ▼
  ProjectContext                     ← resolved, template-ready
      │
      ├─ modules.auth: false | { provider }    (never undefined)
      ├─ scaffold.postProcessors.*: boolean
      └─ rawConfig: MaxsimConfig              (original, for re-serialisation)
```

The Zod schema (`src/core/config/schema.ts`) is the **single source of truth**
for all config defaults and validation rules.

---

## Test Architecture

```
tests/
├── helpers/
│   ├── context-factory.ts   makeTestContext() / makeWritableContext(tmpDir)
│   ├── temp-dir.ts          useTempDir(prefix) — auto-cleanup in afterEach
│   └── registry-factory.ts  createTestRegistry() — all 10 manifests pre-loaded
│
├── unit/          Pure function tests, no filesystem writes
│                  Mock @clack/prompts with jest.unstable_mockModule()
│
└── integration/   Real filesystem via useTempDir()
                   ScaffoldEngine runs against actual templates/
```

Coverage thresholds are defined in `jest.config.mjs`. Always look them up
there — never hardcode threshold values.

---

## Architecture Decision Records

Historical decisions are documented in [`docs/decisions/`](decisions/):

| ADR | Title | Status |
|-----|-------|--------|
| [001](decisions/001-project-architecture.md) | Project Architecture — CLI + Plugin dual interface | Accepted |
| [002](decisions/002-template-system.md) | Template System — Handlebars + AI hybrid | Accepted |
| [003](decisions/003-module-system.md) | Module System — ModuleManifest-based composition | Accepted |
| [004](decisions/004-ralph-integration.md) | Ralph Integration — autonomous PRD loop | Superseded by 006 |
| [005](decisions/005-swarm-architecture.md) | Swarm Architecture | Superseded by 006 |
| [006](decisions/006-hybrid-orchestration.md) | Hybrid Orchestration — Agent Teams + Ralph | Accepted |
