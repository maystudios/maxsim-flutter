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

  it('flutter-reviewer has model sonnet', () => {
    const agents = buildAgentDefinitions(context);
    const reviewer = agents.find((a) => a.filename === 'flutter-reviewer.md');
    expect(reviewer).toBeDefined();
    expect(reviewer?.model).toBe('sonnet');
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

describe('P12-001: Error Recovery Protocol in all agents', () => {
  const context = makeTestContext({ projectName: 'test_app' });

  it('each agent body includes Error Recovery Protocol section', () => {
    const agents = buildAgentDefinitions(context);
    for (const agent of agents) {
      expect(agent.body).toContain('Error Recovery Protocol');
    }
  });

  it('each agent body includes Self-Correction step', () => {
    const agents = buildAgentDefinitions(context);
    for (const agent of agents) {
      expect(agent.body).toContain('Self-Correction');
    }
  });

  it('each agent body includes AI-to-AI Escalation step', () => {
    const agents = buildAgentDefinitions(context);
    for (const agent of agents) {
      expect(agent.body).toContain('AI-to-AI Escalation');
    }
  });

  it('each agent body includes Human-Augmented step', () => {
    const agents = buildAgentDefinitions(context);
    for (const agent of agents) {
      expect(agent.body).toContain('Human-Augmented');
    }
  });

  it('each agent body includes Full Human Takeover step', () => {
    const agents = buildAgentDefinitions(context);
    for (const agent of agents) {
      expect(agent.body).toContain('Full Human Takeover');
    }
  });
});

describe('P12-001: Context Management in all agents', () => {
  const context = makeTestContext({ projectName: 'test_app' });

  it('each agent body includes Context Management section', () => {
    const agents = buildAgentDefinitions(context);
    for (const agent of agents) {
      expect(agent.body).toContain('Context Management');
    }
  });

  it('each agent body mentions 70% context threshold', () => {
    const agents = buildAgentDefinitions(context);
    for (const agent of agents) {
      expect(agent.body).toContain('70%');
    }
  });

  it('each agent body mentions /clear guidance', () => {
    const agents = buildAgentDefinitions(context);
    for (const agent of agents) {
      expect(agent.body).toContain('/clear');
    }
  });

  it('each agent body mentions subagent delegation for context management', () => {
    const agents = buildAgentDefinitions(context);
    for (const agent of agents) {
      const bodyLower = agent.body.toLowerCase();
      expect(
        bodyLower.includes('subagent') ||
        bodyLower.includes('sub-agent') ||
        bodyLower.includes('haiku'),
      ).toBe(true);
    }
  });
});

describe('P12-001: Handoff Format in all agents', () => {
  const context = makeTestContext({ projectName: 'test_app' });

  it('each agent body includes Handoff Format section', () => {
    const agents = buildAgentDefinitions(context);
    for (const agent of agents) {
      expect(agent.body).toContain('Handoff Format');
    }
  });

  it('each agent body includes Changed files item', () => {
    const agents = buildAgentDefinitions(context);
    for (const agent of agents) {
      expect(agent.body).toContain('Changed files');
    }
  });

  it('each agent body includes Tests added/modified item', () => {
    const agents = buildAgentDefinitions(context);
    for (const agent of agents) {
      expect(agent.body).toContain('Tests added');
    }
  });

  it('each agent body includes Quality status item', () => {
    const agents = buildAgentDefinitions(context);
    for (const agent of agents) {
      expect(agent.body).toContain('Quality status');
    }
  });

  it('each agent body includes Blockers item', () => {
    const agents = buildAgentDefinitions(context);
    for (const agent of agents) {
      expect(agent.body).toContain('Blockers');
    }
  });

  it('each agent body includes Next step item', () => {
    const agents = buildAgentDefinitions(context);
    for (const agent of agents) {
      expect(agent.body).toContain('Next step');
    }
  });
});

// ─── P12-002: SDD agents (specifier + planner) ─────────────────────────────

describe('P12-002: flutter-specifier agent', () => {
  const context = makeTestContext({ projectName: 'test_app', claude: { enabled: true, agentTeams: true } });

  it('returns 6 agents when agentTeams is true', () => {
    const agents = buildAgentDefinitions(context);
    expect(agents).toHaveLength(6);
  });

  it('returns 4 agents when agentTeams is false', () => {
    const ctx = makeTestContext({ projectName: 'test_app', claude: { enabled: true, agentTeams: false } });
    const agents = buildAgentDefinitions(ctx);
    expect(agents).toHaveLength(4);
  });

  it('flutter-specifier uses opus model', () => {
    const agents = buildAgentDefinitions(context);
    const specifier = agents.find((a) => a.name === 'flutter-specifier');
    expect(specifier).toBeDefined();
    expect(specifier?.model).toBe('opus');
  });

  it('flutter-specifier has read-only tools plus WebSearch', () => {
    const agents = buildAgentDefinitions(context);
    const specifier = agents.find((a) => a.name === 'flutter-specifier');
    expect(specifier?.tools).toEqual(expect.arrayContaining(['Read', 'Grep', 'Glob', 'WebSearch']));
    expect(specifier?.tools).toHaveLength(4);
    expect(specifier?.tools).not.toContain('Write');
    expect(specifier?.tools).not.toContain('Edit');
    expect(specifier?.tools).not.toContain('Bash');
  });

  it('flutter-specifier has maxTurns of 30', () => {
    const agents = buildAgentDefinitions(context);
    const specifier = agents.find((a) => a.name === 'flutter-specifier');
    expect(specifier?.maxTurns).toBe(30);
  });

  it('flutter-specifier body contains Error Recovery Protocol', () => {
    const agents = buildAgentDefinitions(context);
    const specifier = agents.find((a) => a.name === 'flutter-specifier');
    expect(specifier?.body).toContain('Error Recovery Protocol');
  });

  it('flutter-specifier body contains Context Management', () => {
    const agents = buildAgentDefinitions(context);
    const specifier = agents.find((a) => a.name === 'flutter-specifier');
    expect(specifier?.body).toContain('Context Management');
  });

  it('flutter-specifier body includes project name', () => {
    const agents = buildAgentDefinitions(context);
    const specifier = agents.find((a) => a.name === 'flutter-specifier');
    expect(specifier?.body).toContain('test_app');
  });
});

describe('P12-002: flutter-planner agent', () => {
  const context = makeTestContext({ projectName: 'test_app', claude: { enabled: true, agentTeams: true } });

  it('flutter-planner uses sonnet model', () => {
    const agents = buildAgentDefinitions(context);
    const planner = agents.find((a) => a.name === 'flutter-planner');
    expect(planner).toBeDefined();
    expect(planner?.model).toBe('sonnet');
  });

  it('flutter-planner has read-only tools: Read, Grep, Glob', () => {
    const agents = buildAgentDefinitions(context);
    const planner = agents.find((a) => a.name === 'flutter-planner');
    expect(planner?.tools).toEqual(expect.arrayContaining(['Read', 'Grep', 'Glob']));
    expect(planner?.tools).toHaveLength(3);
    expect(planner?.tools).not.toContain('Write');
    expect(planner?.tools).not.toContain('Edit');
    expect(planner?.tools).not.toContain('Bash');
    expect(planner?.tools).not.toContain('WebSearch');
  });

  it('flutter-planner has maxTurns of 25', () => {
    const agents = buildAgentDefinitions(context);
    const planner = agents.find((a) => a.name === 'flutter-planner');
    expect(planner?.maxTurns).toBe(25);
  });

  it('flutter-planner body contains Error Recovery Protocol', () => {
    const agents = buildAgentDefinitions(context);
    const planner = agents.find((a) => a.name === 'flutter-planner');
    expect(planner?.body).toContain('Error Recovery Protocol');
  });

  it('flutter-planner body contains Context Management', () => {
    const agents = buildAgentDefinitions(context);
    const planner = agents.find((a) => a.name === 'flutter-planner');
    expect(planner?.body).toContain('Context Management');
  });

  it('flutter-planner body includes project name', () => {
    const agents = buildAgentDefinitions(context);
    const planner = agents.find((a) => a.name === 'flutter-planner');
    expect(planner?.body).toContain('test_app');
  });

  it('flutter-planner is not included when agentTeams is false', () => {
    const ctx = makeTestContext({ projectName: 'test_app', claude: { enabled: true, agentTeams: false } });
    const agents = buildAgentDefinitions(ctx);
    const planner = agents.find((a) => a.name === 'flutter-planner');
    expect(planner).toBeUndefined();
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
