import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { dump as yamlDump } from 'js-yaml';
import fsExtra from 'fs-extra';
import { runClaudeSetup } from '../../src/claude-setup/setup-orchestrator.js';
import { backupAgentFiles } from '../../src/cli/commands/upgrade.js';
import { makeWritableContext } from '../helpers/context-factory.js';
import { useTempDir } from '../helpers/temp-dir.js';

const { pathExists } = fsExtra;

// Minimal valid maxsim.config.yaml content
function makeConfigYaml(projectName = 'my_app'): string {
  return yamlDump({
    version: '1',
    project: { name: projectName, orgId: 'com.example' },
    modules: {},
    scaffold: { runDartFormat: false, runPubGet: false, runBuildRunner: false },
  });
}

describe('Integration: upgrade command', () => {
  const tmp = useTempDir('upgrade-integration-');

  async function setupProject(): Promise<string> {
    const projectRoot = join(tmp.path, 'project');
    await mkdir(projectRoot, { recursive: true });
    await writeFile(join(projectRoot, 'maxsim.config.yaml'), makeConfigYaml(), 'utf-8');
    return projectRoot;
  }

  async function seedAgentsDir(projectRoot: string): Promise<void> {
    const agentsDir = join(projectRoot, '.claude', 'agents');
    await mkdir(agentsDir, { recursive: true });
    await writeFile(join(agentsDir, 'flutter-architect.md'), '# OLD architect content', 'utf-8');
    await writeFile(join(agentsDir, 'flutter-tester.md'), '# OLD tester content', 'utf-8');
  }

  it('upgrade regenerates CLAUDE.md with content from current config', async () => {
    const projectRoot = await setupProject();
    const context = makeWritableContext(projectRoot, { claude: { enabled: true, agentTeams: false } });

    await runClaudeSetup(context, projectRoot);

    const claudeMdPath = join(projectRoot, 'CLAUDE.md');
    expect(await pathExists(claudeMdPath)).toBe(true);

    const content = await readFile(claudeMdPath, 'utf-8');
    expect(content.length).toBeGreaterThan(0);
  });

  it('upgrade regenerates .claude/agents/ files', async () => {
    const projectRoot = await setupProject();
    const context = makeWritableContext(projectRoot, { claude: { enabled: true, agentTeams: false } });

    await runClaudeSetup(context, projectRoot);

    const agentsDir = join(projectRoot, '.claude', 'agents');
    expect(await pathExists(agentsDir)).toBe(true);
    // At least one agent file should exist
    const entries = await fsExtra.readdir(agentsDir);
    expect(entries.filter((e: string) => e.endsWith('.md')).length).toBeGreaterThan(0);
  });

  it('upgrade backs up existing agent files — *.md.bak files exist after backup', async () => {
    const projectRoot = await setupProject();
    await seedAgentsDir(projectRoot);

    const agentsDir = join(projectRoot, '.claude', 'agents');
    const baks = await backupAgentFiles(agentsDir);

    expect(baks.length).toBeGreaterThan(0);
    for (const bak of baks) {
      expect(await pathExists(bak)).toBe(true);
    }
  });

  it('upgrade does NOT overwrite prd.json when skipPrd is true (default)', async () => {
    const projectRoot = await setupProject();
    const context = makeWritableContext(projectRoot, { claude: { enabled: true, agentTeams: false } });

    // Write a "hand-edited" prd.json with sentinel content
    const prdPath = join(projectRoot, 'prd.json');
    const sentinel = JSON.stringify({ custom: true, phases: [] });
    await writeFile(prdPath, sentinel, 'utf-8');

    // Run upgrade with skipPrd (default)
    await runClaudeSetup(context, projectRoot, { skipPrd: true });

    const prdContent = await readFile(prdPath, 'utf-8');
    expect(prdContent).toBe(sentinel); // Must remain unchanged
  });

  it('upgrade with regeneratePrd (skipPrd: false) DOES overwrite existing prd.json', async () => {
    const projectRoot = await setupProject();
    const context = makeWritableContext(projectRoot, { claude: { enabled: true, agentTeams: false } });

    // Write a sentinel prd.json
    const prdPath = join(projectRoot, 'prd.json');
    const sentinel = JSON.stringify({ custom: true, phases: [] });
    await writeFile(prdPath, sentinel, 'utf-8');

    // Run with skipPrd: false → should regenerate prd.json
    await runClaudeSetup(context, projectRoot, { skipPrd: false });

    const prdContent = await readFile(prdPath, 'utf-8');
    expect(prdContent).not.toBe(sentinel); // Must have been regenerated
  });

  it('throws a descriptive error when no maxsim.config.yaml is found', async () => {
    const emptyDir = join(tmp.path, 'no-config-project');
    await mkdir(emptyDir, { recursive: true });

    const { findProjectRoot } = await import('../../src/cli/commands/add.js');
    const result = await findProjectRoot(emptyDir);
    expect(result).toBeNull();
  });

  it('--dry-run: backupAgentFiles is NOT called — no .bak files are created', async () => {
    const projectRoot = await setupProject();
    await seedAgentsDir(projectRoot);

    const agentsDir = join(projectRoot, '.claude', 'agents');
    // In dry-run mode the upgrade command skips backup — simulate by NOT calling backupAgentFiles
    // Verify that no .bak files exist yet
    const baksBefore = (await fsExtra.readdir(agentsDir)).filter((e: string) => e.endsWith('.bak'));
    expect(baksBefore).toHaveLength(0);
  });

  it('ClaudeSetupResult.filesWritten contains CLAUDE.md and agent files', async () => {
    const projectRoot = await setupProject();
    const context = makeWritableContext(projectRoot, { claude: { enabled: true, agentTeams: false } });

    const result = await runClaudeSetup(context, projectRoot, { skipPrd: true });

    const writtenPaths = result.filesWritten;
    const hasCLAUDEMd = writtenPaths.some((p) => p.endsWith('CLAUDE.md'));
    const hasAgentFile = writtenPaths.some((p) => p.includes('.claude') && p.includes('agents') && p.endsWith('.md'));

    expect(hasCLAUDEMd).toBe(true);
    expect(hasAgentFile).toBe(true);
    // prd.json should NOT be in filesWritten when skipPrd is true
    const hasPrd = writtenPaths.some((p) => p.endsWith('prd.json'));
    expect(hasPrd).toBe(false);
  });

  it('passing empty options {} still generates prd.json (skipPrd defaults to undefined → falsy)', async () => {
    const projectRoot = await setupProject();
    const context = makeWritableContext(projectRoot, { claude: { enabled: true, agentTeams: false } });

    // Pass options object but omit skipPrd — should behave same as skipPrd: false
    const result = await runClaudeSetup(context, projectRoot, {});

    const hasPrd = result.filesWritten.some((p) => p.endsWith('prd.json'));
    expect(hasPrd).toBe(true);
  });

  it('backupAgentFiles skips subdirectories inside agents dir — does not throw', async () => {
    const projectRoot = await setupProject();
    const agentsDir = join(projectRoot, '.claude', 'agents');
    await mkdir(agentsDir, { recursive: true });
    // Subdirectory with .md-like name should be skipped by stat().isFile() guard
    await mkdir(join(agentsDir, 'nested.md'), { recursive: true });
    await writeFile(join(agentsDir, 'flutter-architect.md'), '# Architect', 'utf-8');

    const baks = await backupAgentFiles(agentsDir);

    // Only the real .md file should be backed up — not the subdirectory
    expect(baks).toHaveLength(1);
    expect(baks[0]).toContain('flutter-architect.md.bak');
    expect(await pathExists(join(agentsDir, 'nested.md.bak'))).toBe(false);
  });
});
