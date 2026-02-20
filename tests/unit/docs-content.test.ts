import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

const ROOT = process.cwd();

describe('Documentation files — content validation', () => {
  it('CONTRIBUTING.md exists and is non-empty', async () => {
    const content = await readFile(join(ROOT, 'CONTRIBUTING.md'), 'utf-8');
    expect(content.length).toBeGreaterThan(0);
  });

  it('CONTRIBUTING.md contains a "How to Add a New Module" section', async () => {
    const content = await readFile(join(ROOT, 'CONTRIBUTING.md'), 'utf-8');
    expect(content).toMatch(/##\s+How to Add a New Module/);
  });

  it('CONTRIBUTING.md contains a "Quality Gates" section', async () => {
    const content = await readFile(join(ROOT, 'CONTRIBUTING.md'), 'utf-8');
    expect(content).toMatch(/##\s+Quality Gates/);
  });

  it('docs/architecture.md exists and is non-empty', async () => {
    const content = await readFile(join(ROOT, 'docs', 'architecture.md'), 'utf-8');
    expect(content.length).toBeGreaterThan(0);
  });

  it('docs/architecture.md contains an ASCII architecture diagram with src/ tree', async () => {
    const content = await readFile(join(ROOT, 'docs', 'architecture.md'), 'utf-8');
    expect(content).toMatch(/src\//);
    // Should contain a code block with directory tree structure
    expect(content).toMatch(/```[\s\S]*src\/[\s\S]*```/);
  });

  it('README.md Contributing section contains a link to CONTRIBUTING.md', async () => {
    const content = await readFile(join(ROOT, 'README.md'), 'utf-8');
    expect(content).toMatch(/\[CONTRIBUTING\.md\]\(CONTRIBUTING\.md\)/);
  });
});
