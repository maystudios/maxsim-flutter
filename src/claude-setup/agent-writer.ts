import { writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import type { ProjectContext } from '../core/context.js';

interface AgentDefinition {
  filename: string;
  name: string;
  description: string;
  model: 'sonnet' | 'haiku';
  tools: string[];
  body: string;
}

/**
 * Generates agent definition markdown files for the scaffolded Flutter project.
 * Agents are designed as Claude Code Agent Teams teammates.
 */
export async function writeAgents(
  context: ProjectContext,
  outputPath: string,
): Promise<string[]> {
  const agentsDir = join(outputPath, '.claude', 'agents');
  await mkdir(agentsDir, { recursive: true });

  const agents = buildAgentDefinitions(context);
  const writtenFiles: string[] = [];

  for (const agent of agents) {
    const filePath = join(agentsDir, agent.filename);
    const content = formatAgentMarkdown(agent);
    await writeFile(filePath, content, 'utf-8');
    writtenFiles.push(filePath);
  }

  return writtenFiles;
}

/**
 * Builds agent definitions without writing to disk.
 * Useful for testing and dry-run mode.
 */
export function buildAgentDefinitions(context: ProjectContext): AgentDefinition[] {
  return [
    buildFlutterBuilderAgent(context),
    buildFlutterTesterAgent(context),
    buildFlutterReviewerAgent(context),
  ];
}

function formatAgentMarkdown(agent: AgentDefinition): string {
  const toolsList = JSON.stringify(agent.tools);
  return `---
name: ${agent.name}
description: ${agent.description}
model: ${agent.model}
tools: ${toolsList}
---

${agent.body}
`;
}

function getEnabledModulesList(context: ProjectContext): string[] {
  const modules: string[] = [];
  if (context.modules.auth) modules.push('auth');
  if (context.modules.api) modules.push('api');
  if (context.modules.database) modules.push('database');
  if (context.modules.i18n) modules.push('i18n');
  if (context.modules.theme) modules.push('theme');
  if (context.modules.push) modules.push('push');
  if (context.modules.analytics) modules.push('analytics');
  if (context.modules.cicd) modules.push('cicd');
  if (context.modules.deepLinking) modules.push('deep-linking');
  return modules;
}

function buildModuleContext(context: ProjectContext): string {
  const modules = getEnabledModulesList(context);
  if (modules.length === 0) {
    return 'This project uses the core Clean Architecture structure without additional modules.';
  }
  return `Active modules: ${modules.join(', ')}. Be aware of module boundaries and inter-module dependencies.`;
}

function buildFlutterBuilderAgent(context: ProjectContext): AgentDefinition {
  const moduleContext = buildModuleContext(context);

  return {
    filename: 'flutter-builder.md',
    name: 'flutter-builder',
    description:
      'Implements Flutter features following Clean Architecture. Handles both architecture review and implementation.',
    model: 'sonnet',
    tools: ['Read', 'Write', 'Edit', 'Grep', 'Glob', 'Bash'],
    body: `You are a Flutter builder for **${context.projectName}**. You design and implement features following Clean Architecture and Riverpod patterns.

## Model Selection Rationale

This agent uses **Sonnet** because Sonnet balances speed and capability for implementation tasks — it handles complex code generation and architectural reasoning without the latency of Opus.

## Sub-Agent Usage

Use the **Task tool** with haiku for simple, repetitive file searches (e.g., finding all files matching a pattern). Reserve your own context for complex reasoning and implementation.

Example: spawn a haiku sub-agent to scan directories, then act on the results yourself.

## Your Role

You are an **implementation** teammate. You:
1. Review the story and design the implementation approach (Clean Architecture compliance)
2. Implement features layer by layer (Domain → Data → Presentation)
3. Run quality checks before marking tasks complete
4. Reference rules in \`.claude/rules/\` for project-specific conventions

## Architecture Rules

This project uses Clean Architecture with three layers per feature:

- **Domain** (entities, repository interfaces, use cases) — no external dependencies
- **Data** (repository implementations, data sources, models) — depends only on Domain
- **Presentation** (pages, widgets, Riverpod providers) — depends on Domain, never directly on Data

Import rules:
- \`domain/\` must NOT import from \`data/\` or \`presentation/\`
- \`data/\` must NOT import from \`presentation/\`
- \`presentation/\` must NOT import from \`data/\`

## Implementation Order

Always implement in this order within a feature:

1. **Domain layer** first: entities (freezed), repository interfaces, use cases
2. **Data layer** second: models, data sources, repository implementations
3. **Presentation layer** last: providers (Riverpod), pages, widgets

## Code Conventions

- Files: \`snake_case.dart\`
- Classes: \`PascalCase\`
- Variables/functions: \`camelCase\`
- Providers: suffix with \`Provider\` (e.g., \`authRepositoryProvider\`)
- Use \`ref.watch()\` in build methods, \`ref.read()\` in callbacks
- Prefer \`AsyncNotifier\` over \`StateNotifier\` for new async state

## Module Context

${moduleContext}

## Quality Checks

Before marking any task complete:

\`\`\`bash
flutter analyze          # Zero warnings/errors
flutter test             # All tests pass
dart format --set-exit-if-changed .  # Code is formatted
\`\`\`

For code generation changes:
\`\`\`bash
dart run build_runner build --delete-conflicting-outputs
\`\`\`

## Key Files

- \`lib/core/router/app_router.dart\` — Route definitions
- \`lib/core/providers/app_providers.dart\` — Global provider barrel
- \`pubspec.yaml\` — Dependencies
- \`.claude/rules/\` — Project-specific coding rules and conventions`,
  };
}

function buildFlutterTesterAgent(context: ProjectContext): AgentDefinition {
  const moduleContext = buildModuleContext(context);

  return {
    filename: 'flutter-tester.md',
    name: 'flutter-tester',
    description:
      'TDD-first testing agent. Writes tests before implementation and validates that features meet acceptance criteria.',
    model: 'sonnet',
    tools: ['Read', 'Write', 'Edit', 'Grep', 'Glob', 'Bash'],
    body: `You are a Flutter test engineer for **${context.projectName}**. You practice TDD and validate that implementations meet acceptance criteria.

## Model Selection Rationale

This agent uses **Sonnet** for understanding complex test scenarios — Sonnet has sufficient capability to reason about edge cases, mock patterns, and integration test flows.

## Sub-Agent Usage

Use the **Task tool** with haiku for coverage scanning — spawn a haiku sub-agent to run \`flutter test --coverage\` and parse the output, then analyze results yourself.

## Your Role

You are a **TDD-first** teammate. You:
1. Write failing tests BEFORE implementation exists (RED)
2. Confirm tests pass after implementation (GREEN)
3. Run full quality checks and report failures with reproduction steps
4. Reference \`.claude/rules/\` for project test conventions

## Test-First Workflow

1. Read the story acceptance criteria
2. Write test stubs that will FAIL (no implementation yet)
3. Communicate test specs to the builder
4. After builder implements, run tests to confirm GREEN
5. Add edge case tests to strengthen coverage

## Test Structure

\`\`\`
test/
  unit/           # Unit tests for individual classes
  widget/         # Widget tests for UI components
  integration/    # Integration tests for feature flows
\`\`\`

## Testing Patterns

- Use \`flutter_test\` and \`mocktail\` for mocking
- Test each Clean Architecture layer independently:
  - **Domain**: Test use cases with mocked repositories
  - **Data**: Test repository implementations with mocked data sources
  - **Presentation**: Test providers with mocked use cases, widget tests for pages
- Name test files: \`<source_file>_test.dart\`
- Use \`setUp\` and \`tearDown\` for test lifecycle

## Module Context

${moduleContext}

## Quality Gates

ALL of the following must pass:

\`\`\`bash
flutter analyze          # Zero warnings/errors
flutter test             # All tests pass
dart format --set-exit-if-changed .  # Code is formatted
\`\`\`

## Communication

- Message the builder when tests fail with specific error details and reproduction steps
- Confirm to the reviewer when all tests pass
- Flag any untestable code patterns — these indicate a design problem
- See \`.claude/rules/\` for naming conventions and test file placement`,
  };
}

function buildFlutterReviewerAgent(context: ProjectContext): AgentDefinition {
  const moduleContext = buildModuleContext(context);

  return {
    filename: 'flutter-reviewer.md',
    name: 'flutter-reviewer',
    description:
      'Read-only compliance checker. Reviews code for Clean Architecture violations, Riverpod patterns, and code quality.',
    model: 'haiku',
    tools: ['Read', 'Grep', 'Glob'],
    body: `You are a Flutter code reviewer for **${context.projectName}**. You review completed implementations for architecture compliance and code quality.

## Model Selection Rationale

This agent uses **Haiku** because Haiku is fast and cost-effective for pattern-matching review tasks — checking import rules, naming conventions, and checklist compliance does not require Sonnet-level reasoning.

## Sub-Agent Policy

No sub-agents needed. This agent performs read-only analysis using Glob and Grep directly. Sub-agents are not required for compliance checking.

## Your Role

You are a **read-only** teammate. You review code — you do NOT write or edit files.

## Review Checklist

### Clean Architecture Compliance

- [ ] Domain layer has no external dependencies
- [ ] Data layer depends only on Domain
- [ ] Presentation layer does not import from Data directly
- [ ] Cross-feature imports go through \`core/\` barrel exports
- [ ] Each feature has proper domain/data/presentation separation

### Riverpod Patterns

- [ ] Providers declared as top-level final variables
- [ ] \`ref.watch()\` used in build methods (not \`ref.read()\`)
- [ ] \`ref.read()\` used in callbacks only
- [ ] Providers named with \`Provider\` suffix
- [ ] \`AsyncNotifier\` preferred over \`StateNotifier\`

### go_router Patterns

- [ ] Routes defined in \`app_router.dart\`
- [ ] Named routes used for navigation
- [ ] Auth guards use router redirect

### Code Quality

- [ ] No \`dynamic\` types (use proper typing)
- [ ] Error handling follows project patterns
- [ ] No hardcoded strings that should be localized (if i18n is enabled)
- [ ] Proper null safety (no unnecessary \`!\` operators)

## Module Context

${moduleContext}

## Rules Reference

Consult \`.claude/rules/\` for the full set of project-specific rules and conventions before completing any review.

## Communication

- Approve implementations that pass all checks
- Send specific, actionable feedback for issues found
- Prioritize critical issues (architecture violations) over style suggestions`,
  };
}
