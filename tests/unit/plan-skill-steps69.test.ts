import { generatePlanAppSkill } from '../../src/plan/skill-generator.js';

describe('generatePlanAppSkill — Steps 6-9 artifact generation', () => {
  const sample = generatePlanAppSkill({ name: 'my_app', description: 'A collaboration tool.' });

  it('includes Step 6 for generating project-brief.md', () => {
    expect(sample).toMatch(/step 6|project.brief/i);
  });

  it('includes Step 7 for generating architecture.md with ASCII diagrams', () => {
    expect(sample).toMatch(/step 7|architecture/i);
    expect(sample).toMatch(/ascii|diagram|tree/i);
  });

  it('includes Step 8 for generating complete maxsim.config.yaml', () => {
    expect(sample).toMatch(/step 8|maxsim\.config\.yaml/i);
  });

  it('includes Step 9 for generating prd.json v2', () => {
    expect(sample).toMatch(/step 9|prd\.json/i);
  });

  it('mentions provider tree in architecture step', () => {
    expect(sample).toMatch(/provider tree|riverpod/i);
  });

  it('mentions navigation flow in architecture step', () => {
    expect(sample).toMatch(/navigation flow|go_router|routing/i);
  });

  it('specifies prd v2 format with 4 phases', () => {
    expect(sample).toMatch(/phase/i);
    expect(sample).toMatch(/prd|stories?/i);
  });

  it('includes clear next-steps at the end', () => {
    expect(sample).toMatch(/next.step|run|maxsim-flutter create/i);
  });

  it('instructs to derive stories from user journeys', () => {
    expect(sample).toMatch(/journey|user stor/i);
  });
});
