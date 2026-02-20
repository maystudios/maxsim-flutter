import { join } from 'node:path';
import { access, readFile } from 'node:fs/promises';
import { useTempDir } from '../helpers/temp-dir.js';
import { isValidSnakeCase } from '../../src/plan/types.js';
import { writePartialConfig } from '../../src/plan/config-writer.js';
import { generateBriefTemplate } from '../../src/plan/brief-template-generator.js';
import { generatePlanAppSkill } from '../../src/plan/skill-generator.js';
import { runPlan } from '../../src/plan/plan-orchestrator.js';
import { createPlanCommand } from '../../src/cli/commands/plan.js';

// --- Snake_case validation tests ---

describe('isValidSnakeCase', () => {
  it('accepts valid snake_case names', () => {
    expect(isValidSnakeCase('my_app')).toBe(true);
    expect(isValidSnakeCase('super_app_v2')).toBe(true);
    expect(isValidSnakeCase('app')).toBe(true);
  });

  it('rejects names with uppercase letters', () => {
    expect(isValidSnakeCase('MyApp')).toBe(false);
    expect(isValidSnakeCase('my_App')).toBe(false);
  });

  it('rejects names with spaces or hyphens', () => {
    expect(isValidSnakeCase('my app')).toBe(false);
    expect(isValidSnakeCase('my-app')).toBe(false);
  });

  it('rejects empty string', () => {
    expect(isValidSnakeCase('')).toBe(false);
  });
});

// --- Config writer tests ---

describe('writePartialConfig', () => {
  const tmp = useTempDir('plan-config-writer-');

  it('writes maxsim.config.yaml with project name and description', async () => {
    await writePartialConfig(tmp.path, { name: 'my_app', description: 'A cool app for testing things.' });

    const content = await readFile(join(tmp.path, 'maxsim.config.yaml'), 'utf-8');
    expect(content).toContain('name: my_app');
    expect(content).toContain('A cool app for testing things.');
  });

  it('creates the output directory if it does not exist', async () => {
    const nestedDir = join(tmp.path, 'nested', 'subdir');
    await writePartialConfig(nestedDir, { name: 'nested_app', description: 'Nested.' });
    await expect(access(nestedDir)).resolves.toBeUndefined();
  });
});

// --- Brief template generator tests ---

describe('generateBriefTemplate', () => {
  it('returns a non-empty markdown string with heading', () => {
    const content = generateBriefTemplate({ name: 'my_app', description: 'A test app.' });
    expect(typeof content).toBe('string');
    expect(content.length).toBeGreaterThan(0);
    expect(content).toContain('#');
  });

  it('includes project name in template content', () => {
    const content = generateBriefTemplate({ name: 'super_app', description: 'A super app.' });
    expect(content).toContain('super_app');
  });

  it('includes app description in template content', () => {
    const content = generateBriefTemplate({ name: 'my_app', description: 'Revolutionary productivity tool.' });
    expect(content).toContain('Revolutionary productivity tool.');
  });
});

// --- Skill generator tests ---

describe('generatePlanAppSkill', () => {
  it('returns a non-empty string with YAML frontmatter', () => {
    const content = generatePlanAppSkill();
    expect(typeof content).toBe('string');
    expect(content.length).toBeGreaterThan(0);
    expect(content).toContain('---');
  });

  it('includes plan-app in the skill content', () => {
    const content = generatePlanAppSkill();
    expect(content.toLowerCase()).toContain('plan');
  });

  it('includes description field in frontmatter', () => {
    const content = generatePlanAppSkill();
    expect(content).toContain('description:');
  });
});

// --- Plan orchestrator tests ---

describe('runPlan orchestrator', () => {
  const tmp = useTempDir('plan-orchestrator-');

  it('creates all expected files in the project directory', async () => {
    const projectDir = join(tmp.path, 'my_project');

    await runPlan({ name: 'my_project', description: 'A project for testing orchestration.', outputDir: projectDir });

    await expect(access(projectDir)).resolves.toBeUndefined();
    await expect(access(join(projectDir, 'maxsim.config.yaml'))).resolves.toBeUndefined();
    await expect(access(join(projectDir, '.claude', 'skills', 'plan-app.md'))).resolves.toBeUndefined();
    await expect(access(join(projectDir, 'docs', 'project-brief-template.md'))).resolves.toBeUndefined();
  });

  it('returns result with list of created files and projectDir', async () => {
    const projectDir = join(tmp.path, 'result_project');
    const result = await runPlan({ name: 'result_project', description: 'Testing result output.', outputDir: projectDir });

    expect(result.filesCreated).toBeInstanceOf(Array);
    expect(result.filesCreated.length).toBeGreaterThan(0);
    expect(result.projectDir).toBe(projectDir);
  });
});

// --- Plan command factory tests ---

describe('createPlanCommand', () => {
  it('returns a Commander Command with name "plan"', () => {
    const cmd = createPlanCommand();
    expect(cmd.name()).toBe('plan');
  });

  it('has a non-empty description', () => {
    const cmd = createPlanCommand();
    expect(cmd.description().length).toBeGreaterThan(0);
  });

  it('accepts an optional [app-name] argument', () => {
    const cmd = createPlanCommand();
    expect(cmd.registeredArguments[0].name()).toBe('app-name');
  });
});
