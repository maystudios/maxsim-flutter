import { classifyAppType } from '../../src/plan/app-type-classifier.js';

describe('classifyAppType', () => {
  it('classifies team-collaboration app by keywords', () => {
    const result = classifyAppType('A team chat app with channels, messages, and task management');
    expect(result.type).toBe('team-collaboration');
    expect(result.confidence).toBeGreaterThan(0.5);
    expect(result.suggestedModules.map((m) => m.moduleId)).toContain('auth');
    expect(result.suggestedModules.map((m) => m.moduleId)).toContain('push');
  });

  it('classifies e-commerce app by keywords', () => {
    const result = classifyAppType('Online shop with product catalog, cart, checkout, and payment');
    expect(result.type).toBe('e-commerce');
    expect(result.confidence).toBeGreaterThan(0.5);
    expect(result.suggestedModules.map((m) => m.moduleId)).toContain('auth');
    expect(result.suggestedModules.map((m) => m.moduleId)).toContain('database');
  });

  it('classifies content-social app by keywords', () => {
    const result = classifyAppType('Social media platform with posts, feed, likes, and followers');
    expect(result.type).toBe('content-social');
    expect(result.confidence).toBeGreaterThan(0.5);
    expect(result.suggestedModules.map((m) => m.moduleId)).toContain('auth');
    expect(result.suggestedModules.map((m) => m.moduleId)).toContain('analytics');
  });

  it('classifies utility-tool app by keywords', () => {
    const result = classifyAppType('A simple calculator and unit converter utility tool');
    expect(result.type).toBe('utility-tool');
    expect(result.confidence).toBeGreaterThan(0.5);
    expect(result.suggestedModules.map((m) => m.moduleId)).toContain('theme');
  });

  it('classifies fitness-health app by keywords', () => {
    const result = classifyAppType('Workout tracker with exercise logging, calories, and health metrics');
    expect(result.type).toBe('fitness-health');
    expect(result.confidence).toBeGreaterThan(0.5);
    expect(result.suggestedModules.map((m) => m.moduleId)).toContain('auth');
    expect(result.suggestedModules.map((m) => m.moduleId)).toContain('database');
  });

  it('classifies education app by keywords', () => {
    const result = classifyAppType('E-learning platform with courses, quizzes, and student progress tracking');
    expect(result.type).toBe('education');
    expect(result.confidence).toBeGreaterThan(0.5);
    expect(result.suggestedModules.map((m) => m.moduleId)).toContain('auth');
    expect(result.suggestedModules.map((m) => m.moduleId)).toContain('database');
  });

  it('defaults to general type for unrecognized descriptions', () => {
    const result = classifyAppType('My awesome app');
    expect(result.type).toBe('general');
    expect(result.confidence).toBeLessThan(0.5);
    const moduleIds = result.suggestedModules.map((m) => m.moduleId);
    expect(moduleIds).toContain('auth');
    expect(moduleIds).toContain('api');
    expect(moduleIds).toContain('theme');
  });

  it('returns modules with required fields (moduleId, priority, rationale)', () => {
    const result = classifyAppType('My awesome app');
    for (const mod of result.suggestedModules) {
      expect(mod.moduleId).toBeTruthy();
      expect(['high', 'medium', 'low']).toContain(mod.priority);
      expect(mod.rationale).toBeTruthy();
    }
  });

  it('confidence is between 0 and 1 for all types', () => {
    const descriptions = [
      'team chat with tasks',
      'online shop checkout',
      'social feed with posts',
      'simple calculator tool',
      'workout tracker calories',
      'online courses quizzes',
      'generic unknown app description',
    ];
    for (const desc of descriptions) {
      const result = classifyAppType(desc);
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    }
  });

  it('is case-insensitive in keyword matching', () => {
    const lower = classifyAppType('team chat channels messages');
    const upper = classifyAppType('TEAM CHAT CHANNELS MESSAGES');
    expect(lower.type).toBe(upper.type);
    expect(lower.confidence).toBeCloseTo(upper.confidence, 5);
  });
});
