import { join, resolve } from 'node:path';
import { readFile } from 'node:fs/promises';
import fsExtra from 'fs-extra';
import { ScaffoldEngine } from '../../src/scaffold/engine.js';
import { makeWritableContext } from '../helpers/context-factory.js';
import { useTempDir } from '../helpers/temp-dir.js';
import { createTestRegistry } from '../helpers/registry-factory.js';

const { pathExists } = fsExtra;
const TEMPLATES_DIR = resolve('templates/core');
const MODULES_DIR = resolve('templates/modules');

describe('README.md generation', () => {
  const tmp = useTempDir('readme-generation-');

  it('generates README.md in every scaffolded project', async () => {
    const engine = new ScaffoldEngine({ templatesDir: TEMPLATES_DIR });
    const context = makeWritableContext(tmp.path);
    await engine.run(context);

    expect(await pathExists(join(tmp.path, 'README.md'))).toBe(true);
  });

  it('README.md contains the correct project name as heading', async () => {
    const engine = new ScaffoldEngine({ templatesDir: TEMPLATES_DIR });
    const context = makeWritableContext(tmp.path);
    await engine.run(context);

    const content = await readFile(join(tmp.path, 'README.md'), 'utf-8');
    expect(content).toContain('# my_app');
  });

  it('README.md contains flutter pub get install instructions', async () => {
    const engine = new ScaffoldEngine({ templatesDir: TEMPLATES_DIR });
    const context = makeWritableContext(tmp.path);
    await engine.run(context);

    const content = await readFile(join(tmp.path, 'README.md'), 'utf-8');
    expect(content).toContain('flutter pub get');
  });

  it('README.md contains flutter run command', async () => {
    const engine = new ScaffoldEngine({ templatesDir: TEMPLATES_DIR });
    const context = makeWritableContext(tmp.path);
    await engine.run(context);

    const content = await readFile(join(tmp.path, 'README.md'), 'utf-8');
    expect(content).toContain('flutter run');
  });
});

describe('README.md Agent Teams section', () => {
  const tmp = useTempDir('readme-agent-teams-');

  it('README.md includes Agent Teams section when claude.agentTeams is true', async () => {
    const engine = new ScaffoldEngine({ templatesDir: TEMPLATES_DIR });
    const context = makeWritableContext(tmp.path, {
      claude: { enabled: true, agentTeams: true },
    });
    await engine.run(context);

    const content = await readFile(join(tmp.path, 'README.md'), 'utf-8');
    expect(content).toContain('Agent Teams');
  });

  it('README.md omits Agent Teams section when claude.agentTeams is false', async () => {
    const engine = new ScaffoldEngine({ templatesDir: TEMPLATES_DIR });
    const context = makeWritableContext(tmp.path);
    await engine.run(context);

    const content = await readFile(join(tmp.path, 'README.md'), 'utf-8');
    expect(content).not.toContain('Agent Teams');
  });
});

describe('README.md enabled modules list', () => {
  const tmp = useTempDir('readme-modules-');

  it('README.md lists auth module when auth is enabled', async () => {
    const engine = new ScaffoldEngine({ templatesDir: TEMPLATES_DIR });
    const context = makeWritableContext(tmp.path, {
      modules: {
        auth: { provider: 'firebase' },
        api: false,
        database: false,
        i18n: false,
        theme: false,
        push: false,
        analytics: false,
        cicd: false,
        deepLinking: false,
      },
    });
    await engine.run(context);

    const content = await readFile(join(tmp.path, 'README.md'), 'utf-8');
    expect(content).toContain('Authentication');
  });

  it('README.md omits auth module when auth is disabled', async () => {
    const engine = new ScaffoldEngine({ templatesDir: TEMPLATES_DIR });
    const context = makeWritableContext(tmp.path);
    await engine.run(context);

    const content = await readFile(join(tmp.path, 'README.md'), 'utf-8');
    expect(content).not.toContain('Authentication');
  });
});

describe('README.md custom project name and description', () => {
  const tmp = useTempDir('readme-project-meta-');

  it('README.md heading reflects a custom project name', async () => {
    const engine = new ScaffoldEngine({ templatesDir: TEMPLATES_DIR });
    const context = makeWritableContext(tmp.path, { projectName: 'awesome_app' });
    await engine.run(context);

    const content = await readFile(join(tmp.path, 'README.md'), 'utf-8');
    expect(content).toContain('# awesome_app');
    expect(content).not.toContain('# my_app');
  });

  it('README.md renders the project description in the body', async () => {
    const engine = new ScaffoldEngine({ templatesDir: TEMPLATES_DIR });
    const context = makeWritableContext(tmp.path, {
      description: 'My awesome Flutter app for testing',
    });
    await engine.run(context);

    const content = await readFile(join(tmp.path, 'README.md'), 'utf-8');
    expect(content).toContain('My awesome Flutter app for testing');
  });
});

describe('README.md multiple modules simultaneously', () => {
  const tmp = useTempDir('readme-all-modules-');

  it('README.md lists all enabled modules when all are active', async () => {
    // Note: 15s timeout — scaffold with all 9 modules is slow on WSL2
    const engine = new ScaffoldEngine({
      templatesDir: TEMPLATES_DIR,
      modulesTemplatesDir: MODULES_DIR,
      registry: createTestRegistry(),
    });
    const context = makeWritableContext(tmp.path, {
      modules: {
        auth: { provider: 'firebase' },
        api: { baseUrl: 'https://api.example.com' },
        database: { engine: 'drift' },
        i18n: { defaultLocale: 'en', supportedLocales: ['en'] },
        theme: { seedColor: '#6750A4', darkMode: true },
        push: { provider: 'firebase' },
        analytics: { enabled: true },
        cicd: { provider: 'github' },
        deepLinking: { scheme: 'myapp', host: 'example.com' },
      },
    });
    await engine.run(context);

    const content = await readFile(join(tmp.path, 'README.md'), 'utf-8');
    expect(content).toContain('Authentication');
    expect(content).toContain('API Client');
    expect(content).toContain('Database');
    expect(content).toContain('Push Notifications');
    expect(content).toContain('Analytics');
    expect(content).toContain('Deep Linking');
    expect(content).toContain('Internationalization');
    expect(content).toContain('Theming');
    expect(content).toContain('CI/CD');
  });

  it('README.md interpolates module provider/engine values in module list', async () => {
    const engine = new ScaffoldEngine({
      templatesDir: TEMPLATES_DIR,
      modulesTemplatesDir: MODULES_DIR,
      registry: createTestRegistry(),
    });
    const context = makeWritableContext(tmp.path, {
      modules: {
        auth: { provider: 'supabase' },
        api: false,
        database: { engine: 'hive' },
        i18n: false,
        theme: false,
        push: { provider: 'onesignal' },
        analytics: false,
        cicd: { provider: 'github' },
        deepLinking: false,
      },
    });
    await engine.run(context);

    const content = await readFile(join(tmp.path, 'README.md'), 'utf-8');
    expect(content).toContain('supabase provider');
    expect(content).toContain('hive local storage');
    expect(content).toContain('onesignal provider');
    expect(content).toContain('github pipelines');
  });

  it('README.md has no module bullet points when no modules are enabled', async () => {
    const engine = new ScaffoldEngine({ templatesDir: TEMPLATES_DIR });
    const context = makeWritableContext(tmp.path);
    await engine.run(context);

    const content = await readFile(join(tmp.path, 'README.md'), 'utf-8');
    // No module bullets — the "Enabled Modules" section should be empty
    expect(content).not.toContain('Authentication');
    expect(content).not.toContain('API Client');
    expect(content).not.toContain('Push Notifications');
    expect(content).not.toContain('Analytics');
  });
});

describe('README.md Agent Teams section edge cases', () => {
  const tmp = useTempDir('readme-agent-teams-edge-');

  it('README.md renders Agent Teams section when agentTeams is true even if claude.enabled is false', async () => {
    // Template uses {{#if claude.agentTeams}} independently of claude.enabled
    const engine = new ScaffoldEngine({ templatesDir: TEMPLATES_DIR });
    const context = makeWritableContext(tmp.path, {
      claude: { enabled: false, agentTeams: true },
    });
    await engine.run(context);

    const content = await readFile(join(tmp.path, 'README.md'), 'utf-8');
    expect(content).toContain('Agent Teams');
  });

  it('README.md omits Agent Teams section when both claude.enabled and agentTeams are false', async () => {
    const engine = new ScaffoldEngine({ templatesDir: TEMPLATES_DIR });
    const context = makeWritableContext(tmp.path, {
      claude: { enabled: false, agentTeams: false },
    });
    await engine.run(context);

    const content = await readFile(join(tmp.path, 'README.md'), 'utf-8');
    expect(content).not.toContain('Agent Teams');
  });

  it('README.md Agent Teams section includes the CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS env var', async () => {
    const engine = new ScaffoldEngine({ templatesDir: TEMPLATES_DIR });
    const context = makeWritableContext(tmp.path, {
      claude: { enabled: true, agentTeams: true },
    });
    await engine.run(context);

    const content = await readFile(join(tmp.path, 'README.md'), 'utf-8');
    expect(content).toContain('CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS');
  });
});
