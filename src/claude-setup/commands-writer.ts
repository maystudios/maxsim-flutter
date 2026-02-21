import fs from 'fs-extra';
import path from 'node:path';
import type { ProjectContext } from '../core/context.js';

/**
 * Writes Claude Code slash command files for a scaffolded Flutter project.
 * Commands provide step-by-step guidance for common development tasks.
 */
export async function writeCommands(context: ProjectContext, outputPath: string): Promise<void> {
  const commandsDir = path.join(outputPath, '.claude', 'commands');
  await fs.ensureDir(commandsDir);

  const writes = [
    fs.writeFile(path.join(commandsDir, 'add-feature.md'), generateAddFeatureCommand(context)),
    fs.writeFile(path.join(commandsDir, 'analyze.md'), generateAnalyzeCommand()),
    fs.writeFile(path.join(commandsDir, 'start-team.md'), generateStartTeamCommand(context)),
  ];

  if (context.claude?.agentTeams) {
    writes.push(
      fs.writeFile(path.join(commandsDir, 'specify.md'), generateSpecifyCommand()),
      fs.writeFile(path.join(commandsDir, 'plan.md'), generatePlanCommand()),
      fs.writeFile(path.join(commandsDir, 'tasks.md'), generateTasksCommand()),
    );
  }

  await Promise.all(writes);
}

function generateAddFeatureCommand(context: ProjectContext): string {
  const routerNote = context.modules.auth
    ? `
### Route Guard (if feature is protected)

Add an auth redirect in \`app_router.dart\`:

\`\`\`dart
redirect: (context, state) {
  final isLoggedIn = ref.read(isLoggedInProvider);
  if (!isLoggedIn && state.matchedLocation.startsWith('/<feature-path>')) {
    return '/auth/login';
  }
  return null;
},
\`\`\`
`
    : '';

  const i18nNote = context.modules.i18n
    ? `
### Localization

Add new strings to \`lib/l10n/app_en.arb\` (and other locale files), then run:

\`\`\`bash
flutter gen-l10n
\`\`\`
`
    : '';

  return `---
model: sonnet
---
# Add Feature

Add a new feature to this Flutter project following Clean Architecture.

## Steps

### 1. Create Feature Directory Structure

\`\`\`bash
mkdir -p lib/features/<name>/{domain/{entities,repositories,usecases},data/{datasources,models,repositories},presentation/{pages,widgets,providers}}
\`\`\`

### 2. Domain Layer — Define Entities

Create \`lib/features/<name>/domain/entities/<name>.dart\`:

\`\`\`dart
import 'package:freezed_annotation/freezed_annotation.dart';

part '<name>.freezed.dart';

@freezed
class <Name> with _$<Name> {
  const factory <Name>({
    required String id,
    // Add fields here
  }) = _<Name>;
}
\`\`\`

### 3. Domain Layer — Repository Interface

Create \`lib/features/<name>/domain/repositories/<name>_repository.dart\`:

\`\`\`dart
abstract class <Name>Repository {
  Future<List<<Name>>> getAll();
  Future<<Name>?> getById(String id);
  Future<void> save(<Name> item);
  Future<void> delete(String id);
}
\`\`\`

### 4. Domain Layer — Use Cases

Create use case files in \`lib/features/<name>/domain/usecases/\`:

\`\`\`dart
// get_<name>_use_case.dart
class Get<Name>UseCase {
  const Get<Name>UseCase(this._repository);
  final <Name>Repository _repository;

  Future<List<<Name>>> call() => _repository.getAll();
}
\`\`\`

### 5. Data Layer — Model with Serialization

Create \`lib/features/<name>/data/models/<name>_model.dart\`:

\`\`\`dart
import 'package:freezed_annotation/freezed_annotation.dart';
import '../../domain/entities/<name>.dart';

part '<name>_model.freezed.dart';
part '<name>_model.g.dart';

@freezed
class <Name>Model with _$<Name>Model {
  const factory <Name>Model({
    required String id,
    // Mirror entity fields, add JSON annotations as needed
  }) = _<Name>Model;

  factory <Name>Model.fromJson(Map<String, dynamic> json) =>
    _$<Name>ModelFromJson(json);
}

extension <Name>ModelX on <Name>Model {
  <Name> toDomain() => <Name>(id: id);
}
\`\`\`

### 6. Data Layer — Data Source and Repository Impl

Create the data source and repository implementation, then run code generation:

\`\`\`bash
dart run build_runner build --delete-conflicting-outputs
\`\`\`

### 7. Presentation Layer — Providers

Create \`lib/features/<name>/presentation/providers/<name>_providers.dart\`:

\`\`\`dart
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../domain/entities/<name>.dart';
import '../../data/repositories/<name>_repository_impl.dart';

final <name>RepositoryProvider = Provider<<Name>Repository>((ref) {
  return <Name>RepositoryImpl(/* data source */);
});

final <name>ListProvider = AsyncNotifierProvider<<Name>ListNotifier, List<<Name>>>(() {
  return <Name>ListNotifier();
});

class <Name>ListNotifier extends AsyncNotifier<List<<Name>>> {
  @override
  Future<List<<Name>>> build() async {
    return ref.watch(<name>RepositoryProvider).getAll();
  }
}
\`\`\`

### 8. Presentation Layer — Page and Widgets

Create pages in \`lib/features/<name>/presentation/pages/\` using \`ConsumerWidget\`:

\`\`\`dart
class <Name>Page extends ConsumerWidget {
  const <Name>Page({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final items = ref.watch(<name>ListProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('<Name>')),
      body: items.when(
        data: (list) => ListView.builder(
          itemCount: list.length,
          itemBuilder: (context, i) => ListTile(title: Text(list[i].id)),
        ),
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Error: $e')),
      ),
    );
  }
}
\`\`\`

### 9. Add Route to app_router.dart

\`\`\`dart
@TypedGoRoute<<Name>Route>(path: '/<name>')
@immutable
class <Name>Route extends GoRouteData {
  const <Name>Route();

  @override
  Widget build(BuildContext context, GoRouterState state) => const <Name>Page();
}
\`\`\`

Run code generation again after adding routes:
\`\`\`bash
dart run build_runner build --delete-conflicting-outputs
\`\`\`
${routerNote}${i18nNote}
### 10. Write Tests

Create tests in \`test/features/<name>/\`:

\`\`\`bash
mkdir -p test/features/<name>/{domain,data,presentation}
\`\`\`

Run all tests to verify:
\`\`\`bash
flutter test
\`\`\`
`;
}

function generateAnalyzeCommand(): string {
  return `# Analyze

Run Flutter static analysis and interpret the results.

## Run Analysis

\`\`\`bash
flutter analyze
\`\`\`

## Interpret Results

### Error Severity Levels

| Level | Meaning | Action Required |
|-------|---------|-----------------|
| \`error\` | Code will not compile or has critical issues | Must fix before building |
| \`warning\` | Potential runtime issues or bad practices | Should fix |
| \`info\` | Style suggestions | Fix when convenient |

### Common Errors and Fixes

**Missing return type**
\`\`\`
info - lib/foo.dart:5:3 - Missing return type annotation
\`\`\`
Fix: Add explicit return type to the function.

**Unused import**
\`\`\`
info - lib/foo.dart:1:1 - Unused import: 'package:...'
\`\`\`
Fix: Remove the unused import line.

**Undefined name**
\`\`\`
error - lib/foo.dart:10:5 - Undefined name 'MyClass'
\`\`\`
Fix: Add the missing import or check for typos.

**Dead code**
\`\`\`
hint - lib/foo.dart:20:5 - Dead code
\`\`\`
Fix: Remove unreachable code after a return statement.

**Type mismatch**
\`\`\`
error - lib/foo.dart:15:12 - A value of type 'String' can't be assigned to a variable of type 'int'
\`\`\`
Fix: Ensure type consistency, add explicit casts if necessary.

**Missing await**
\`\`\`
warning - lib/foo.dart:8:3 - Missing 'await' before 'Future'
\`\`\`
Fix: Add \`await\` to the async call.

## Fix All Auto-fixable Issues

\`\`\`bash
dart fix --apply
\`\`\`

## Format Code

\`\`\`bash
dart format .
\`\`\`

## Run Tests After Fixing

\`\`\`bash
flutter test
\`\`\`

## Full Quality Check

\`\`\`bash
flutter analyze && flutter test && dart format --set-exit-if-changed .
\`\`\`
`;
}

function generateStartTeamCommand(context: ProjectContext): string {
  const sddNote = context.claude?.agentTeams
    ? `
## SDD Pipeline (recommended for 3+ file features)

Before spawning the team, use the SDD pipeline to produce a structured spec and plan:

1. \`/specify\` — Interview funnel to produce \`specs/<feature>.md\`
2. \`/plan\` — Analyze spec and codebase to produce \`specs/<feature>.plan.md\`
3. \`/tasks\` — Generate PRD stories with dependencies in \`prd.json\`

Then run \`/start-team\` to execute the stories with the agent team.

`
    : '';

  return `# Start Team Sprint

Orchestrate a Claude Code Agent Team sprint from \`prd.json\`.

## Pre-Flight Checks

Before starting, verify the project is in a clean state:

\`\`\`bash
git status                    # Working tree must be clean
flutter analyze               # Zero errors/warnings
flutter test                  # All tests pass
\`\`\`
${sddNote}
## Step 1 — Read prd.json

Load \`prd.json\` and identify incomplete stories (\`passes: false\`). Group by phase, pick the next batch of stories to implement.

## Step 2 — Create Team

Create a team named \`flutter-sprint\` using TeamCreate. Create TaskCreate entries for each story.

## Step 3 — Spawn Agents

Spawn 4 agents with the following roles and models:

| Agent | Model | Role | File Ownership |
|-------|-------|------|----------------|
| **architect** | opus | Designs implementation approach, identifies files and interfaces | \`specs/\`, \`docs/\` |
| **builder** | opus | Writes failing tests (RED), then minimal code to pass (GREEN) | \`lib/\`, \`test/\` |
| **tester** | sonnet | Validates implementation, runs quality gates, checks coverage | \`test/\`, quality reports |
| **reviewer** | sonnet | Reviews code for Clean Architecture compliance and best practices | Review comments only |

## Step 4 — TDD Flow Per Story

For each story, follow this orchestration:

1. **Architect** designs the implementation spec with file list and test cases
2. **Builder** writes failing tests (RED phase), then implements minimal code (GREEN phase)
3. **Tester** runs \`flutter analyze && flutter test\`, checks coverage
4. **Reviewer** reviews code for architecture compliance

## Step 5 — Error Recovery Protocol

If a step fails, follow the 4-tier escalation:
1. **Self-Correction**: Re-read error, check last changes, run diagnostics
2. **AI-to-AI**: Ask another agent for a fresh perspective
3. **Human-Augmented**: Ask the user for domain context
4. **Full Handoff**: Document what was tried and hand to user

## Step 6 — Commit + Push

After each story passes all quality gates:

\`\`\`bash
git add <changed-files>
git commit -m "feat: [Story-ID] - Story title"
git push
\`\`\`

Mark the story as \`passes: true\` in \`prd.json\`.

## Step 7 — Repeat

Continue with the next story until the sprint batch is complete. Shut down agents when done.
`;
}

function generateSpecifyCommand(): string {
  return `---
model: opus
---
# Specify Feature

Interview funnel to produce a structured feature specification.

## Interview Steps

### 1. Problem Statement
Ask: "What problem does this feature solve? Who benefits?"

### 2. Scope Definition
Ask: "What is in scope and what is explicitly out of scope?"

### 3. Data Model
Ask: "What are the core entities? What fields do they have? What are the relationships?"
Produce freezed entity definitions.

### 4. User Interface
Ask: "What screens/pages are needed? What user interactions?"
List pages with their navigation paths.

### 5. API Contracts
Ask: "What API endpoints are needed? What are request/response shapes?"
Define repository interfaces.

### 6. Edge Cases
Ask: "What happens when: network fails, data is empty, user cancels, input is invalid?"

### 7. Security Considerations
Ask: "Does this feature handle sensitive data? Authentication required? Input validation needs?"

### 8. Constraints
Ask: "Any performance requirements? Offline support needed? Accessibility requirements?"

## Output

Save the spec to \`specs/<feature-name>.md\` using the spec template from skills.
Include all answers structured into the template sections.
`;
}

function generatePlanCommand(): string {
  return `---
model: opus
---
# Plan Feature Implementation

Read a feature spec and produce an implementation plan following Clean Architecture.

## Input

Read the spec from \`specs/<feature-name>.md\`.

## Analysis Steps

### 1. Analyze Current Codebase
- Identify existing patterns and conventions in \`lib/\`
- Check for reusable providers, entities, or utilities
- Review \`pubspec.yaml\` for available packages

### 2. Plan Domain Layer (Phase 1)
- List all entities with freezed annotations
- Define repository interfaces
- Design use cases (single-responsibility)

### 3. Plan Data Layer (Phase 2)
- Design data models with serialization
- Plan data sources (remote, local)
- Map repository implementations

### 4. Plan Presentation Layer (Phase 3)
- Design providers (AsyncNotifier pattern)
- Plan pages and their routes
- Identify reusable widgets

### 5. Plan Integration (Phase 4)
- Route registration in \`app_router.dart\`
- Code generation requirements
- Integration test scenarios

## Output

Save the plan to \`specs/<feature-name>.plan.md\` using the plan template from skills.
Include file ownership boundaries and complexity estimates for each file.
`;
}

function generateTasksCommand(): string {
  return `---
model: sonnet
---
# Generate Tasks from Plan

Read a feature plan and generate PRD stories for \`prd.json\`.

## Input

Read the plan from \`specs/<feature-name>.plan.md\`.

## Steps

### 1. Break Plan into Stories
- Each story should be completable in a single TDD cycle
- One story per layer or sub-feature
- Include acceptance criteria with testable predicates

### 2. Define Dependencies
- Domain stories have no dependencies
- Data stories depend on their domain stories
- Presentation stories depend on domain stories
- Integration stories depend on data and presentation

### 3. Estimate Complexity
- 1-2 SP: Single file, straightforward
- 3 SP: 2-3 files, moderate logic
- 5 SP: Multiple files, complex logic
- 8 SP: Cross-cutting, architectural

### 4. Write to prd.json
Add stories with:
- Unique IDs following existing pattern
- Phase matching the plan phases
- Priority based on dependency order (P0 for domain, P1 for data, P2 for presentation)
- \`passes: false\`

### 5. Create Tasks
Use TaskCreate to generate task entries with \`blockedBy\` dependencies matching the story dependencies.

## Output

Report the number of stories created and their dependency graph.
`;
}
