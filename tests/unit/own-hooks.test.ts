import { readFile, access } from 'node:fs/promises';
import { join } from 'node:path';

const ROOT = process.cwd();
const HOOKS_DIR = join(ROOT, '.claude', 'hooks');
const COMMANDS_DIR = join(ROOT, '.claude', 'commands');

describe('own hooks and commands', () => {
  describe('quality-gate-task.sh', () => {
    let content: string;

    beforeAll(async () => {
      content = await readFile(join(HOOKS_DIR, 'quality-gate-task.sh'), 'utf-8');
    });

    it('exists and is not empty', () => {
      expect(content.length).toBeGreaterThan(0);
    });

    it('is a bash script', () => {
      expect(content).toMatch(/^#!\/usr\/bin\/env bash/);
    });

    it('exits with code 2 to block non-compliant completions', () => {
      expect(content).toContain('exit 2');
    });

    it('runs npm run quality', () => {
      expect(content).toContain('npm run quality');
    });
  });

  describe('precompact-preserve.sh', () => {
    let content: string;

    beforeAll(async () => {
      content = await readFile(join(HOOKS_DIR, 'precompact-preserve.sh'), 'utf-8');
    });

    it('exists and is not empty', () => {
      expect(content.length).toBeGreaterThan(0);
    });

    it('is a bash script', () => {
      expect(content).toMatch(/^#!\/usr\/bin\/env bash/);
    });

    it('preserves modified files info', () => {
      expect(content).toMatch(/git\s+(status|diff)/);
    });

    it('preserves test results', () => {
      expect(content).toContain('npm test');
    });

    it('preserves prd.json status', () => {
      expect(content).toContain('prd.json');
    });
  });

  describe('settings.json', () => {
    let settings: Record<string, unknown>;

    beforeAll(async () => {
      const content = await readFile(join(ROOT, '.claude', 'settings.json'), 'utf-8');
      settings = JSON.parse(content);
    });

    it('has CLAUDE_AUTOCOMPACT_PCT_OVERRIDE env var', () => {
      expect(settings).toHaveProperty('env');
      const env = settings.env as Record<string, string>;
      expect(env).toHaveProperty('CLAUDE_AUTOCOMPACT_PCT_OVERRIDE', '70');
    });

    it('has PreCompact hook for precompact-preserve.sh', () => {
      const hooks = settings.hooks as Record<string, unknown[]>;
      expect(hooks).toHaveProperty('PreCompact');
      const preCompact = hooks.PreCompact as Array<{ hooks: Array<{ command: string }> }>;
      const commands = preCompact.flatMap(h => h.hooks.map(hh => hh.command));
      expect(commands).toContain('.claude/hooks/precompact-preserve.sh');
    });
  });

  describe('start-team.md', () => {
    let content: string;

    beforeAll(async () => {
      content = await readFile(join(COMMANDS_DIR, 'start-team.md'), 'utf-8');
    });

    it('contains file ownership table', () => {
      expect(content).toMatch(/[Ff]ile [Oo]wnership/);
    });

    it('contains 3-tier hierarchy', () => {
      expect(content).toMatch(/[Hh]ierarchy|[Tt]ier/);
    });

    it('contains error recovery section', () => {
      expect(content).toMatch(/## Error Recovery/);
    });
  });
});
