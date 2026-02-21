import { describe, it, expect } from '@jest/globals';
import { makeTestContext } from '../helpers/context-factory.js';
import { buildAgentDefinitions, writeAgents } from '../../src/claude-setup/agent-writer.js';
import { useTempDir } from '../helpers/temp-dir.js';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

// ─── Agent field completeness ──────────────────────────────────────────────

describe('buildAgentDefinitions: tester and reviewer include project name', () => {
  const context = makeTestContext({ projectName: 'edge_case_app' });

  it('flutter-tester body includes project name', () => {
    const agents = buildAgentDefinitions(context);
    const tester = agents.find((a) => a.name === 'flutter-tester')!;
    expect(tester.body).toContain('edge_case_app');
  });

  it('flutter-reviewer body includes project name', () => {
    const agents = buildAgentDefinitions(context);
    const reviewer = agents.find((a) => a.name === 'flutter-reviewer')!;
    expect(reviewer.body).toContain('edge_case_app');
  });
});

describe('buildAgentDefinitions: optional fields are absent when not applicable', () => {
  const context = makeTestContext({ projectName: 'test_app' });

  it('flutter-architect has no isolation field', () => {
    const agents = buildAgentDefinitions(context);
    const architect = agents.find((a) => a.name === 'flutter-architect')!;
    expect(architect.isolation).toBeUndefined();
  });

  it('flutter-architect has no memory field', () => {
    const agents = buildAgentDefinitions(context);
    const architect = agents.find((a) => a.name === 'flutter-architect')!;
    expect(architect.memory).toBeUndefined();
  });

  it('flutter-builder has no memory field', () => {
    const agents = buildAgentDefinitions(context);
    const builder = agents.find((a) => a.name === 'flutter-builder')!;
    expect(builder.memory).toBeUndefined();
  });

  it('flutter-tester has no memory field', () => {
    const agents = buildAgentDefinitions(context);
    const tester = agents.find((a) => a.name === 'flutter-tester')!;
    expect(tester.memory).toBeUndefined();
  });

  it('flutter-reviewer has no isolation field', () => {
    const agents = buildAgentDefinitions(context);
    const reviewer = agents.find((a) => a.name === 'flutter-reviewer')!;
    expect(reviewer.isolation).toBeUndefined();
  });
});

describe('buildAgentDefinitions: agent descriptions are non-empty and descriptive', () => {
  const context = makeTestContext({ projectName: 'test_app' });

  it('all agents have a non-empty description', () => {
    const agents = buildAgentDefinitions(context);
    for (const agent of agents) {
      expect(agent.description).toBeTruthy();
      expect(agent.description.length).toBeGreaterThan(10);
    }
  });

  it('flutter-architect description references planning or read-only role', () => {
    const agents = buildAgentDefinitions(context);
    const architect = agents.find((a) => a.name === 'flutter-architect')!;
    const descLower = architect.description.toLowerCase();
    expect(
      descLower.includes('planning') || descLower.includes('read-only') || descLower.includes('design'),
    ).toBe(true);
  });

  it('flutter-builder description references implementation', () => {
    const agents = buildAgentDefinitions(context);
    const builder = agents.find((a) => a.name === 'flutter-builder')!;
    const descLower = builder.description.toLowerCase();
    expect(descLower.includes('implement')).toBe(true);
  });

  it('flutter-tester description references testing or TDD', () => {
    const agents = buildAgentDefinitions(context);
    const tester = agents.find((a) => a.name === 'flutter-tester')!;
    const descLower = tester.description.toLowerCase();
    expect(
      descLower.includes('test') || descLower.includes('tdd'),
    ).toBe(true);
  });

  it('flutter-reviewer description references review or compliance', () => {
    const agents = buildAgentDefinitions(context);
    const reviewer = agents.find((a) => a.name === 'flutter-reviewer')!;
    const descLower = reviewer.description.toLowerCase();
    expect(
      descLower.includes('review') || descLower.includes('compliance') || descLower.includes('read-only'),
    ).toBe(true);
  });
});

// ─── P12-001: Description trigger phrases ──────────────────────────────────

describe('P12-001: agent descriptions include WHEN-to-use trigger phrases', () => {
  const context = makeTestContext({ projectName: 'test_app' });

  it('flutter-architect description includes trigger phrases for design/architecture', () => {
    const agents = buildAgentDefinitions(context);
    const architect = agents.find((a) => a.name === 'flutter-architect')!;
    const descLower = architect.description.toLowerCase();
    expect(descLower).toContain('triggers on');
    expect(descLower.includes('design') || descLower.includes('architecture')).toBe(true);
  });

  it('flutter-builder description includes trigger phrases for implement/build', () => {
    const agents = buildAgentDefinitions(context);
    const builder = agents.find((a) => a.name === 'flutter-builder')!;
    const descLower = builder.description.toLowerCase();
    expect(descLower).toContain('triggers on');
    expect(descLower.includes('implement') || descLower.includes('build')).toBe(true);
  });

  it('flutter-tester description includes trigger phrases for test/coverage', () => {
    const agents = buildAgentDefinitions(context);
    const tester = agents.find((a) => a.name === 'flutter-tester')!;
    const descLower = tester.description.toLowerCase();
    expect(descLower).toContain('triggers on');
    expect(descLower.includes('test') || descLower.includes('coverage')).toBe(true);
  });

  it('flutter-reviewer description includes trigger phrases for review/compliance', () => {
    const agents = buildAgentDefinitions(context);
    const reviewer = agents.find((a) => a.name === 'flutter-reviewer')!;
    const descLower = reviewer.description.toLowerCase();
    expect(descLower).toContain('triggers on');
    expect(descLower.includes('review') || descLower.includes('compliance')).toBe(true);
  });

  it('flutter-reviewer uses sonnet model (upgraded from haiku)', () => {
    const agents = buildAgentDefinitions(context);
    const reviewer = agents.find((a) => a.name === 'flutter-reviewer')!;
    expect(reviewer.model).toBe('sonnet');
  });
});

// ─── formatAgentMarkdown: frontmatter correctness ─────────────────────────

describe('formatAgentMarkdown: frontmatter does not emit undefined or null values', () => {
  const tmp = useTempDir('agent-writer-frontmatter-edge-');

  function makeContext() {
    return makeTestContext({ claude: { enabled: true, agentTeams: true } });
  }

  it('no agent file contains "maxTurns: undefined"', async () => {
    await writeAgents(makeContext(), tmp.path);
    for (const file of ['flutter-architect.md', 'flutter-builder.md', 'flutter-tester.md', 'flutter-reviewer.md', 'flutter-specifier.md', 'flutter-planner.md']) {
      const content = await readFile(join(tmp.path, '.claude', 'agents', file), 'utf-8');
      expect(content).not.toContain('maxTurns: undefined');
    }
  });

  it('no agent file contains "isolation: undefined"', async () => {
    await writeAgents(makeContext(), tmp.path);
    for (const file of ['flutter-architect.md', 'flutter-builder.md', 'flutter-tester.md', 'flutter-reviewer.md', 'flutter-specifier.md', 'flutter-planner.md']) {
      const content = await readFile(join(tmp.path, '.claude', 'agents', file), 'utf-8');
      expect(content).not.toContain('isolation: undefined');
    }
  });

  it('no agent file contains "memory: undefined"', async () => {
    await writeAgents(makeContext(), tmp.path);
    for (const file of ['flutter-architect.md', 'flutter-builder.md', 'flutter-tester.md', 'flutter-reviewer.md', 'flutter-specifier.md', 'flutter-planner.md']) {
      const content = await readFile(join(tmp.path, '.claude', 'agents', file), 'utf-8');
      expect(content).not.toContain('memory: undefined');
    }
  });

  it('flutter-builder frontmatter contains description field', async () => {
    await writeAgents(makeContext(), tmp.path);
    const content = await readFile(join(tmp.path, '.claude', 'agents', 'flutter-builder.md'), 'utf-8');
    const frontmatterEnd = content.indexOf('\n---\n');
    const frontmatter = content.substring(0, frontmatterEnd);
    expect(frontmatter).toContain('description:');
  });

  it('flutter-builder frontmatter field order: name → description → model → tools → isolation → maxTurns', async () => {
    await writeAgents(makeContext(), tmp.path);
    const content = await readFile(join(tmp.path, '.claude', 'agents', 'flutter-builder.md'), 'utf-8');
    const namePos = content.indexOf('name:');
    const descPos = content.indexOf('description:');
    const modelPos = content.indexOf('model:');
    const toolsPos = content.indexOf('tools:');
    const isoPos = content.indexOf('isolation:');
    const maxTurnsPos = content.indexOf('maxTurns:');
    expect(namePos).toBeLessThan(descPos);
    expect(descPos).toBeLessThan(modelPos);
    expect(modelPos).toBeLessThan(toolsPos);
    expect(toolsPos).toBeLessThan(isoPos);
    expect(isoPos).toBeLessThan(maxTurnsPos);
  });

  it('flutter-reviewer frontmatter field order: name → description → model → tools → memory → maxTurns', async () => {
    await writeAgents(makeContext(), tmp.path);
    const content = await readFile(join(tmp.path, '.claude', 'agents', 'flutter-reviewer.md'), 'utf-8');
    const namePos = content.indexOf('name:');
    const descPos = content.indexOf('description:');
    const modelPos = content.indexOf('model:');
    const toolsPos = content.indexOf('tools:');
    const memPos = content.indexOf('memory:');
    const maxTurnsPos = content.indexOf('maxTurns:');
    expect(namePos).toBeLessThan(descPos);
    expect(descPos).toBeLessThan(modelPos);
    expect(modelPos).toBeLessThan(toolsPos);
    expect(toolsPos).toBeLessThan(memPos);
    expect(memPos).toBeLessThan(maxTurnsPos);
  });
});

// ─── writeAgents idempotency ───────────────────────────────────────────────

describe('writeAgents: idempotency', () => {
  const tmp = useTempDir('agent-writer-idempotent-');

  function makeContext(projectName = 'test_app') {
    return makeTestContext({
      projectName,
      claude: { enabled: true, agentTeams: true },
    });
  }

  it('can be called twice on the same directory without throwing', async () => {
    await writeAgents(makeContext(), tmp.path);
    await expect(writeAgents(makeContext(), tmp.path)).resolves.not.toThrow();
  });

  it('overwrites existing agent files on second call with new project name', async () => {
    await writeAgents(makeContext('first_app'), tmp.path);
    await writeAgents(makeContext('second_app'), tmp.path);
    const content = await readFile(
      join(tmp.path, '.claude', 'agents', 'flutter-builder.md'),
      'utf-8',
    );
    expect(content).toContain('second_app');
    expect(content).not.toContain('first_app');
  });

  it('second call returns 6 file paths', async () => {
    await writeAgents(makeContext(), tmp.path);
    const files = await writeAgents(makeContext(), tmp.path);
    expect(files).toHaveLength(6);
  });
});

// ─── Module context: individual module branches ────────────────────────────

describe('buildModuleContext: individual module branches', () => {
  function makeContextWithModule(modulePatch: Partial<ReturnType<typeof makeTestContext>['modules']>) {
    return makeTestContext({
      modules: { ...makeTestContext().modules, ...modulePatch },
    });
  }

  it('lists only database when only database is enabled', () => {
    const ctx = makeContextWithModule({ database: { engine: 'drift' } });
    const agents = buildAgentDefinitions(ctx);
    for (const agent of agents) {
      expect(agent.body).toContain('Active modules: database');
    }
  });

  it('lists only i18n when only i18n is enabled', () => {
    const ctx = makeContextWithModule({ i18n: { defaultLocale: 'en', supportedLocales: ['en'] } });
    const agents = buildAgentDefinitions(ctx);
    for (const agent of agents) {
      expect(agent.body).toContain('Active modules: i18n');
    }
  });

  it('lists only push when only push is enabled', () => {
    const ctx = makeContextWithModule({ push: { provider: 'firebase' } });
    const agents = buildAgentDefinitions(ctx);
    for (const agent of agents) {
      expect(agent.body).toContain('Active modules: push');
    }
  });

  it('lists only analytics when only analytics is enabled', () => {
    const ctx = makeContextWithModule({ analytics: { enabled: true } });
    const agents = buildAgentDefinitions(ctx);
    for (const agent of agents) {
      expect(agent.body).toContain('Active modules: analytics');
    }
  });

  it('lists only cicd when only cicd is enabled', () => {
    const ctx = makeContextWithModule({ cicd: { provider: 'github' } });
    const agents = buildAgentDefinitions(ctx);
    for (const agent of agents) {
      expect(agent.body).toContain('Active modules: cicd');
    }
  });

  it('lists only deep-linking when only deepLinking is enabled', () => {
    const ctx = makeContextWithModule({ deepLinking: { scheme: 'myapp', host: 'example.com' } });
    const agents = buildAgentDefinitions(ctx);
    for (const agent of agents) {
      expect(agent.body).toContain('Active modules: deep-linking');
    }
  });

  it('includes module inter-dependency warning when multiple modules are active', () => {
    const ctx = makeContextWithModule({
      auth: { provider: 'firebase' },
      api: { baseUrl: 'https://api.test.com' },
    });
    const agents = buildAgentDefinitions(ctx);
    for (const agent of agents) {
      expect(agent.body).toContain('inter-module dependencies');
    }
  });
});
