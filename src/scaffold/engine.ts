import { fileURLToPath } from 'node:url';
import { dirname, join, extname } from 'node:path';
import { readFile, readdir } from 'node:fs/promises';
import fsExtra from 'fs-extra';
const { pathExists } = fsExtra;
import { TemplateRenderer } from './renderer.js';
import type { TemplateContext } from './renderer.js';
import { FileWriter } from './file-writer.js';
import type { ProjectContext } from '../core/context.js';
import type { GeneratedFile } from '../types/project.js';
import { runDartFormat } from './post-processors/dart-format.js';
import { runFlutterPubGet } from './post-processors/flutter-pub-get.js';
import { runBuildRunner } from './post-processors/build-runner.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export interface ScaffoldResult {
  filesWritten: string[];
  filesSkipped: string[];
  conflicts: string[];
  postProcessorsRun: string[];
}

export interface ScaffoldEngineOptions {
  /** Override the templates directory (useful for testing) */
  templatesDir?: string;
}

export class ScaffoldEngine {
  private renderer: TemplateRenderer;
  private readonly templatesDirOverride?: string;

  constructor(options: ScaffoldEngineOptions = {}) {
    this.renderer = new TemplateRenderer();
    this.templatesDirOverride = options.templatesDir;
  }

  async run(context: ProjectContext): Promise<ScaffoldResult> {
    const templateContext = this.buildTemplateContext(context);
    const generatedFiles = await this.collectAndRenderCoreTemplates(templateContext);

    const fileMap = new Map<string, string>(
      generatedFiles.map((f) => [f.relativePath, f.content]),
    );

    const writer = new FileWriter({
      outputDir: context.outputDir,
      dryRun: context.scaffold.dryRun,
      overwriteMode: context.scaffold.overwrite,
    });

    const writeResult = await writer.writeAll(fileMap);

    const postProcessorsRun: string[] = [];

    if (!context.scaffold.dryRun) {
      if (context.scaffold.postProcessors.dartFormat) {
        try {
          await runDartFormat(context.outputDir);
          postProcessorsRun.push('dart-format');
        } catch {
          // dart may not be installed; don't fail the whole scaffold
        }
      }

      if (context.scaffold.postProcessors.flutterPubGet) {
        try {
          await runFlutterPubGet(context.outputDir);
          postProcessorsRun.push('flutter-pub-get');
        } catch {
          // flutter may not be installed; don't fail the whole scaffold
        }
      }

      if (context.scaffold.postProcessors.buildRunner) {
        try {
          await runBuildRunner(context.outputDir);
          postProcessorsRun.push('build-runner');
        } catch {
          // build_runner may not be available; don't fail the whole scaffold
        }
      }
    }

    return {
      filesWritten: writeResult.written,
      filesSkipped: writeResult.skipped,
      conflicts: writeResult.conflicts,
      postProcessorsRun,
    };
  }

  private buildTemplateContext(ctx: ProjectContext): TemplateContext {
    const platforms: Record<string, boolean> = {};
    for (const platform of ctx.platforms) {
      platforms[platform] = true;
    }

    const modules: Record<string, false | Record<string, unknown>> = {};
    for (const [key, value] of Object.entries(ctx.modules)) {
      if (value === false) {
        modules[key] = false;
      } else {
        modules[key] = value as Record<string, unknown>;
      }
    }

    return {
      project: {
        name: ctx.projectName,
        org: ctx.orgId,
        description: ctx.description,
      },
      platforms,
      modules,
    };
  }

  private getTemplatesDir(): string {
    if (this.templatesDirOverride !== undefined) {
      return this.templatesDirOverride;
    }
    // __dirname resolves to dist/scaffold/ at runtime; templates/core/ is at ../../templates/core/
    return join(__dirname, '../../templates/core');
  }

  private async collectCoreTemplates(): Promise<
    Array<{ absolutePath: string; outputPath: string; isHbs: boolean }>
  > {
    const templatesDir = this.getTemplatesDir();

    const exists = await pathExists(templatesDir);
    if (!exists) {
      return [];
    }

    const entries = await readdir(templatesDir, { recursive: true });

    const results: Array<{
      absolutePath: string;
      outputPath: string;
      isHbs: boolean;
    }> = [];

    for (const entry of entries) {
      // entry is a relative path string from templatesDir when recursive is used
      const entryStr = entry;
      const absolutePath = join(templatesDir, entryStr);

      // Skip directories (we only want files)
      const { stat } = await import('node:fs/promises');
      const fileStat = await stat(absolutePath);
      if (fileStat.isDirectory()) {
        continue;
      }

      const isHbs = extname(entryStr) === '.hbs';

      // Output path: strip .hbs extension if present
      const outputPath = isHbs ? entryStr.replace(/\.hbs$/, '') : entryStr;

      results.push({ absolutePath, outputPath, isHbs });
    }

    return results;
  }

  private async collectAndRenderCoreTemplates(
    templateContext: TemplateContext,
  ): Promise<GeneratedFile[]> {
    const templates = await this.collectCoreTemplates();
    const results: GeneratedFile[] = [];

    for (const { absolutePath, outputPath, isHbs } of templates) {
      let content: string;

      if (isHbs) {
        content = await this.renderer.renderFile(absolutePath, templateContext);
      } else {
        content = await readFile(absolutePath, 'utf-8');
      }

      results.push({
        relativePath: outputPath,
        content,
        templateSource: absolutePath,
      });
    }

    return results;
  }
}
