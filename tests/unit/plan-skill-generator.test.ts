import { generatePlanAppSkill } from '../../src/plan/skill-generator.js';

describe('generatePlanAppSkill — enhanced spec', () => {
  const sample = generatePlanAppSkill({ name: 'my_app', description: 'A team collaboration tool.' });

  it('uses model: claude-opus-4-6 in frontmatter', () => {
    expect(sample).toContain('model: claude-opus-4-6');
  });

  it('injects project name into skill body', () => {
    const result = generatePlanAppSkill({ name: 'super_app', description: 'Test.' });
    expect(result).toContain('super_app');
  });

  it('injects description into skill body', () => {
    const result = generatePlanAppSkill({ name: 'my_app', description: 'A unique injected description.' });
    expect(result).toContain('A unique injected description.');
  });

  it('covers Step 1: Understand Vision with questions about problem and user journey', () => {
    expect(sample).toMatch(/step 1|vision/i);
    expect(sample).toMatch(/problem/i);
  });

  it('covers Step 2: Define Core Features with feature and non-goals questions', () => {
    expect(sample).toMatch(/step 2|features?/i);
    expect(sample).toMatch(/non.goal/i);
  });

  it('covers Step 3: Technical Decisions with decision tree', () => {
    expect(sample).toMatch(/step 3|technical/i);
    expect(sample).toMatch(/auth/i);
  });

  it('includes decision points for auth, backend/database, and platforms', () => {
    expect(sample).toMatch(/auth/i);
    expect(sample).toMatch(/database|backend/i);
    expect(sample).toMatch(/platform/i);
  });

  it('instructs Claude to ask questions one at a time', () => {
    expect(sample).toMatch(/one (at a time|question)/i);
  });

  it('has YAML frontmatter delimiter', () => {
    expect(sample.startsWith('---')).toBe(true);
  });
});
