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

  await Promise.all([
    fs.writeFile(path.join(commandsDir, 'add-feature.md'), generateAddFeatureCommand(context)),
    fs.writeFile(path.join(commandsDir, 'analyze.md'), generateAnalyzeCommand()),
  ]);
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

  return `# Add Feature

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
