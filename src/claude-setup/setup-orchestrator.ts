import { writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import type { ProjectContext } from '../core/context.js';
import { generateClaudeMd } from './claude-md-generator.js';
import { writeAgents } from './agent-writer.js';
import { writeSkills } from './skill-writer.js';
import { writeHooks } from './hooks-writer.js';
import { writeMcpConfig } from './mcp-config-writer.js';
import { writeCommands } from './commands-writer.js';
import { generatePrd } from './prd-generator.js';

export interface ClaudeSetupResult {
  filesWritten: string[];
}

/**
 * Runs the full Claude setup for a scaffolded Flutter project.
 * Generates CLAUDE.md, agent definitions, skills, hooks, MCP config,
 * slash commands, and prd.json.
 */
export async function runClaudeSetup(
  context: ProjectContext,
  outputPath: string,
): Promise<ClaudeSetupResult> {
  const filesWritten: string[] = [];

  // Ensure .claude directory exists
  await mkdir(join(outputPath, '.claude'), { recursive: true });

  // 1. Generate and write CLAUDE.md
  const claudeMdContent = generateClaudeMd(context);
  const claudeMdPath = join(outputPath, 'CLAUDE.md');
  await writeFile(claudeMdPath, claudeMdContent, 'utf-8');
  filesWritten.push(claudeMdPath);

  // 2. Write agent definition files (.claude/agents/)
  const agentFiles = await writeAgents(context, outputPath);
  filesWritten.push(...agentFiles);

  // 3. Write skill files (.claude/skills/)
  await writeSkills(context, outputPath);
  filesWritten.push(
    join(outputPath, '.claude', 'skills', 'flutter-patterns.md'),
    join(outputPath, '.claude', 'skills', 'go-router-patterns.md'),
    join(outputPath, '.claude', 'skills', 'module-conventions.md'),
    join(outputPath, '.claude', 'skills', 'prd.md'),
  );

  // 4. Write hooks config (.claude/settings.local.json)
  await writeHooks(context, outputPath);
  filesWritten.push(join(outputPath, '.claude', 'settings.local.json'));

  // 5. Write MCP server config (.mcp.json)
  await writeMcpConfig(context, outputPath);
  filesWritten.push(join(outputPath, '.mcp.json'));

  // 6. Write slash commands (.claude/commands/)
  await writeCommands(context, outputPath);
  filesWritten.push(
    join(outputPath, '.claude', 'commands', 'add-feature.md'),
    join(outputPath, '.claude', 'commands', 'analyze.md'),
  );

  // 7. Generate and write prd.json
  const prdContent = generatePrd(context);
  const prdPath = join(outputPath, 'prd.json');
  await writeFile(prdPath, prdContent, 'utf-8');
  filesWritten.push(prdPath);

  return { filesWritten };
}
