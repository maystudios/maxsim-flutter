import { mkdir, writeFile, readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import fsExtra from 'fs-extra';
import { createUpgradeCommand, backupAgentFiles } from '../../src/cli/commands/upgrade.js';
import { useTempDir } from '../helpers/temp-dir.js';

const { pathExists } = fsExtra;

// ── Command structure tests ───────────────────────────────────────────────────

describe('createUpgradeCommand — command structure', () => {
  it('returns a Commander Command with name "upgrade"', () => {
    const cmd = createUpgradeCommand();
    expect(cmd.name()).toBe('upgrade');
  });

  it('has a --dry-run option', () => {
    const cmd = createUpgradeCommand();
    const opts = cmd.options.map((o) => o.long);
    expect(opts).toContain('--dry-run');
  });

  it('has a --yes option', () => {
    const cmd = createUpgradeCommand();
    const opts = cmd.options.map((o) => o.long);
    expect(opts).toContain('--yes');
  });

  it('has a --regenerate-prd option', () => {
    const cmd = createUpgradeCommand();
    const opts = cmd.options.map((o) => o.long);
    expect(opts).toContain('--regenerate-prd');
  });

  it('description contains "upgrade" or "refresh"', () => {
    const cmd = createUpgradeCommand();
    const desc = cmd.description().toLowerCase();
    expect(desc.includes('upgrade') || desc.includes('refresh')).toBe(true);
  });
});

// ── backupAgentFiles unit tests ───────────────────────────────────────────────

describe('backupAgentFiles', () => {
  const tmp = useTempDir('backup-agents-test-');

  it('returns empty array when agents directory does not exist', async () => {
    const nonexistent = join(tmp.path, '.claude', 'agents');
    const result = await backupAgentFiles(nonexistent);
    expect(result).toEqual([]);
  });

  it('returns empty array when agents directory is empty', async () => {
    const agentsDir = join(tmp.path, 'empty-agents');
    await mkdir(agentsDir, { recursive: true });

    const result = await backupAgentFiles(agentsDir);
    expect(result).toEqual([]);
  });

  it('copies flutter-architect.md → flutter-architect.md.bak and returns its path', async () => {
    const agentsDir = join(tmp.path, 'agents-single');
    await mkdir(agentsDir, { recursive: true });
    await writeFile(join(agentsDir, 'flutter-architect.md'), '# Architect', 'utf-8');

    const result = await backupAgentFiles(agentsDir);

    expect(result).toHaveLength(1);
    expect(result[0]).toBe(join(agentsDir, 'flutter-architect.md.bak'));
    expect(await pathExists(join(agentsDir, 'flutter-architect.md.bak'))).toBe(true);
  });

  it('backs up multiple .md files and returns all their .bak paths', async () => {
    const agentsDir = join(tmp.path, 'agents-multi');
    await mkdir(agentsDir, { recursive: true });
    const files = ['flutter-architect.md', 'flutter-feature-builder.md', 'flutter-tester.md'];
    for (const f of files) {
      await writeFile(join(agentsDir, f), `# ${f}`, 'utf-8');
    }

    const result = await backupAgentFiles(agentsDir);

    expect(result).toHaveLength(3);
    for (const f of files) {
      expect(result).toContain(join(agentsDir, `${f}.bak`));
    }
  });

  it('overwrites a pre-existing .bak file with the latest backup', async () => {
    const agentsDir = join(tmp.path, 'agents-overwrite');
    await mkdir(agentsDir, { recursive: true });
    await writeFile(join(agentsDir, 'flutter-architect.md'), 'version 1', 'utf-8');
    await writeFile(join(agentsDir, 'flutter-architect.md.bak'), 'old backup', 'utf-8');

    // Update original, then backup again
    await writeFile(join(agentsDir, 'flutter-architect.md'), 'version 2', 'utf-8');
    await backupAgentFiles(agentsDir);

    const bakContent = await readFile(join(agentsDir, 'flutter-architect.md.bak'), 'utf-8');
    expect(bakContent).toBe('version 2');
  });

  it('does NOT back up files without .md extension', async () => {
    const agentsDir = join(tmp.path, 'agents-mixed');
    await mkdir(agentsDir, { recursive: true });
    await writeFile(join(agentsDir, 'flutter-architect.md'), '# Architect', 'utf-8');
    await writeFile(join(agentsDir, '.gitkeep'), '', 'utf-8');
    await writeFile(join(agentsDir, 'README.txt'), 'readme', 'utf-8');

    const result = await backupAgentFiles(agentsDir);

    // Only the .md file should be backed up
    expect(result).toHaveLength(1);
    expect(result[0]).toContain('flutter-architect.md.bak');
    // Non-.md files should not have .bak counterparts
    expect(await pathExists(join(agentsDir, '.gitkeep.bak'))).toBe(false);
    expect(await pathExists(join(agentsDir, 'README.txt.bak'))).toBe(false);
  });

  it('does NOT back up a subdirectory even if it has a .md-like name', async () => {
    const agentsDir = join(tmp.path, 'agents-subdir');
    await mkdir(agentsDir, { recursive: true });
    // Create a subdirectory whose name ends in .md (edge case for stat().isFile() guard)
    const subdir = join(agentsDir, 'nested.md');
    await mkdir(subdir, { recursive: true });

    const result = await backupAgentFiles(agentsDir);

    // Subdirectory must not be backed up — stat().isFile() returns false
    expect(result).toEqual([]);
    expect(await pathExists(join(agentsDir, 'nested.md.bak'))).toBe(false);
  });

  it('does NOT back up .md.bak files — they do not end with .md', async () => {
    const agentsDir = join(tmp.path, 'agents-bak-only');
    await mkdir(agentsDir, { recursive: true });
    // Simulate a directory that only has pre-existing .bak files (no .md originals)
    await writeFile(join(agentsDir, 'flutter-architect.md.bak'), 'old backup', 'utf-8');
    await writeFile(join(agentsDir, 'flutter-tester.md.bak'), 'old backup', 'utf-8');

    const result = await backupAgentFiles(agentsDir);

    // .md.bak files don't end with '.md' — nothing should be backed up
    expect(result).toEqual([]);
  });
});
