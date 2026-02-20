import { isValidSnakeCase, type PlanInput, type PlanResult } from '../../src/plan/index.js';
import { generateBriefTemplate } from '../../src/plan/index.js';
import { generatePlanAppSkill } from '../../src/plan/index.js';
import { writePartialConfig } from '../../src/plan/index.js';
import { runPlan } from '../../src/plan/index.js';

describe('src/plan/index.ts barrel export', () => {
  it('exports isValidSnakeCase', () => {
    expect(typeof isValidSnakeCase).toBe('function');
    expect(isValidSnakeCase('my_app')).toBe(true);
  });

  it('exports generateBriefTemplate', () => {
    expect(typeof generateBriefTemplate).toBe('function');
    const result = generateBriefTemplate({ name: 'test', description: 'A test.' });
    expect(result.length).toBeGreaterThan(0);
  });

  it('exports generatePlanAppSkill', () => {
    expect(typeof generatePlanAppSkill).toBe('function');
    const result = generatePlanAppSkill({ name: 'test', description: 'A test.' });
    expect(result.length).toBeGreaterThan(0);
  });

  it('exports writePartialConfig', () => {
    expect(typeof writePartialConfig).toBe('function');
  });

  it('exports runPlan', () => {
    expect(typeof runPlan).toBe('function');
  });

  it('PlanInput and PlanResult types compile without error', () => {
    const input: PlanInput = { name: 'my_app', description: 'A test.', outputDir: '/tmp/test' };
    const result: Partial<PlanResult> = { projectDir: '/tmp/test', filesCreated: [] };
    expect(input.name).toBe('my_app');
    expect(result.projectDir).toBe('/tmp/test');
  });
});
