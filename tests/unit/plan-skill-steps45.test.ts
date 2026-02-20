import { generatePlanAppSkill } from '../../src/plan/skill-generator.js';

describe('generatePlanAppSkill — Steps 4-5 module suggestions', () => {
  const sample = generatePlanAppSkill({ name: 'my_app', description: 'A team tool.' });

  it('includes Step 4 for module suggestions', () => {
    expect(sample).toMatch(/step 4|module suggestion/i);
  });

  it('categorizes suggestions as REQUIRED, RECOMMENDED, or NICE-TO-HAVE', () => {
    expect(sample).toMatch(/required/i);
    expect(sample).toMatch(/recommended/i);
    expect(sample).toMatch(/nice.to.have/i);
  });

  it('covers team-collaboration app type in decision matrix', () => {
    expect(sample).toMatch(/team.collaboration/i);
  });

  it('covers e-commerce app type in decision matrix', () => {
    expect(sample).toMatch(/e.commerce/i);
  });

  it('covers content-social app type in decision matrix', () => {
    expect(sample).toMatch(/content.social/i);
  });

  it('covers utility-tool app type in decision matrix', () => {
    expect(sample).toMatch(/utility.tool/i);
  });

  it('includes rationale for module suggestions', () => {
    expect(sample).toMatch(/rationale|because|why|needed for/i);
  });

  it('includes Step 5 for confirmation/approval', () => {
    expect(sample).toMatch(/step 5|confirm|approval|summarize/i);
  });

  it('Step 5 asks user to approve the selections', () => {
    expect(sample).toMatch(/approv|confirm|proceed/i);
  });
});
