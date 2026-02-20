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

// ─── P11-007: @-imports for new core rules ──────────────────────────────────

describe('P11-007: @-imports for new core rules', () => {
  it('contains @-import for git-workflow.md', () => {
    const result = generateClaudeMd(makeTestContext());
    expect(result).toContain('@.claude/rules/git-workflow.md');
  });

  it('contains @-import for code-quality.md', () => {
    const result = generateClaudeMd(makeTestContext());
    expect(result).toContain('@.claude/rules/code-quality.md');
  });
});

// ─── P11-007: model usage policy section ────────────────────────────────────

describe('P11-007: model usage policy', () => {
  it('contains Model Usage Policy section', () => {
    const result = generateClaudeMd(makeTestContext());
    expect(result).toContain('Model');
  });

  it('mentions Opus for non-trivial work', () => {
    const result = generateClaudeMd(makeTestContext());
    expect(result).toContain('Opus');
  });

  it('mentions Sonnet for simple tasks', () => {
    const result = generateClaudeMd(makeTestContext());
    expect(result).toContain('Sonnet');
  });

  it('mentions Haiku for trivial/scans', () => {
    const result = generateClaudeMd(makeTestContext());
    expect(result).toContain('Haiku');
  });
});

// ─── P11-007: emphasis markers ──────────────────────────────────────────────

describe('P11-007: emphasis markers for critical rules', () => {
  it('uses IMPORTANT or NEVER or MUST in quality gates', () => {
    const result = generateClaudeMd(makeTestContext());
    expect(result).toMatch(/IMPORTANT|NEVER|MUST/);
  });
});

// ─── P11-007: line count within bounds ──────────────────────────────────────

describe('P11-007: line count stays under 120', () => {
  it('is <= 120 lines with all modules and agentTeams enabled', () => {
    const result = generateClaudeMd(ALL_MODULES_CTX);
    const lineCount = result.split('\n').length;
    expect(lineCount).toBeLessThanOrEqual(120);
  });

  it('is <= 120 lines for minimal context', () => {
    const result = generateClaudeMd(makeTestContext());
    const lineCount = result.split('\n').length;
    expect(lineCount).toBeLessThanOrEqual(120);
  });
});
