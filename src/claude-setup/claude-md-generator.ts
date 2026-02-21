import type { ProjectContext } from '../core/context.js';

/**
 * Generates a slim CLAUDE.md (~90 lines) for a scaffolded Flutter project.
 * Detailed rules are referenced via @-imports to .claude/rules/ files.
 */
export function generateClaudeMd(context: ProjectContext): string {
  const sections: string[] = [
    generateHeader(context),
    generateRules(context),
    generateBuildCommands(),
    generateQualityGates(),
    generateSecurity(),
    generateModelPolicy(),
    generateDevelopmentWorkflow(context),
    generateKeyPaths(),
  ];

  if (context.claude.agentTeams) {
    sections.push(generateAgentTeams());
  }

  return sections.join('\n\n');
}

function generateHeader(context: ProjectContext): string {
  const lines = [
    `# CLAUDE.md - ${context.projectName}`,
    '',
    '## Project Overview',
    '',
    `**${context.projectName}** — Flutter app with Clean Architecture, Riverpod, go_router.`,
  ];

  if (context.description) {
    lines.push('', context.description);
  }

  const enabledModules = getEnabledModuleNames(context);
  if (enabledModules.length > 0) {
    lines.push('', `**Active modules:** ${enabledModules.join(', ')}`);
  }

  lines.push(`**Platforms:** ${context.platforms.join(', ')}`);

  return lines.join('\n');
}

function generateRules(context: ProjectContext): string {
  const imports = [
    '## Rules',
    '',
    '@.claude/rules/architecture.md',
    '@.claude/rules/riverpod.md',
    '@.claude/rules/go-router.md',
    '@.claude/rules/testing.md',
    '@.claude/rules/security.md',
    '@.claude/rules/git-workflow.md',
    '@.claude/rules/code-quality.md',
    '@.claude/rules/error-recovery.md',
    '@.claude/rules/context-management.md',
  ];

  if (context.modules.auth) imports.push('@.claude/rules/auth.md');
  if (context.modules.api) imports.push('@.claude/rules/api.md');
  if (context.modules.database) imports.push('@.claude/rules/database.md');
  if (context.modules.i18n) imports.push('@.claude/rules/i18n.md');
  if (context.modules.theme) imports.push('@.claude/rules/theme.md');
  if (context.modules.push) imports.push('@.claude/rules/push.md');
  if (context.modules.analytics) imports.push('@.claude/rules/analytics.md');
  if (context.modules.cicd) imports.push('@.claude/rules/cicd.md');
  if (context.modules.deepLinking) imports.push('@.claude/rules/deep-linking.md');

  return imports.join('\n');
}

function generateBuildCommands(): string {
  return `## Build Commands

\`\`\`bash
flutter pub get
flutter run
dart run build_runner build
flutter test
flutter analyze
\`\`\``;
}

function generateQualityGates(): string {
  return `## Quality Gates

**IMPORTANT:** All gates MUST pass before every commit. NEVER skip these checks.

- \`flutter analyze\` — zero warnings
- \`flutter test\` — all pass
- \`dart format --set-exit-if-changed .\` — formatted`;
}

function generateSecurity(): string {
  return `## Security

- **NEVER** hardcode secrets, API keys, or credentials in source code
- **NEVER** log PII (personal identifiable information) or sensitive data
- Validate ALL external input — user input, API responses, deep link parameters
- Use \`flutter_secure_storage\` for sensitive data, not \`SharedPreferences\`
- Always use HTTPS for network requests`;
}

function generateModelPolicy(): string {
  return `## Model Usage Policy

- **Opus**: Architecture, planning, non-trivial implementation. Prefer when in doubt.
- **Sonnet**: Simple, well-defined tasks with clear requirements.
- **Haiku**: Trivial tasks only (formatting, simple scans).`;
}

function generateDevelopmentWorkflow(context: ProjectContext): string {
  const lines = [
    '## Development Workflow',
    '',
  ];

  if (context.claude.agentTeams) {
    lines.push(
      '### SDD Pipeline (for new features)',
      '`/specify` → `/plan` → `/tasks` → `/start-team`',
      'Use Spec-Driven Development for features with 3+ files across multiple layers.',
      '',
    );
  }

  lines.push(
    '- Commit: `feat: [StoryID] - description`',
    '- Files: `snake_case.dart`',
    '- Tests: `<source>_test.dart`',
  );

  return lines.join('\n');
}

function generateKeyPaths(): string {
  return `## Key Paths

- \`lib/core/router/app_router.dart\`
- \`lib/core/providers/app_providers.dart\`
- \`pubspec.yaml\`
- \`prd.json\``;
}

function generateAgentTeams(): string {
  return `## Agent Teams Workflow

Stories in \`prd.json\`. Enable: \`CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1\`.
Roles: architect, builder, tester, reviewer.
Commit: \`feat: [StoryID] - description\`.`;
}

function getEnabledModuleNames(context: ProjectContext): string[] {
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
