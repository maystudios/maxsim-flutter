---
paths:
  - "templates/**"
---

# Template Rules

## Handlebars Conventions

- All templates use `.hbs` extension
- Template context always receives a `TemplateContext` object
- Use `{{#if modules.auth}}` for conditional sections
- Pubspec fragments in `pubspec.partial.yaml` per module

## Key Patterns

- `{{projectNamePascal}}` for class names: `MyApp`
- `{{projectName}}` for package refs: `my_app`
- `{{#if modules.auth}}...{{/if}}` for conditional sections
- `{{#ifEquals auth.provider 'firebase'}}` for specific checks

## Generated Code Quality

- Generated Dart code must pass `dart analyze` with zero errors
- Follow Flutter/Dart naming: snake_case files, PascalCase classes
- Use `part` and `part of` for code generation files (.g.dart, .freezed.dart)
- Include proper imports — never leave import guesses
- Extract shared Handlebars partials — never copy template blocks across files
