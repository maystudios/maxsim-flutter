import { writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import type { ProjectContext } from '../core/context.js';
import { generateClaudeMd } from './claude-md-generator.js';
import { writeAgents } from './agent-writer.js';
import { writeSkills } from './skill-writer.js';
import { writeHooks } from './hooks-writer.js';
import { writeSettings } from './settings-writer.js';
import { writeMcpConfig } from './mcp-config-writer.js';
import { writeCommands } from './commands-writer.js';
import { writeRules } from './rules-writer.js';
import { resolvePreset } from './preset-resolver.js';
import { generatePrd } from './prd-generator.js';

export interface ClaudeSetupResult {
  filesWritten: string[];
}

/**
 * Options for runClaudeSetup. All fields optional for backward compatibility.
 */
export interface ClaudeSetupOptions {
  /**
   * If true, skip regenerating prd.json.
   * Use this for the upgrade command since users may have marked stories complete.
   */
  skipPrd?: boolean;
}

/**
 * Runs the full Claude setup for a scaffolded Flutter project.
 * Generates CLAUDE.md, rules, agent definitions, skills, hooks, MCP config,
 * slash commands, and prd.json — gated by the resolved preset.
 */
export async function runClaudeSetup(
  context: ProjectContext,
  outputPath: string,
  options?: ClaudeSetupOptions,
): Promise<ClaudeSetupResult> {
  const filesWritten: string[] = [];

  // 1. Resolve preset (with optional overrides from rawConfig)
  const overrides = context.rawConfig.claude?.overrides;
  const resolved = resolvePreset(context.claude.preset, overrides);

  // Ensure .claude directory exists
  await mkdir(join(outputPath, '.claude'), { recursive: true });

  // 2. Generate slim CLAUDE.md
  if (resolved.claudeMd) {
    const claudeMdContent = generateClaudeMd(context);
    const claudeMdPath = join(outputPath, 'CLAUDE.md');
    await writeFile(claudeMdPath, claudeMdContent, 'utf-8');
    filesWritten.push(claudeMdPath);
  }

  // 3. Write rules (.claude/rules/)
  if (resolved.rules) {
    await writeRules(context, outputPath);
    const rulesDir = join(outputPath, '.claude', 'rules');
    filesWritten.push(
      join(rulesDir, 'architecture.md'),
      join(rulesDir, 'riverpod.md'),
      join(rulesDir, 'go-router.md'),
      join(rulesDir, 'testing.md'),
      join(rulesDir, 'security.md'),
      join(rulesDir, 'git-workflow.md'),
      join(rulesDir, 'code-quality.md'),
    );
    if (context.modules.auth) filesWritten.push(join(rulesDir, 'auth.md'));
    if (context.modules.api) filesWritten.push(join(rulesDir, 'api.md'));
    if (context.modules.database) filesWritten.push(join(rulesDir, 'database.md'));
    if (context.modules.i18n) filesWritten.push(join(rulesDir, 'i18n.md'));
  }

  // 4. Write agent definition files (.claude/agents/)
  if (resolved.agents) {
    const agentFiles = await writeAgents(context, outputPath);
    filesWritten.push(...agentFiles);
  }

  // 5. Write hooks config (.claude/hooks/) and settings files
  if (resolved.hooks) {
    const hooksResult = await writeHooks(context, outputPath);
    filesWritten.push(...hooksResult.scripts);

    // Write settings.json (team-shared) and settings.local.json (personal)
    await writeSettings(context, outputPath, hooksResult.config);
    filesWritten.push(
      join(outputPath, '.claude', 'settings.json'),
      join(outputPath, '.claude', 'settings.local.json'),
    );
  }

  // 6. Write skill files (.claude/skills/)
  if (resolved.skills) {
    await writeSkills(context, outputPath);
    const skillsDir = join(outputPath, '.claude', 'skills');
    filesWritten.push(
      join(skillsDir, 'flutter-patterns.md'),
      join(skillsDir, 'go-router-patterns.md'),
      join(skillsDir, 'module-conventions.md'),
      join(skillsDir, 'prd.md'),
      join(skillsDir, 'security-review.md'),
      join(skillsDir, 'performance-check.md'),
      join(skillsDir, 'add-feature.md'),
      join(skillsDir, 'quality-gate.md'),
    );
  }

  // 7. Write slash commands (.claude/commands/)
  if (resolved.commands) {
    await writeCommands(context, outputPath);
    const commandsDir = join(outputPath, '.claude', 'commands');
    filesWritten.push(join(commandsDir, 'add-feature.md'), join(commandsDir, 'analyze.md'), join(commandsDir, 'start-team.md'));
  }

  // 8. Write MCP server config (.mcp.json)
  if (resolved.mcp) {
    await writeMcpConfig(context, outputPath);
    filesWritten.push(join(outputPath, '.mcp.json'));
  }

  // 9. Generate and write prd.json (skipped when skipPrd is true)
  if (!options?.skipPrd) {
    const prdContent = generatePrd(context);
    const prdPath = join(outputPath, 'prd.json');
    await writeFile(prdPath, prdContent, 'utf-8');
    filesWritten.push(prdPath);
  }

  return { filesWritten };
}
