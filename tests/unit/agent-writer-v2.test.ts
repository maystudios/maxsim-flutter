import { describe, it, expect } from '@jest/globals';
import { makeTestContext } from '../helpers/context-factory.js';
import { buildAgentDefinitions } from '../../src/claude-setup/agent-writer.js';

describe('buildAgentDefinitions v2', () => {
  const context = makeTestContext({ projectName: 'test_app' });

  it('returns exactly 3 agents', () => {
    const agents = buildAgentDefinitions(context);
    expect(agents).toHaveLength(3);
  });

  it('flutter-builder has model sonnet', () => {
    const agents = buildAgentDefinitions(context);
    const builder = agents.find((a) => a.filename === 'flutter-builder.md');
    expect(builder).toBeDefined();
    expect(builder?.model).toBe('sonnet');
  });

  it('flutter-builder has all 6 required tools', () => {
    const agents = buildAgentDefinitions(context);
    const builder = agents.find((a) => a.filename === 'flutter-builder.md');
    expect(builder?.tools).toEqual(
      expect.arrayContaining(['Read', 'Write', 'Edit', 'Grep', 'Glob', 'Bash']),
    );
    expect(builder?.tools).toHaveLength(6);
  });

  it('flutter-tester has model sonnet', () => {
    const agents = buildAgentDefinitions(context);
    const tester = agents.find((a) => a.filename === 'flutter-tester.md');
    expect(tester).toBeDefined();
    expect(tester?.model).toBe('sonnet');
  });

  it('flutter-reviewer has model haiku', () => {
    const agents = buildAgentDefinitions(context);
    const reviewer = agents.find((a) => a.filename === 'flutter-reviewer.md');
    expect(reviewer).toBeDefined();
    expect(reviewer?.model).toBe('haiku');
  });

  it('flutter-reviewer has only read-only tools (Read, Grep, Glob)', () => {
    const agents = buildAgentDefinitions(context);
    const reviewer = agents.find((a) => a.filename === 'flutter-reviewer.md');
    expect(reviewer?.tools).toEqual(expect.arrayContaining(['Read', 'Grep', 'Glob']));
    expect(reviewer?.tools).toHaveLength(3);
    expect(reviewer?.tools).not.toContain('Write');
    expect(reviewer?.tools).not.toContain('Edit');
    expect(reviewer?.tools).not.toContain('Bash');
  });

  it('each agent body includes model selection rationale', () => {
    const agents = buildAgentDefinitions(context);
    for (const agent of agents) {
      const bodyLower = agent.body.toLowerCase();
      const hasModelRationale =
        bodyLower.includes('sonnet') ||
        bodyLower.includes('haiku') ||
        bodyLower.includes('model selection') ||
        bodyLower.includes('model rationale');
      expect(hasModelRationale).toBe(true);
    }
  });

  it('flutter-builder body includes sub-agent usage guidance', () => {
    const agents = buildAgentDefinitions(context);
    const builder = agents.find((a) => a.filename === 'flutter-builder.md');
    const bodyLower = builder?.body.toLowerCase() ?? '';
    const hasSubAgentGuidance =
      bodyLower.includes('task tool') ||
      bodyLower.includes('sub-agent') ||
      bodyLower.includes('subagent');
    expect(hasSubAgentGuidance).toBe(true);
  });

  it('flutter-tester body includes sub-agent usage guidance', () => {
    const agents = buildAgentDefinitions(context);
    const tester = agents.find((a) => a.filename === 'flutter-tester.md');
    const bodyLower = tester?.body.toLowerCase() ?? '';
    const hasSubAgentGuidance =
      bodyLower.includes('task tool') ||
      bodyLower.includes('sub-agent') ||
      bodyLower.includes('subagent');
    expect(hasSubAgentGuidance).toBe(true);
  });

  it('flutter-reviewer body states no sub-agents needed', () => {
    const agents = buildAgentDefinitions(context);
    const reviewer = agents.find((a) => a.filename === 'flutter-reviewer.md');
    const bodyLower = reviewer?.body.toLowerCase() ?? '';
    const hasNoSubAgentStatement =
      bodyLower.includes('no sub-agent') ||
      bodyLower.includes('no sub agent') ||
      bodyLower.includes('subagents needed') ||
      bodyLower.includes('sub-agents needed') ||
      bodyLower.includes('sub-agents are not') ||
      bodyLower.includes('does not use sub-agent') ||
      bodyLower.includes('without sub-agent');
    expect(hasNoSubAgentStatement).toBe(true);
  });

  it('each agent body references .claude/rules/', () => {
    const agents = buildAgentDefinitions(context);
    for (const agent of agents) {
      const hasRulesRef =
        agent.body.includes('.claude/rules') || agent.body.includes('rules/');
      expect(hasRulesRef).toBe(true);
    }
  });
});
