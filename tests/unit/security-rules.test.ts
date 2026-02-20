import { writeRules } from '../../src/claude-setup/rules-writer.js';
import { makeTestContext } from '../helpers/context-factory.js';
import { useTempDir } from '../helpers/temp-dir.js';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

describe('security rules content', () => {
  const tmp = useTempDir('security-rules-test-');

  async function getSecurityContent(): Promise<string> {
    const ctx = makeTestContext({ claude: { enabled: true, agentTeams: false } });
    await writeRules(ctx, tmp.path);
    return readFile(join(tmp.path, '.claude', 'rules', 'security.md'), 'utf-8');
  }

  it('covers secrets and credentials', async () => {
    const content = await getSecurityContent();
    expect(content.toLowerCase()).toMatch(/secret|credential|hardcod|flutter_secure_storage/);
  });

  it('covers input validation and sanitization', async () => {
    const content = await getSecurityContent();
    expect(content.toLowerCase()).toMatch(/validat|sanitiz/);
  });

  it('covers API security with HTTPS and token handling', async () => {
    const content = await getSecurityContent();
    expect(content.toLowerCase()).toMatch(/https|certificate|token/);
  });

  it('covers data handling including PII, logging, and encryption', async () => {
    const content = await getSecurityContent();
    expect(content.toLowerCase()).toMatch(/pii|logging|encryption/);
  });

  it('covers dependency security', async () => {
    const content = await getSecurityContent();
    expect(content.toLowerCase()).toMatch(/depend|package|pub\.dev|trusted/);
  });

  it('applies to all code paths (broad path glob)', async () => {
    const content = await getSecurityContent();
    // Frontmatter should include "**" to cover all files, not just lib/**
    expect(content).toMatch(/"\*\*"|"lib\/\*\*"/);
  });
});
