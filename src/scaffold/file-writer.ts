import fsExtra from 'fs-extra';
const { ensureDir, pathExists, writeFile } = fsExtra;
import { join, dirname } from 'node:path';

export type OverwriteMode = 'ask' | 'always' | 'never';

export interface FileWriterOptions {
  outputDir: string;
  dryRun?: boolean;
  overwriteMode?: OverwriteMode;
  onConflict?: (filePath: string) => Promise<boolean>;
}

export interface WriteResult {
  written: string[];
  skipped: string[];
  conflicts: string[];
}

export class FileWriter {
  private readonly outputDir: string;
  private readonly dryRun: boolean;
  private readonly overwriteMode: OverwriteMode;
  private readonly onConflict?: (filePath: string) => Promise<boolean>;

  constructor(options: FileWriterOptions) {
    this.outputDir = options.outputDir;
    this.dryRun = options.dryRun ?? false;
    this.overwriteMode = options.overwriteMode ?? 'ask';
    this.onConflict = options.onConflict;
  }

  async writeAll(files: Map<string, string>): Promise<WriteResult> {
    const result: WriteResult = {
      written: [],
      skipped: [],
      conflicts: [],
    };

    for (const [relativePath, content] of files) {
      const outcome = await this.writeFile(relativePath, content);
      if (outcome === 'written') {
        result.written.push(relativePath);
      } else if (outcome === 'skipped') {
        result.skipped.push(relativePath);
      } else {
        result.conflicts.push(relativePath);
      }
    }

    return result;
  }

  async writeFile(
    relativePath: string,
    content: string,
  ): Promise<'written' | 'skipped' | 'conflict'> {
    const absolutePath = join(this.outputDir, relativePath);

    if (this.dryRun) {
      return 'written';
    }

    const exists = await pathExists(absolutePath);

    if (exists) {
      if (this.overwriteMode === 'always') {
        await ensureDir(dirname(absolutePath));
        await writeFile(absolutePath, content, 'utf-8');
        return 'written';
      }

      if (this.overwriteMode === 'never') {
        return 'skipped';
      }

      // 'ask' mode
      if (this.onConflict) {
        const shouldOverwrite = await this.onConflict(absolutePath);
        if (shouldOverwrite) {
          await ensureDir(dirname(absolutePath));
          await writeFile(absolutePath, content, 'utf-8');
          return 'written';
        }
        return 'skipped';
      }

      // No callback provided for 'ask' mode — default to skipping
      return 'conflict';
    }

    await ensureDir(dirname(absolutePath));
    await writeFile(absolutePath, content, 'utf-8');
    return 'written';
  }
}
