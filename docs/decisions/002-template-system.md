# ADR-002: Template System

**Status**: Accepted
**Date**: 2026-02-18

## Context

Generated Flutter projects need consistent, high-quality code. We need to decide between fully AI-generated code vs templates vs a hybrid.

## Decision

### Templates + AI Hybrid
- **Handlebars templates** for deterministic base structure (fast, reproducible, no API costs)
- **AI (via Ralph/Swarm)** for customization, integration, and complex logic

### Template Organization
```
templates/
├── core/           → Always rendered (Clean Arch skeleton)
├── modules/<name>/ → Per-module templates + pubspec.partial.yaml
├── claude/         → Claude setup templates
└── ralph/          → PRD templates
```

### Rendering Pipeline
1. ModuleResolver: topological sort of selected modules
2. ModuleComposer: merge template contributions + pubspec fragments
3. Renderer: Handlebars rendering with TemplateContext
4. FileWriter: atomic writes with conflict detection
5. PostProcessors: dart format, flutter pub get, build_runner

### Why Handlebars?
- Mature, well-documented
- Logic-less (keeps templates simple)
- Supports partials (for pubspec merging)
- No runtime dependencies in generated code

## Consequences

- Templates must be maintained when Flutter/packages update
- Handlebars limitations (no complex logic) keep templates clean but may need custom helpers
- Deterministic output for base structure (reproducible builds)
