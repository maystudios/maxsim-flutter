import type { ProjectContext } from '../core/context.js';

export interface GeneratedFile {
  relativePath: string;
  content: string;
  templateSource?: string; // original .hbs file path
}

export interface TemplateInstruction {
  templatePath: string; // path to .hbs template
  outputPath: string; // relative output path
  condition?: (ctx: ProjectContext) => boolean; // only include if true
}

export type Platform = 'android' | 'ios' | 'web' | 'macos' | 'windows' | 'linux';
