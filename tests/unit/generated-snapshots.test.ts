import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

import { buildAgentDefinitions } from '../../src/claude-setup/agent-writer.js';
import { generateClaudeMd } from '../../src/claude-setup/claude-md-generator.js';
import { generatePrd } from '../../src/claude-setup/prd-generator.js';
import { writeRules } from '../../src/claude-setup/rules-writer.js';
import { makeTestContext } from '../helpers/context-factory.js';
import { useTempDir } from '../helpers/temp-dir.js';

describe('Generated file snapshots', () => {
  const tmp = useTempDir('snapshot-test-');

  const standardAuthApiCtx = makeTestContext({
    claude: { enabled: true, agentTeams: false, preset: 'standard' },
    modules: {
      ...makeTestContext().modules,
      auth: { provider: 'firebase' },
      api: { baseUrl: 'https://api.example.com' },
    },
  });

  it('CLAUDE.md matches snapshot (standard preset, auth+api)', () => {
    const content = generateClaudeMd(standardAuthApiCtx);
    expect(content).toMatchSnapshot();
  });

  it('architecture.md rule matches snapshot', async () => {
    await writeRules(standardAuthApiCtx, tmp.path);
    const content = await readFile(
      join(tmp.path, '.claude', 'rules', 'architecture.md'),
      'utf-8',
    );
    expect(content).toMatchSnapshot();
  });

  it('security.md rule matches snapshot', async () => {
    await writeRules(standardAuthApiCtx, tmp.path);
    const content = await readFile(join(tmp.path, '.claude', 'rules', 'security.md'), 'utf-8');
    expect(content).toMatchSnapshot();
  });

  it('flutter-builder agent matches snapshot', () => {
    const agents = buildAgentDefinitions(standardAuthApiCtx);
    const builder = agents.find((a) => a.filename === 'flutter-builder.md');
    expect(builder).toBeDefined();
    expect(
      `---\nname: ${builder!.name}\ndescription: ${builder!.description}\nmodel: ${builder!.model}\ntools: ${JSON.stringify(builder!.tools)}\n---\n\n${builder!.body}\n`,
    ).toMatchSnapshot();
  });

  it('prd.json matches snapshot (standard preset, auth module)', () => {
    const authCtx = makeTestContext({
      claude: { enabled: true, agentTeams: false, preset: 'standard' },
      modules: {
        ...makeTestContext().modules,
        auth: { provider: 'firebase' },
      },
    });
    const raw = generatePrd(authCtx);
    // Replace non-deterministic timestamp with a fixed value for stable snapshots
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    parsed['generatedAt'] = '2024-01-01T00:00:00.000Z';
    expect(JSON.stringify(parsed, null, 2)).toMatchSnapshot();
  });
});
