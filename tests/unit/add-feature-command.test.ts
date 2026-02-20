import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { makeWritableContext } from '../helpers/context-factory.js';
import { useTempDir } from '../helpers/temp-dir.js';
import { writeCommands } from '../../src/claude-setup/commands-writer.js';

describe('add-feature command generation', () => {
  const tmp = useTempDir('add-feature-cmd-test-');

  async function getAddFeatureMd(overrides: Partial<Parameters<typeof makeWritableContext>[1]> = {}): Promise<string> {
    const context = makeWritableContext(tmp.path, overrides);
    await writeCommands(context, tmp.path);
    return readFile(join(tmp.path, '.claude', 'commands', 'add-feature.md'), 'utf-8');
  }

  it('contains model: sonnet in YAML frontmatter', async () => {
    const content = await getAddFeatureMd();
    expect(content).toMatch(/^---\s*\nmodel:\s*sonnet\s*\n---/);
  });

  it('contains exactly 10 numbered Clean Architecture steps', async () => {
    const content = await getAddFeatureMd();
    const steps = content.match(/^### \d+\./gm);
    expect(steps).not.toBeNull();
    expect(steps!.length).toBe(10);
  });

  it('contains auth guard section when auth module is enabled', async () => {
    const content = await getAddFeatureMd({
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
    expect(content).toContain('Route Guard');
    expect(content).toContain('isLoggedInProvider');
  });

  it('does not contain auth guard section when auth module is disabled', async () => {
    const content = await getAddFeatureMd();
    expect(content).not.toContain('isLoggedInProvider');
  });
});
