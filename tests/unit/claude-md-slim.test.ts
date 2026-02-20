import { generateClaudeMd } from '../../src/claude-setup/claude-md-generator.js';
import { makeTestContext } from '../helpers/context-factory.js';

const ALL_MODULES_CTX = makeTestContext({
  projectName: 'full_app',
  description: 'A fully-featured Flutter app',
  platforms: ['android', 'ios', 'web'],
  modules: {
    auth: { provider: 'firebase' },
    api: { baseUrl: 'https://api.example.com' },
    database: { engine: 'drift' },
    i18n: { defaultLocale: 'en', supportedLocales: ['en', 'de'] },
    theme: { seedColor: '#6750A4', darkMode: true },
    push: { provider: 'firebase' },
    analytics: { enabled: true },
    cicd: { provider: 'github' },
    deepLinking: { scheme: 'fullapp', host: 'full-app.com' },
  },
  claude: { enabled: true, agentTeams: true },
});

describe('generateClaudeMd slim format', () => {
  it('is <= 100 lines even with all modules enabled', () => {
    const result = generateClaudeMd(ALL_MODULES_CTX);
    const lineCount = result.split('\n').length;
    expect(lineCount).toBeLessThanOrEqual(100);
  });

  it('is <= 100 lines for minimal context', () => {
    const result = generateClaudeMd(makeTestContext());
    const lineCount = result.split('\n').length;
    expect(lineCount).toBeLessThanOrEqual(100);
  });

  it('contains @-imports for all 5 core rule files', () => {
    const result = generateClaudeMd(makeTestContext());
    expect(result).toContain('@.claude/rules/architecture.md');
    expect(result).toContain('@.claude/rules/riverpod.md');
    expect(result).toContain('@.claude/rules/go-router.md');
    expect(result).toContain('@.claude/rules/testing.md');
    expect(result).toContain('@.claude/rules/security.md');
  });

  it('includes @-import for enabled module but not for disabled module', () => {
    const ctx = makeTestContext({
      modules: {
        ...makeTestContext().modules,
        auth: { provider: 'firebase' },
      },
    });
    const result = generateClaudeMd(ctx);
    expect(result).toContain('@.claude/rules/auth.md');
    expect(result).not.toContain('@.claude/rules/api.md');
    expect(result).not.toContain('@.claude/rules/database.md');
  });

  it('includes @-imports for all enabled modules', () => {
    const result = generateClaudeMd(ALL_MODULES_CTX);
    expect(result).toContain('@.claude/rules/auth.md');
    expect(result).toContain('@.claude/rules/api.md');
    expect(result).toContain('@.claude/rules/database.md');
    expect(result).toContain('@.claude/rules/i18n.md');
    expect(result).toContain('@.claude/rules/theme.md');
    expect(result).toContain('@.claude/rules/push.md');
    expect(result).toContain('@.claude/rules/analytics.md');
    expect(result).toContain('@.claude/rules/cicd.md');
    expect(result).toContain('@.claude/rules/deep-linking.md');
  });

  it('contains ## Build Commands and ## Quality Gates sections', () => {
    const result = generateClaudeMd(makeTestContext());
    expect(result).toContain('## Build Commands');
    expect(result).toContain('## Quality Gates');
    expect(result).toContain('flutter pub get');
    expect(result).toContain('flutter analyze');
    expect(result).toContain('flutter test');
  });

  it('does not contain verbose inline architecture or riverpod content', () => {
    const result = generateClaudeMd(makeTestContext());
    expect(result).not.toContain('## Architecture Rules');
    expect(result).not.toContain('## Riverpod Patterns');
    expect(result).not.toContain('## go_router Patterns');
    expect(result).not.toContain('## Tech Stack');
  });

  it('does not contain inline module sections', () => {
    const result = generateClaudeMd(ALL_MODULES_CTX);
    expect(result).not.toContain('## Auth Module');
    expect(result).not.toContain('## API Module');
    expect(result).not.toContain('## Database Module');
  });
});
