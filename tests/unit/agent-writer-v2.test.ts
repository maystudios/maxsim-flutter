import { describe, it, expect } from '@jest/globals';
import { makeTestContext } from '../helpers/context-factory.js';
import { buildAgentDefinitions, writeAgents } from '../../src/claude-setup/agent-writer.js';
import { useTempDir } from '../helpers/temp-dir.js';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

describe('buildAgentDefinitions v2', () => {
  const context = makeTestContext({ projectName: 'test_app' });

  it('returns exactly 4 agents', () => {
    const agents = buildAgentDefinitions(context);
    expect(agents).toHaveLength(4);
  });

  it('flutter-builder has model opus', () => {
    const agents = buildAgentDefinitions(context);
    const builder = agents.find((a) => a.filename === 'flutter-builder.md');
    expect(builder).toBeDefined();
    expect(builder?.model).toBe('opus');
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
        bodyLower.includes('opus') ||
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

describe('P11-001: flutter-architect agent', () => {
  const context = makeTestContext({ projectName: 'test_app' });

  it('uses opus model', () => {
    const agents = buildAgentDefinitions(context);
    const architect = agents.find((a) => a.filename === 'flutter-architect.md');
    expect(architect).toBeDefined();
    expect(architect?.model).toBe('opus');
  });

  it('has read-only tools plus WebSearch: Read, Grep, Glob, WebSearch', () => {
    const agents = buildAgentDefinitions(context);
    const architect = agents.find((a) => a.filename === 'flutter-architect.md');
    expect(architect?.tools).toEqual(
      expect.arrayContaining(['Read', 'Grep', 'Glob', 'WebSearch']),
    );
    expect(architect?.tools).toHaveLength(4);
  });

  it('does not have Write, Edit, or Bash tools', () => {
    const agents = buildAgentDefinitions(context);
    const architect = agents.find((a) => a.filename === 'flutter-architect.md');
    expect(architect?.tools).not.toContain('Write');
    expect(architect?.tools).not.toContain('Edit');
    expect(architect?.tools).not.toContain('Bash');
  });

  it('has maxTurns of 30', () => {
    const agents = buildAgentDefinitions(context);
    const architect = agents.find((a) => a.filename === 'flutter-architect.md');
    expect(architect?.maxTurns).toBe(30);
  });

  it('includes project name in body', () => {
    const agents = buildAgentDefinitions(context);
    const architect = agents.find((a) => a.filename === 'flutter-architect.md');
    expect(architect?.body).toContain('test_app');
  });

  it('body contains Scope Boundaries section with Do NOT rules', () => {
    const agents = buildAgentDefinitions(context);
    const architect = agents.find((a) => a.filename === 'flutter-architect.md');
    expect(architect?.body).toContain('Scope Boundaries');
    expect(architect?.body).toContain('Do NOT');
  });

  it('includes architecture planning workflow', () => {
    const agents = buildAgentDefinitions(context);
    const architect = agents.find((a) => a.filename === 'flutter-architect.md');
    const bodyLower = architect?.body.toLowerCase() ?? '';
    const hasPlanning =
      bodyLower.includes('planning') ||
      bodyLower.includes('design') ||
      bodyLower.includes('interface');
    expect(hasPlanning).toBe(true);
  });

  it('includes module context for no-modules project', () => {
    const agents = buildAgentDefinitions(context);
    const architect = agents.find((a) => a.filename === 'flutter-architect.md');
    expect(architect?.body).toContain('core Clean Architecture structure without additional modules');
  });

  it('includes module context when modules are enabled', () => {
    const ctxWithModules = makeTestContext({
      projectName: 'test_app',
      modules: {
        ...makeTestContext().modules,
        auth: { provider: 'firebase' },
        api: { baseUrl: 'https://api.test.com' },
      },
    });
    const agents = buildAgentDefinitions(ctxWithModules);
    const architect = agents.find((a) => a.filename === 'flutter-architect.md');
    expect(architect?.body).toContain('auth, api');
  });
});

describe('P11-001: new AgentDefinition fields', () => {
  const context = makeTestContext({ projectName: 'test_app' });

  describe('flutter-builder new fields', () => {
    it('has isolation set to worktree', () => {
      const agents = buildAgentDefinitions(context);
      const builder = agents.find((a) => a.name === 'flutter-builder');
      expect(builder?.isolation).toBe('worktree');
    });

    it('has maxTurns of 50', () => {
      const agents = buildAgentDefinitions(context);
      const builder = agents.find((a) => a.name === 'flutter-builder');
      expect(builder?.maxTurns).toBe(50);
    });

    it('body contains Scope Boundaries section with Do NOT rules', () => {
      const agents = buildAgentDefinitions(context);
      const builder = agents.find((a) => a.name === 'flutter-builder');
      expect(builder?.body).toContain('Scope Boundaries');
      expect(builder?.body).toContain('Do NOT');
    });
  });

  describe('flutter-tester new fields', () => {
    it('has isolation set to worktree', () => {
      const agents = buildAgentDefinitions(context);
      const tester = agents.find((a) => a.name === 'flutter-tester');
      expect(tester?.isolation).toBe('worktree');
    });

    it('has maxTurns of 40', () => {
      const agents = buildAgentDefinitions(context);
      const tester = agents.find((a) => a.name === 'flutter-tester');
      expect(tester?.maxTurns).toBe(40);
    });

    it('body contains Scope Boundaries section with Do NOT rules', () => {
      const agents = buildAgentDefinitions(context);
      const tester = agents.find((a) => a.name === 'flutter-tester');
      expect(tester?.body).toContain('Scope Boundaries');
      expect(tester?.body).toContain('Do NOT');
    });
  });

  describe('flutter-reviewer new fields', () => {
    it('has memory set to user', () => {
      const agents = buildAgentDefinitions(context);
      const reviewer = agents.find((a) => a.name === 'flutter-reviewer');
      expect(reviewer?.memory).toBe('user');
    });

    it('has maxTurns of 20', () => {
      const agents = buildAgentDefinitions(context);
      const reviewer = agents.find((a) => a.name === 'flutter-reviewer');
      expect(reviewer?.maxTurns).toBe(20);
    });

    it('body contains Scope Boundaries section with Do NOT rules', () => {
      const agents = buildAgentDefinitions(context);
      const reviewer = agents.find((a) => a.name === 'flutter-reviewer');
      expect(reviewer?.body).toContain('Scope Boundaries');
      expect(reviewer?.body).toContain('Do NOT');
    });
  });
});

describe('P11-001: formatAgentMarkdown frontmatter fields', () => {
  const tmp = useTempDir('agent-writer-frontmatter-test-');

  function makeContext(overrides: Partial<Parameters<typeof makeTestContext>[0]> = {}) {
    return makeTestContext({
      claude: { enabled: true, agentTeams: true },
      ...overrides,
    });
  }

  it('flutter-builder frontmatter contains isolation: worktree', async () => {
    await writeAgents(makeContext(), tmp.path);
    const content = await readFile(
      join(tmp.path, '.claude', 'agents', 'flutter-builder.md'),
      'utf-8',
    );
    expect(content).toContain('isolation: worktree');
  });

  it('flutter-builder frontmatter contains maxTurns: 50', async () => {
    await writeAgents(makeContext(), tmp.path);
    const content = await readFile(
      join(tmp.path, '.claude', 'agents', 'flutter-builder.md'),
      'utf-8',
    );
    expect(content).toContain('maxTurns: 50');
  });

  it('flutter-reviewer frontmatter contains memory: user', async () => {
    await writeAgents(makeContext(), tmp.path);
    const content = await readFile(
      join(tmp.path, '.claude', 'agents', 'flutter-reviewer.md'),
      'utf-8',
    );
    expect(content).toContain('memory: user');
  });

  it('flutter-reviewer frontmatter does not contain isolation field', async () => {
    await writeAgents(makeContext(), tmp.path);
    const content = await readFile(
      join(tmp.path, '.claude', 'agents', 'flutter-reviewer.md'),
      'utf-8',
    );
    expect(content).not.toContain('isolation:');
  });

  it('flutter-architect frontmatter contains maxTurns: 30', async () => {
    await writeAgents(makeContext(), tmp.path);
    const content = await readFile(
      join(tmp.path, '.claude', 'agents', 'flutter-architect.md'),
      'utf-8',
    );
    expect(content).toContain('maxTurns: 30');
  });

  it('flutter-architect frontmatter does not contain isolation field', async () => {
    await writeAgents(makeContext(), tmp.path);
    const content = await readFile(
      join(tmp.path, '.claude', 'agents', 'flutter-architect.md'),
      'utf-8',
    );
    expect(content).not.toContain('isolation:');
  });

  it('flutter-architect frontmatter does not contain memory field', async () => {
    await writeAgents(makeContext(), tmp.path);
    const content = await readFile(
      join(tmp.path, '.claude', 'agents', 'flutter-architect.md'),
      'utf-8',
    );
    expect(content).not.toContain('memory:');
  });

  it('flutter-tester frontmatter contains isolation: worktree', async () => {
    await writeAgents(makeContext(), tmp.path);
    const content = await readFile(
      join(tmp.path, '.claude', 'agents', 'flutter-tester.md'),
      'utf-8',
    );
    expect(content).toContain('isolation: worktree');
  });

  it('writes flutter-architect.md with valid frontmatter', async () => {
    await writeAgents(makeContext(), tmp.path);
    const content = await readFile(
      join(tmp.path, '.claude', 'agents', 'flutter-architect.md'),
      'utf-8',
    );
    expect(content).toMatch(/^---\n/);
    expect(content).toContain('name: flutter-architect');
    expect(content).toContain('model: opus');
    expect(content).toContain('tools:');
    expect(content).toMatch(/---\n\n/);
  });
});
