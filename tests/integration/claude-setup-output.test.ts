import { readFile, readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { runClaudeSetup } from '../../src/claude-setup/setup-orchestrator.js';
import { makeTestContext } from '../helpers/context-factory.js';
import { useTempDir } from '../helpers/temp-dir.js';

async function fileExists(p: string): Promise<boolean> {
  try {
    const s = await stat(p);
    return s.isFile();
  } catch {
    return false;
  }
}

async function dirExists(p: string): Promise<boolean> {
  try {
    const s = await stat(p);
    return s.isDirectory();
  } catch {
    return false;
  }
}

describe('Claude setup output integration', () => {
  const tmp = useTempDir('claude-setup-integration-');

  it('minimal preset generates only CLAUDE.md + rules (no agents, hooks, skills, commands, mcp)', async () => {
    const ctx = makeTestContext({
      claude: { enabled: true, agentTeams: false, preset: 'minimal' },
    });
    await runClaudeSetup(ctx, tmp.path);

    expect(await fileExists(join(tmp.path, 'CLAUDE.md'))).toBe(true);
    expect(await dirExists(join(tmp.path, '.claude', 'rules'))).toBe(true);

    expect(await dirExists(join(tmp.path, '.claude', 'agents'))).toBe(false);
    expect(await dirExists(join(tmp.path, '.claude', 'hooks'))).toBe(false);
    expect(await dirExists(join(tmp.path, '.claude', 'skills'))).toBe(false);
    expect(await dirExists(join(tmp.path, '.claude', 'commands'))).toBe(false);
    expect(await fileExists(join(tmp.path, '.mcp.json'))).toBe(false);
  });

  it('standard preset generates CLAUDE.md, rules, agents, hooks, skills, commands — but no .mcp.json', async () => {
    const ctx = makeTestContext({
      claude: { enabled: true, agentTeams: false, preset: 'standard' },
    });
    await runClaudeSetup(ctx, tmp.path);

    expect(await fileExists(join(tmp.path, 'CLAUDE.md'))).toBe(true);
    expect(await dirExists(join(tmp.path, '.claude', 'rules'))).toBe(true);
    expect(await dirExists(join(tmp.path, '.claude', 'agents'))).toBe(true);
    expect(await dirExists(join(tmp.path, '.claude', 'hooks'))).toBe(true);
    expect(await dirExists(join(tmp.path, '.claude', 'skills'))).toBe(true);
    expect(await dirExists(join(tmp.path, '.claude', 'commands'))).toBe(true);
    expect(await fileExists(join(tmp.path, '.mcp.json'))).toBe(false);
  });

  it('full preset generates all outputs including .mcp.json', async () => {
    const ctx = makeTestContext({
      claude: { enabled: true, agentTeams: false, preset: 'full' },
    });
    await runClaudeSetup(ctx, tmp.path);

    expect(await fileExists(join(tmp.path, 'CLAUDE.md'))).toBe(true);
    expect(await dirExists(join(tmp.path, '.claude', 'rules'))).toBe(true);
    expect(await dirExists(join(tmp.path, '.claude', 'agents'))).toBe(true);
    expect(await dirExists(join(tmp.path, '.claude', 'hooks'))).toBe(true);
    expect(await dirExists(join(tmp.path, '.claude', 'skills'))).toBe(true);
    expect(await dirExists(join(tmp.path, '.claude', 'commands'))).toBe(true);
    expect(await fileExists(join(tmp.path, '.mcp.json'))).toBe(true);
  });

  it('full module set generates all conditional rule files (auth, api, database, i18n)', async () => {
    const ctx = makeTestContext({
      claude: { enabled: true, agentTeams: false, preset: 'standard' },
      modules: {
        auth: { provider: 'firebase' },
        api: { baseUrl: 'https://api.example.com' },
        database: { engine: 'drift' },
        i18n: { defaultLocale: 'en', supportedLocales: ['en', 'de'] },
        theme: false,
        push: false,
        analytics: false,
        cicd: false,
        deepLinking: false,
      },
    });
    await runClaudeSetup(ctx, tmp.path);

    const rulesDir = join(tmp.path, '.claude', 'rules');
    expect(await fileExists(join(rulesDir, 'auth.md'))).toBe(true);
    expect(await fileExists(join(rulesDir, 'api.md'))).toBe(true);
    expect(await fileExists(join(rulesDir, 'database.md'))).toBe(true);
    expect(await fileExists(join(rulesDir, 'i18n.md'))).toBe(true);
  });

  it('no modules generates only the 9 core rule files without conditional extras', async () => {
    const ctx = makeTestContext({
      claude: { enabled: true, agentTeams: false, preset: 'standard' },
    });
    await runClaudeSetup(ctx, tmp.path);

    const rulesDir = join(tmp.path, '.claude', 'rules');
    const files = await readdir(rulesDir);

    const coreFiles = ['architecture.md', 'riverpod.md', 'go-router.md', 'testing.md', 'security.md', 'git-workflow.md', 'code-quality.md', 'error-recovery.md', 'context-management.md'];
    for (const f of coreFiles) {
      expect(files).toContain(f);
    }
    expect(files).not.toContain('auth.md');
    expect(files).not.toContain('api.md');
    expect(files).not.toContain('database.md');
    expect(files).not.toContain('i18n.md');
    expect(files.length).toBe(9);
  });

  it('CLAUDE.md contains at most 100 lines', async () => {
    const ctx = makeTestContext({
      claude: { enabled: true, agentTeams: false, preset: 'minimal' },
    });
    await runClaudeSetup(ctx, tmp.path);

    const content = await readFile(join(tmp.path, 'CLAUDE.md'), 'utf-8');
    const lineCount = content.split('\n').length;
    expect(lineCount).toBeLessThanOrEqual(100);
  });

  it('generates exactly 3 agent definition files in .claude/agents/', async () => {
    const ctx = makeTestContext({
      claude: { enabled: true, agentTeams: false, preset: 'standard' },
    });
    await runClaudeSetup(ctx, tmp.path);

    const agentsDir = join(tmp.path, '.claude', 'agents');
    const files = await readdir(agentsDir);

    expect(files.length).toBe(4);
    expect(files).toContain('flutter-architect.md');
    expect(files).toContain('flutter-builder.md');
    expect(files).toContain('flutter-tester.md');
    expect(files).toContain('flutter-reviewer.md');
  });

  it('hook shell scripts start with a shebang line', async () => {
    const ctx = makeTestContext({
      claude: { enabled: true, agentTeams: false, preset: 'standard' },
    });
    await runClaudeSetup(ctx, tmp.path);

    const hooksDir = join(tmp.path, '.claude', 'hooks');
    for (const script of ['block-dangerous.sh', 'format-dart.sh']) {
      const content = await readFile(join(hooksDir, script), 'utf-8');
      expect(content.startsWith('#!/')).toBe(true);
    }
  });

  it('prd.json conforms to v2 format with version 2.0.0, storyPoints, and acceptanceCriteria objects', async () => {
    const ctx = makeTestContext({
      claude: { enabled: true, agentTeams: false, preset: 'standard' },
    });
    await runClaudeSetup(ctx, tmp.path);

    const prdContent = await readFile(join(tmp.path, 'prd.json'), 'utf-8');
    const prd = JSON.parse(prdContent) as {
      version: string;
      stories: Array<{
        storyPoints: unknown;
        acceptanceCriteria: Array<{ description: string }>;
      }>;
    };

    expect(prd.version).toBe('2.0.0');
    expect(Array.isArray(prd.stories)).toBe(true);
    expect(prd.stories.length).toBeGreaterThan(0);

    for (const story of prd.stories) {
      expect(typeof story.storyPoints).toBe('number');
      expect(Array.isArray(story.acceptanceCriteria)).toBe(true);
      expect(story.acceptanceCriteria.length).toBeGreaterThan(0);
      for (const ac of story.acceptanceCriteria) {
        expect(typeof ac.description).toBe('string');
      }
    }
  });

  it('each core rule file starts with YAML frontmatter containing paths:', async () => {
    const ctx = makeTestContext({
      claude: { enabled: true, agentTeams: false, preset: 'minimal' },
    });
    await runClaudeSetup(ctx, tmp.path);

    const rulesDir = join(tmp.path, '.claude', 'rules');
    const coreFiles = ['architecture.md', 'riverpod.md', 'go-router.md', 'testing.md', 'security.md', 'git-workflow.md', 'code-quality.md'];

    for (const file of coreFiles) {
      const content = await readFile(join(rulesDir, file), 'utf-8');
      expect(content.startsWith('---')).toBe(true);
      expect(content).toContain('paths:');
    }
  });
});
