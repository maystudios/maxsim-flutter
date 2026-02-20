import { PrdSchema, PrdStorySchema, AcceptanceCriterionSchema } from '../../src/claude-setup/prd-schema.js';
import type { Prd, PrdStory, AcceptanceCriterion } from '../../src/claude-setup/prd-schema.js';

describe('AcceptanceCriterionSchema', () => {
  it('parses criterion with only description', () => {
    const result = AcceptanceCriterionSchema.parse({ description: 'App starts without crashing' });
    expect(result.description).toBe('App starts without crashing');
    expect(result.predicate).toBeUndefined();
  });

  it('parses criterion with description and predicate', () => {
    const result = AcceptanceCriterionSchema.parse({
      description: 'All tests pass',
      predicate: 'npm test returns exit code 0',
    });
    expect(result.description).toBe('All tests pass');
    expect(result.predicate).toBe('npm test returns exit code 0');
  });

  it('rejects criterion missing description', () => {
    expect(() => AcceptanceCriterionSchema.parse({ predicate: 'something' })).toThrow();
  });
});

describe('PrdStorySchema', () => {
  const validStory = {
    id: 'S-001',
    phase: 1,
    priority: 'P0',
    title: 'Setup Clean Architecture',
    description: 'Verify and finalize the project structure.',
    module: 'core',
    storyPoints: 5,
    dependencies: [],
    acceptanceCriteria: [
      { description: 'lib/features directory exists' },
    ],
    passes: false,
  };

  it('parses a valid story', () => {
    const result = PrdStorySchema.parse(validStory);
    expect(result.id).toBe('S-001');
    expect(result.phase).toBe(1);
    expect(result.priority).toBe('P0');
    expect(result.storyPoints).toBe(5);
    expect(result.passes).toBe(false);
  });

  it('allows optional module field', () => {
    const storyWithoutModule = { ...validStory };
    delete (storyWithoutModule as Partial<typeof validStory>).module;
    const result = PrdStorySchema.parse(storyWithoutModule);
    expect(result.module).toBeUndefined();
  });

  it('validates priority is P0-P3 only', () => {
    expect(() => PrdStorySchema.parse({ ...validStory, priority: 'P4' })).toThrow();
    expect(() => PrdStorySchema.parse({ ...validStory, priority: 'high' })).toThrow();
  });

  it('validates storyPoints is within Fibonacci range (1-13)', () => {
    const validPoints = [1, 2, 3, 5, 8, 13];
    for (const pts of validPoints) {
      expect(() => PrdStorySchema.parse({ ...validStory, storyPoints: pts })).not.toThrow();
    }
  });

  it('rejects invalid storyPoints values', () => {
    expect(() => PrdStorySchema.parse({ ...validStory, storyPoints: 0 })).toThrow();
    expect(() => PrdStorySchema.parse({ ...validStory, storyPoints: 14 })).toThrow();
    expect(() => PrdStorySchema.parse({ ...validStory, storyPoints: 4 })).toThrow();
  });

  it('accepts dependencies as array of story IDs', () => {
    const result = PrdStorySchema.parse({
      ...validStory,
      dependencies: ['S-001', 'S-002'],
    });
    expect(result.dependencies).toEqual(['S-001', 'S-002']);
  });

  it('accepts acceptanceCriteria with mixed description-only and full objects', () => {
    const result = PrdStorySchema.parse({
      ...validStory,
      acceptanceCriteria: [
        { description: 'First criterion' },
        { description: 'Second criterion', predicate: 'npm test passes' },
      ],
    });
    expect(result.acceptanceCriteria).toHaveLength(2);
    expect(result.acceptanceCriteria[1].predicate).toBe('npm test passes');
  });
});

describe('PrdSchema', () => {
  const validPrd = {
    version: '2.0.0',
    project: 'my_flutter_app',
    generatedAt: '2026-02-20T10:00:00.000Z',
    phases: [
      { phase: 1, title: 'Core Setup', description: 'Foundation stories' },
    ],
    stories: [
      {
        id: 'S-001',
        phase: 1,
        priority: 'P0',
        title: 'Setup project',
        description: 'Initial project setup.',
        storyPoints: 3,
        dependencies: [],
        acceptanceCriteria: [{ description: 'Project compiles' }],
        passes: false,
      },
    ],
  };

  it('parses a valid PRD v2.0.0 document', () => {
    const result = PrdSchema.parse(validPrd);
    expect(result.version).toBe('2.0.0');
    expect(result.project).toBe('my_flutter_app');
    expect(result.generatedAt).toBe('2026-02-20T10:00:00.000Z');
    expect(result.phases).toHaveLength(1);
    expect(result.stories).toHaveLength(1);
  });

  it('rejects PRD without required version field', () => {
    const { version: _, ...noVersion } = validPrd;
    expect(() => PrdSchema.parse(noVersion)).toThrow();
  });

  it('rejects PRD without required project field', () => {
    const { project: _, ...noProject } = validPrd;
    expect(() => PrdSchema.parse(noProject)).toThrow();
  });

  it('accepts PRD with generatedAt as optional field', () => {
    const { generatedAt: _, ...noGeneratedAt } = validPrd;
    const result = PrdSchema.parse(noGeneratedAt);
    expect(result.generatedAt).toBeUndefined();
  });

  it('exports correct TypeScript types', () => {
    const story: PrdStory = {
      id: 'S-001',
      phase: 1,
      priority: 'P0',
      title: 'Test',
      description: 'Test story',
      storyPoints: 1,
      dependencies: [],
      acceptanceCriteria: [{ description: 'Criterion' }],
      passes: false,
    };
    const criterion: AcceptanceCriterion = { description: 'test' };
    const prd: Prd = { version: '2.0.0', project: 'app', stories: [story] };

    expect(story.priority).toBe('P0');
    expect(criterion.description).toBe('test');
    expect(prd.version).toBe('2.0.0');
  });

  it('validates nested acceptanceCriteria in full PRD', () => {
    const prdWithCriteria = {
      ...validPrd,
      stories: [
        {
          ...validPrd.stories[0],
          acceptanceCriteria: [
            { description: 'App boots' },
            { description: 'Tests pass', predicate: 'exit code 0' },
          ],
        },
      ],
    };
    const result = PrdSchema.parse(prdWithCriteria);
    expect(result.stories[0].acceptanceCriteria[1].predicate).toBe('exit code 0');
  });
});
