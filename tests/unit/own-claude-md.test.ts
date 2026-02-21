import { readFile, access } from 'node:fs/promises';
import { join } from 'node:path';

const ROOT = process.cwd();

describe('own CLAUDE.md format', () => {
  let claudeMd: string;

  beforeAll(async () => {
    claudeMd = await readFile(join(ROOT, 'CLAUDE.md'), 'utf-8');
  });

  it('exists and is not empty', () => {
    expect(claudeMd.length).toBeGreaterThan(0);
  });

  it('references error-recovery.md rule', () => {
    expect(claudeMd).toContain('error-recovery.md');
  });

  it('references context-management.md rule', () => {
    expect(claudeMd).toContain('context-management.md');
  });

  it('contains Security section', () => {
    expect(claudeMd).toMatch(/## Security/);
  });

  it('is under 120 lines', () => {
    const lineCount = claudeMd.split('\n').length;
    expect(lineCount).toBeLessThanOrEqual(120);
  });

  it('error-recovery.md rule file exists', async () => {
    await expect(
      access(join(ROOT, '.claude', 'rules', 'error-recovery.md'))
    ).resolves.toBeUndefined();
  });

  it('context-management.md rule file exists', async () => {
    await expect(
      access(join(ROOT, '.claude', 'rules', 'context-management.md'))
    ).resolves.toBeUndefined();
  });
});
