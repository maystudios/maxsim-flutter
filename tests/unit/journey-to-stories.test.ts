import { describe, it, expect } from '@jest/globals';
import { generateJourneyDecompositionPrompt } from '../../src/plan/journey-to-stories.js';

describe('generateJourneyDecompositionPrompt', () => {
  const sampleJourneys = ['User signs up and logs in', 'User views product catalog'];

  it('returns a non-empty string', () => {
    const prompt = generateJourneyDecompositionPrompt(sampleJourneys);
    expect(typeof prompt).toBe('string');
    expect(prompt.length).toBeGreaterThan(100);
  });

  it('includes domain, data, and presentation layer decomposition pattern', () => {
    const prompt = generateJourneyDecompositionPrompt(sampleJourneys);
    expect(prompt).toContain('domain');
    expect(prompt).toContain('data');
    expect(prompt).toContain('presentation');
  });

  it('specifies dependency chain: domain first, then data, then presentation', () => {
    const prompt = generateJourneyDecompositionPrompt(sampleJourneys);
    const lowerPrompt = prompt.toLowerCase();
    const domainIdx = lowerPrompt.indexOf('domain');
    const dataIdx = lowerPrompt.indexOf('data');
    const presentationIdx = lowerPrompt.indexOf('presentation');
    expect(domainIdx).toBeGreaterThanOrEqual(0);
    expect(dataIdx).toBeGreaterThan(domainIdx);
    expect(presentationIdx).toBeGreaterThan(dataIdx);
  });

  it('requires >= 3 acceptance criteria with predicates per story', () => {
    const prompt = generateJourneyDecompositionPrompt(sampleJourneys);
    expect(prompt.toLowerCase()).toContain('acceptance criteria');
    expect(prompt).toContain('predicate');
    expect(prompt).toMatch(/[>=]\s*3/);
  });

  it('specifies Fibonacci story points including 1, 2, 3, 5, 8', () => {
    const prompt = generateJourneyDecompositionPrompt(sampleJourneys);
    expect(prompt).toContain('Fibonacci');
    expect(prompt).toContain('1, 2, 3, 5, 8');
  });

  it('includes the provided user journeys in the output', () => {
    const prompt = generateJourneyDecompositionPrompt(sampleJourneys);
    expect(prompt).toContain('User signs up and logs in');
    expect(prompt).toContain('User views product catalog');
  });

  it('instructs to generate test stories for each feature', () => {
    const prompt = generateJourneyDecompositionPrompt(sampleJourneys);
    expect(prompt.toLowerCase()).toContain('test');
  });

  it('specifies 2-4 stories per journey', () => {
    const prompt = generateJourneyDecompositionPrompt(sampleJourneys);
    expect(prompt).toMatch(/2.{0,5}4/);
  });

  it('handles a single journey', () => {
    const prompt = generateJourneyDecompositionPrompt(['User resets password']);
    expect(prompt).toContain('User resets password');
    expect(prompt).toContain('domain');
  });

  it('handles empty journeys list gracefully', () => {
    const prompt = generateJourneyDecompositionPrompt([]);
    expect(typeof prompt).toBe('string');
    expect(prompt).toContain('domain');
  });
});
