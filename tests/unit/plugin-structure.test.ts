import { readFile, readdir, access } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const pluginDir = join(__dirname, '..', '..', 'claude-plugin');

async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

describe('Claude Code Plugin Structure', () => {
  describe('plugin.json', () => {
    let pluginJson: Record<string, unknown>;

    beforeAll(async () => {
      const raw = await readFile(join(pluginDir, '.claude-plugin', 'plugin.json'), 'utf-8');
      pluginJson = JSON.parse(raw);
    });

    it('has required metadata fields', () => {
      expect(pluginJson.name).toBe('maxsim-flutter');
      expect(pluginJson.version).toBe('0.1.0');
      expect(pluginJson.description).toBeDefined();
      expect(typeof pluginJson.description).toBe('string');
      expect(pluginJson.author).toBeDefined();
    });

    it('has valid description', () => {
      expect(pluginJson.description).toContain('Flutter');
      expect(pluginJson.description).toContain('Clean Architecture');
    });

    it('has keywords', () => {
      const keywords = pluginJson.keywords as string[];
      expect(Array.isArray(keywords)).toBe(true);
      expect(keywords).toContain('flutter');
      expect(keywords).toContain('clean-architecture');
      expect(keywords).toContain('riverpod');
    });

    it('defines exactly 3 commands', () => {
      const commands = pluginJson.commands as Array<Record<string, string>>;
      expect(commands).toHaveLength(3);
    });

    it('commands reference existing files', async () => {
      const commands = pluginJson.commands as Array<Record<string, string>>;
      for (const cmd of commands) {
        expect(cmd.name).toBeDefined();
        expect(cmd.description).toBeDefined();
        expect(cmd.file).toBeDefined();
        const filePath = join(pluginDir, cmd.file);
        expect(await fileExists(filePath)).toBe(true);
      }
    });

    it('has flutter-create command', () => {
      const commands = pluginJson.commands as Array<Record<string, string>>;
      const create = commands.find(c => c.name === 'flutter-create');
      expect(create).toBeDefined();
      expect(create!.file).toBe('commands/flutter-create.md');
    });

    it('has flutter-add command', () => {
      const commands = pluginJson.commands as Array<Record<string, string>>;
      const add = commands.find(c => c.name === 'flutter-add');
      expect(add).toBeDefined();
      expect(add!.file).toBe('commands/flutter-add.md');
    });

    it('has flutter-migrate command', () => {
      const commands = pluginJson.commands as Array<Record<string, string>>;
      const migrate = commands.find(c => c.name === 'flutter-migrate');
      expect(migrate).toBeDefined();
      expect(migrate!.file).toBe('commands/flutter-migrate.md');
    });

    it('defines exactly 1 skill', () => {
      const skills = pluginJson.skills as Array<Record<string, string>>;
      expect(skills).toHaveLength(1);
    });

    it('skill references existing directory', async () => {
      const skills = pluginJson.skills as Array<Record<string, string>>;
      const skill = skills[0];
      expect(skill.name).toBe('flutter-scaffolding');
      expect(skill.directory).toBe('skills/flutter-scaffolding');
      const dirPath = join(pluginDir, skill.directory);
      expect(await fileExists(dirPath)).toBe(true);
    });

    it('defines exactly 1 agent', () => {
      const agents = pluginJson.agents as Array<Record<string, string>>;
      expect(agents).toHaveLength(1);
    });

    it('agent references existing file', async () => {
      const agents = pluginJson.agents as Array<Record<string, string>>;
      const agent = agents[0];
      expect(agent.name).toBe('flutter-setup-agent');
      expect(agent.file).toBe('agents/flutter-setup-agent.md');
      const filePath = join(pluginDir, agent.file);
      expect(await fileExists(filePath)).toBe(true);
    });
  });

  describe('command files', () => {
    it('flutter-create.md wraps create CLI command', async () => {
      const content = await readFile(join(pluginDir, 'commands', 'flutter-create.md'), 'utf-8');
      expect(content).toContain('npx maxsim-flutter create');
      expect(content).toContain('--yes');
      expect(content).toContain('--modules');
      expect(content).toContain('--dry-run');
    });

    it('flutter-create.md has YAML frontmatter', async () => {
      const content = await readFile(join(pluginDir, 'commands', 'flutter-create.md'), 'utf-8');
      expect(content).toMatch(/^---\n/);
      expect(content).toContain('name: flutter-create');
      expect(content).toContain('description:');
    });

    it('flutter-add.md wraps add CLI command', async () => {
      const content = await readFile(join(pluginDir, 'commands', 'flutter-add.md'), 'utf-8');
      expect(content).toContain('npx maxsim-flutter add');
      expect(content).toContain('--dry-run');
      expect(content).toContain('auth');
      expect(content).toContain('api');
      expect(content).toContain('database');
      expect(content).toContain('theme');
    });

    it('flutter-add.md lists all 9 modules', async () => {
      const content = await readFile(join(pluginDir, 'commands', 'flutter-add.md'), 'utf-8');
      const modules = ['auth', 'api', 'database', 'i18n', 'theme', 'push', 'analytics', 'cicd', 'deep-linking'];
      for (const mod of modules) {
        expect(content).toContain(mod);
      }
    });

    it('flutter-migrate.md wraps migrate CLI command', async () => {
      const content = await readFile(join(pluginDir, 'commands', 'flutter-migrate.md'), 'utf-8');
      expect(content).toContain('npx maxsim-flutter migrate');
      expect(content).toContain('--analysis-only');
      expect(content).toContain('--dry-run');
      expect(content).toContain('non-destructive');
    });
  });

  describe('flutter-scaffolding skill', () => {
    let skillContent: string;

    beforeAll(async () => {
      skillContent = await readFile(
        join(pluginDir, 'skills', 'flutter-scaffolding', 'SKILL.md'),
        'utf-8'
      );
    });

    it('has YAML frontmatter', () => {
      expect(skillContent).toMatch(/^---\n/);
      expect(skillContent).toContain('name: flutter-scaffolding');
    });

    it('is not user-invocable', () => {
      expect(skillContent).toContain('user-invocable: false');
    });

    it('documents Clean Architecture pattern', () => {
      expect(skillContent).toContain('Clean Architecture');
      expect(skillContent).toContain('domain');
      expect(skillContent).toContain('data');
      expect(skillContent).toContain('presentation');
    });

    it('documents Riverpod state management', () => {
      expect(skillContent).toContain('Riverpod');
      expect(skillContent).toContain('ProviderScope');
    });

    it('documents go_router', () => {
      expect(skillContent).toContain('go_router');
      expect(skillContent).toContain('GoRouter');
    });

    it('provides context for all 9 modules', () => {
      const modules = ['auth', 'api', 'database', 'i18n', 'theme', 'push', 'analytics', 'cicd', 'deep-linking'];
      for (const mod of modules) {
        expect(skillContent.toLowerCase()).toContain(mod);
      }
    });

    it('lists module packages and dependencies', () => {
      expect(skillContent).toContain('dio');
      expect(skillContent).toContain('firebase_auth');
      expect(skillContent).toContain('supabase_flutter');
      expect(skillContent).toContain('drift');
      expect(skillContent).toContain('google_fonts');
    });

    it('documents CLI commands', () => {
      expect(skillContent).toContain('npx maxsim-flutter create');
      expect(skillContent).toContain('npx maxsim-flutter add');
      expect(skillContent).toContain('npx maxsim-flutter migrate');
    });

    it('documents Claude Code integration', () => {
      expect(skillContent).toContain('CLAUDE.md');
      expect(skillContent).toContain('Agents');
      expect(skillContent).toContain('Skills');
    });
  });

  describe('flutter-setup-agent', () => {
    let agentContent: string;

    beforeAll(async () => {
      agentContent = await readFile(
        join(pluginDir, 'agents', 'flutter-setup-agent.md'),
        'utf-8'
      );
    });

    it('has YAML frontmatter with correct model', () => {
      expect(agentContent).toMatch(/^---\n/);
      expect(agentContent).toContain('name: flutter-setup-agent');
      expect(agentContent).toContain('model: sonnet');
    });

    it('has required tools', () => {
      expect(agentContent).toContain('Bash');
      expect(agentContent).toContain('Read');
      expect(agentContent).toContain('Write');
    });

    it('guides users through setup', () => {
      expect(agentContent).toContain('Understand the Project');
      expect(agentContent).toContain('Recommend Modules');
      expect(agentContent).toContain('Configure');
      expect(agentContent).toContain('Execute');
    });

    it('includes module recommendations', () => {
      expect(agentContent).toContain('auth');
      expect(agentContent).toContain('api');
      expect(agentContent).toContain('database');
      expect(agentContent).toContain('theme');
    });

    it('references the CLI command', () => {
      expect(agentContent).toContain('npx maxsim-flutter create');
    });

    it('mentions Agent Teams workflow', () => {
      expect(agentContent).toContain('Agent Teams');
    });
  });

  describe('directory structure', () => {
    it('has .claude-plugin directory', async () => {
      expect(await fileExists(join(pluginDir, '.claude-plugin'))).toBe(true);
    });

    it('has commands directory with 3 files', async () => {
      const files = await readdir(join(pluginDir, 'commands'));
      const mdFiles = files.filter(f => f.endsWith('.md'));
      expect(mdFiles).toHaveLength(3);
      expect(mdFiles).toContain('flutter-create.md');
      expect(mdFiles).toContain('flutter-add.md');
      expect(mdFiles).toContain('flutter-migrate.md');
    });

    it('has skills directory', async () => {
      expect(await fileExists(join(pluginDir, 'skills', 'flutter-scaffolding'))).toBe(true);
      expect(await fileExists(join(pluginDir, 'skills', 'flutter-scaffolding', 'SKILL.md'))).toBe(true);
    });

    it('has agents directory with setup agent', async () => {
      const files = await readdir(join(pluginDir, 'agents'));
      expect(files).toContain('flutter-setup-agent.md');
    });
  });
});
