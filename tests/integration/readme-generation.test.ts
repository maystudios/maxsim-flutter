import { join, resolve } from 'node:path';
import { readFile } from 'node:fs/promises';
import fsExtra from 'fs-extra';
import { ScaffoldEngine } from '../../src/scaffold/engine.js';
import { makeWritableContext } from '../helpers/context-factory.js';
import { useTempDir } from '../helpers/temp-dir.js';

const { pathExists } = fsExtra;
const TEMPLATES_DIR = resolve('templates/core');

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
