import { describe, it, expect } from '@jest/globals';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { makeTestContext } from '../helpers/context-factory.js';
import { useTempDir } from '../helpers/temp-dir.js';
import { writeSkills } from '../../src/claude-setup/skill-writer.js';

describe('Skill Content', () => {
  const tmp = useTempDir('skill-content-test-');

  function makeContext() {
    return makeTestContext({ claude: { enabled: true, agentTeams: false } });
  }

  async function readSkill(filename: string): Promise<string> {
    return readFile(path.join(tmp.path, '.claude', 'skills', filename), 'utf-8');
  }

  it('flutter-patterns includes freezed sealed class and AsyncValue.when error handling', async () => {
    await writeSkills(makeContext(), tmp.path);
    const content = await readSkill('flutter-patterns.md');
    expect(content).toContain('@freezed');
    expect(content).toContain('AsyncValue.when');
    expect(content).toContain('error:');
  });

  it('flutter-patterns includes ref.invalidate cache refresh pattern', async () => {
    await writeSkills(makeContext(), tmp.path);
    const content = await readSkill('flutter-patterns.md');
    expect(content).toContain('ref.invalidate');
  });

  it('go-router-patterns includes ShellRoute and nested navigation', async () => {
    await writeSkills(makeContext(), tmp.path);
    const content = await readSkill('go-router-patterns.md');
    expect(content).toContain('ShellRoute');
    expect(content).toContain('BottomNavigationBar');
    expect(content).toContain('nested');
  });

  it('module-conventions includes at least 7 numbered steps with build_runner --delete-conflicting-outputs', async () => {
    await writeSkills(makeContext(), tmp.path);
    const content = await readSkill('module-conventions.md');
    const matches = content.match(/^\d+\./gm);
    expect(matches).not.toBeNull();
    expect(matches!.length).toBeGreaterThanOrEqual(7);
    expect(content).toContain('--delete-conflicting-outputs');
  });

  it('prd skill mentions predicate, dependencies, and storyPoints fields', async () => {
    await writeSkills(makeContext(), tmp.path);
    const content = await readSkill('prd.md');
    expect(content).toContain('predicate');
    expect(content).toContain('dependencies');
    expect(content).toContain('storyPoints');
  });
});
