import { join } from 'node:path';
import { mkdir, writeFile } from 'node:fs/promises';

export interface PartialConfigInput {
  name: string;
  description: string;
}

export async function writePartialConfig(outputDir: string, input: PartialConfigInput): Promise<string> {
  await mkdir(outputDir, { recursive: true });

  const content = [
    `project:`,
    `  name: ${input.name}`,
    `  description: >-`,
    `    ${input.description}`,
    ``,
    `# Run maxsim-flutter create to complete your project setup`,
    `# after filling in the project-brief-template.md`,
  ].join('\n');

  const filePath = join(outputDir, 'maxsim.config.yaml');
  await writeFile(filePath, content, 'utf-8');
  return filePath;
}
