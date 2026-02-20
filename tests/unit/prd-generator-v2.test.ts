import { generatePrd } from '../../src/claude-setup/prd-generator.js';
import { PrdSchema } from '../../src/claude-setup/prd-schema.js';
import { DEFAULT_CONTEXT, makeTestContext } from '../helpers/context-factory.js';

describe('generatePrd v2', () => {
  it('generates PRD with version 2.0.0', () => {
    const context = makeTestContext();
    const prd = PrdSchema.parse(JSON.parse(generatePrd(context)));
    expect(prd.version).toBe('2.0.0');
  });

  it('story IDs use module prefix format (e.g. P1-CORE-001)', () => {
    const context = makeTestContext();
    const prd = PrdSchema.parse(JSON.parse(generatePrd(context)));
    expect(prd.stories.length).toBeGreaterThan(0);
    for (const story of prd.stories) {
      expect(story.id).toMatch(/^P\d+-[A-Z]+-\d{3}$/);
    }
  });

  it('each story has storyPoints as a Fibonacci number', () => {
    const context = makeTestContext();
    const prd = PrdSchema.parse(JSON.parse(generatePrd(context)));
    const validPoints = [1, 2, 3, 5, 8, 13];
    for (const story of prd.stories) {
      expect(validPoints).toContain(story.storyPoints);
    }
  });

  it('acceptance criteria are objects with description and optional predicate', () => {
    const context = makeTestContext();
    const prd = PrdSchema.parse(JSON.parse(generatePrd(context)));
    for (const story of prd.stories) {
      expect(story.acceptanceCriteria.length).toBeGreaterThan(0);
      for (const criterion of story.acceptanceCriteria) {
        expect(criterion).toHaveProperty('description');
        expect(typeof criterion.description).toBe('string');
      }
    }
  });

  it('phase 2 stories have dependencies on phase 1 story IDs', () => {
    const context = makeTestContext({
      modules: {
        ...DEFAULT_CONTEXT.modules,
        auth: { provider: 'firebase' },
      },
    });
    const prd = PrdSchema.parse(JSON.parse(generatePrd(context)));
    const phase2Stories = prd.stories.filter((s) => s.phase === 2);
    expect(phase2Stories.length).toBeGreaterThan(0);
    for (const story of phase2Stories) {
      expect(story.dependencies.length).toBeGreaterThan(0);
      // Dependencies should reference phase 1 story IDs
      expect(story.dependencies[0]).toMatch(/^P1-CORE-\d{3}$/);
    }
  });

  it('module-conditional stories only appear when module is enabled (auth=false)', () => {
    const context = makeTestContext(); // auth: false by default
    const prd = PrdSchema.parse(JSON.parse(generatePrd(context)));
    const authStories = prd.stories.filter((s) => s.module === 'auth');
    expect(authStories.length).toBe(0);
  });

  it('generatedAt timestamp is present and is a valid ISO string', () => {
    const context = makeTestContext();
    const prd = PrdSchema.parse(JSON.parse(generatePrd(context)));
    expect(prd.generatedAt).toBeDefined();
    expect(new Date(prd.generatedAt!).toISOString()).toBe(prd.generatedAt);
  });

  it('phases array is present with phase metadata including title', () => {
    const context = makeTestContext();
    const prd = PrdSchema.parse(JSON.parse(generatePrd(context)));
    expect(prd.phases).toBeDefined();
    expect(prd.phases!.length).toBeGreaterThan(0);
    expect(prd.phases![0]).toHaveProperty('phase');
    expect(prd.phases![0]).toHaveProperty('title');
    expect(typeof prd.phases![0].title).toBe('string');
  });
});
