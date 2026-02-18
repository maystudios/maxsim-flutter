# ADR-001: Project Architecture

**Status**: Accepted
**Date**: 2026-02-18

## Context

We need to decide on the architecture for maxsim-flutter, a tool that scaffolds Flutter apps with AI assistance.

## Decision

### Dual Interface: TypeScript CLI + Claude Code Plugin
- **CLI** (Commander.js + @clack/prompts): Handles file operations, template rendering, interactive prompts
- **Claude Code Plugin**: Provides AI-conversational interface, wraps CLI commands via Skills

### Why TypeScript/Node?
- Broader ecosystem for CLI tools than Dart
- npm distribution (npx support) for easy adoption
- Handlebars template engine is mature and well-suited
- Better tooling for CLI development (Commander, Clack, ora)

### Core Subsystems
```
cli/          → User-facing commands and interactive UI
core/         → Config schema, validation, project context
scaffold/     → Template rendering pipeline
modules/      → Module system (registry, resolver, composer)
ralph/        → PRD generation for autonomous development
swarm/        → Claude Code team orchestration
claude-setup/ → Generates .claude/ for output projects
```

## Consequences

- Two interfaces to maintain (CLI + Plugin), but shared core minimizes duplication
- Node.js dependency for a Flutter tool (acceptable since developers typically have Node)
- npm distribution enables easy adoption via npx
