import { join } from 'node:path';
import { mkdir, writeFile } from 'node:fs/promises';
import type { PlanInput, PlanResult } from './types.js';
import { writePartialConfig } from './config-writer.js';
import { generateBriefTemplate } from './brief-template-generator.js';
import { generatePlanAppSkill } from './skill-generator.js';

export async function runPlan(input: PlanInput): Promise<PlanResult> {
  const { name, description, outputDir } = input;
  const filesCreated: string[] = [];

  // Create project directory
  await mkdir(outputDir, { recursive: true });

  // Write partial maxsim.config.yaml
  const configPath = await writePartialConfig(outputDir, { name, description });
  filesCreated.push(configPath);

  // Write .claude/skills/plan-app.md
  const skillsDir = join(outputDir, '.claude', 'skills');
  await mkdir(skillsDir, { recursive: true });
  const skillPath = join(skillsDir, 'plan-app.md');
  await writeFile(skillPath, generatePlanAppSkill(), 'utf-8');
  filesCreated.push(skillPath);

  // Write docs/project-brief-template.md
  const docsDir = join(outputDir, 'docs');
  await mkdir(docsDir, { recursive: true });
  const briefPath = join(docsDir, 'project-brief-template.md');
  await writeFile(briefPath, generateBriefTemplate({ name, description }), 'utf-8');
  filesCreated.push(briefPath);

  return {
    projectDir: outputDir,
    filesCreated,
  };
}
