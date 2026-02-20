import { generateBriefTemplate } from '../../src/plan/brief-template-generator.js';

describe('generateBriefTemplate — enhanced spec', () => {
  const sample = generateBriefTemplate({ name: 'my_app', description: 'A productivity app for teams.' });

  it('includes a Problem Statement section', () => {
    expect(sample).toMatch(/problem statement/i);
  });

  it('includes a Target Users section with persona template', () => {
    expect(sample).toMatch(/target users?/i);
    expect(sample).toMatch(/persona/i);
  });

  it('includes a Core User Journeys section with numbered items', () => {
    expect(sample).toMatch(/user journeys?/i);
    // Should have at least a numbered list marker
    expect(sample).toMatch(/1\./);
  });

  it('includes an Explicit Non-Goals section', () => {
    expect(sample).toMatch(/non.goals?/i);
  });

  it('includes a Success Metrics section', () => {
    expect(sample).toMatch(/success metrics?/i);
  });

  it('includes an App Description section', () => {
    expect(sample).toMatch(/description/i);
  });

  it('pre-fills project name from input', () => {
    const result = generateBriefTemplate({ name: 'cool_app', description: 'Test.' });
    expect(result).toContain('cool_app');
  });

  it('pre-fills description from input', () => {
    const result = generateBriefTemplate({ name: 'my_app', description: 'A unique description value.' });
    expect(result).toContain('A unique description value.');
  });
});
