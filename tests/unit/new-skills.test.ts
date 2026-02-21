import { describe, it, expect } from '@jest/globals';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

import { makeTestContext } from '../helpers/context-factory.js';
import { useTempDir } from '../helpers/temp-dir.js';
import { writeSkills } from '../../src/claude-setup/skill-writer.js';

describe('New Skills', () => {
  const tmp = useTempDir('new-skills-test-');

  function makeContext() {
    return makeTestContext({ claude: { enabled: true, agentTeams: false } });
  }

  async function readSkill(name: string): Promise<string> {
    return readFile(path.join(tmp.path, '.claude', 'skills', name, 'SKILL.md'), 'utf-8');
  }

  it('writeSkills generates 6 or more skill files', async () => {
    await writeSkills(makeContext(), tmp.path);
    const skillsDir = path.join(tmp.path, '.claude', 'skills');
    const entries = await readdir(skillsDir);
    expect(entries.length).toBeGreaterThanOrEqual(6);
  });

  it('security-review.md has model: sonnet frontmatter', async () => {
    await writeSkills(makeContext(), tmp.path);
    const content = await readSkill('security-review');
    expect(content).toContain('model: sonnet');
  });

  it('security-review.md covers secrets, input validation, and API security', async () => {
    await writeSkills(makeContext(), tmp.path);
    const content = await readSkill('security-review');
    expect(content).toContain('Secrets');
    expect(content).toContain('Input Validation');
    expect(content).toContain('API');
  });

  it('performance-check.md has model: haiku frontmatter', async () => {
    await writeSkills(makeContext(), tmp.path);
    const content = await readSkill('performance-check');
    expect(content).toContain('model: haiku');
  });

  it('performance-check.md covers rebuilds, providers, and images', async () => {
    await writeSkills(makeContext(), tmp.path);
    const content = await readSkill('performance-check');
    expect(content).toContain('rebuild');
    expect(content).toContain('provider');
    expect(content).toContain('image');
  });

  it('add-feature.md skill has model: sonnet and Clean Architecture steps', async () => {
    await writeSkills(makeContext(), tmp.path);
    const content = await readSkill('add-feature');
    expect(content).toContain('model: sonnet');
    expect(content).toContain('domain');
    expect(content).toContain('presentation');
  });
});
