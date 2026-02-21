import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

const AGENTS_DIR = join(process.cwd(), '.claude', 'agents');

const EXPECTED_AGENTS = [
  'typescript-architect',
  'typescript-builder',
  'tdd-driver',
  'tester',
  'reviewer',
  'quality-gate-enforcer',
  'flutter-template-expert',
];

const OPUS_AGENTS = ['typescript-architect', 'typescript-builder', 'tdd-driver', 'flutter-template-expert'];
const SONNET_AGENTS = ['tester', 'reviewer', 'quality-gate-enforcer'];

async function readAgent(name: string): Promise<string> {
  return readFile(join(AGENTS_DIR, `${name}.md`), 'utf-8');
}

function extractFrontmatter(content: string): string {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  return match ? match[1] : '';
}

describe('own agent definitions format', () => {
  it('has all 7 agent files', async () => {
    for (const name of EXPECTED_AGENTS) {
      const content = await readAgent(name);
      expect(content.length).toBeGreaterThan(0);
    }
  });

  it.each(EXPECTED_AGENTS)('%s has model in YAML frontmatter', async (name) => {
    const content = await readAgent(name);
    const frontmatter = extractFrontmatter(content);
    expect(frontmatter).toMatch(/^model:\s/m);
  });

  it.each(OPUS_AGENTS)('%s has model: opus', async (name) => {
    const content = await readAgent(name);
    const frontmatter = extractFrontmatter(content);
    expect(frontmatter).toMatch(/^model:\s+opus$/m);
  });

  it.each(SONNET_AGENTS)('%s has model: sonnet', async (name) => {
    const content = await readAgent(name);
    const frontmatter = extractFrontmatter(content);
    expect(frontmatter).toMatch(/^model:\s+sonnet$/m);
  });

  it.each(EXPECTED_AGENTS)('%s contains Error Recovery section', async (name) => {
    const content = await readAgent(name);
    expect(content).toMatch(/## Error Recovery/);
  });

  it.each(EXPECTED_AGENTS)('%s contains Context Management section', async (name) => {
    const content = await readAgent(name);
    expect(content).toMatch(/## Context Management/);
  });

  it.each(EXPECTED_AGENTS)('%s has WHEN-to-use trigger description', async (name) => {
    const content = await readAgent(name);
    const frontmatter = extractFrontmatter(content);
    // description should contain trigger phrases
    expect(frontmatter).toMatch(/description:.*[Tt]rigger/);
  });
});
