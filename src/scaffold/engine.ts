import { fileURLToPath } from 'node:url';
import { dirname, join, extname } from 'node:path';
import { readFile, readdir, stat } from 'node:fs/promises';
import { load as yamlLoad, dump as yamlDump } from 'js-yaml';
import fsExtra from 'fs-extra';
const { pathExists } = fsExtra;
import { TemplateRenderer } from './renderer.js';
import type { TemplateContext } from './renderer.js';
import { FileWriter } from './file-writer.js';
import type { ProjectContext } from '../core/context.js';
import type { GeneratedFile } from '../types/project.js';
import { ModuleRegistry } from '../modules/registry.js';
import { ModuleResolver } from '../modules/resolver.js';
import { pickNewerVersion } from '../modules/composer.js';
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
  /** Override the core templates directory (useful for testing) */
  templatesDir?: string;
  /** Override the modules templates base directory (useful for testing) */
  modulesTemplatesDir?: string;
  /** Pre-loaded module registry (useful for testing) */
  registry?: ModuleRegistry;
}

export class ScaffoldEngine {
  private renderer: TemplateRenderer;
  private readonly templatesDirOverride?: string;
  private readonly modulesTemplatesDirOverride?: string;
  private readonly registryOverride?: ModuleRegistry;

  constructor(options: ScaffoldEngineOptions = {}) {
    this.renderer = new TemplateRenderer();
    this.templatesDirOverride = options.templatesDir;
    this.modulesTemplatesDirOverride = options.modulesTemplatesDir;
    this.registryOverride = options.registry;
  }

  async run(context: ProjectContext): Promise<ScaffoldResult> {
    const templateContext = this.buildTemplateContext(context);

    // 1. Collect and render core templates
    const generatedFiles = await this.collectAndRenderTemplatesFromDir(
      this.getTemplatesDir(),
      templateContext,
    );

    // 2. Handle module templates if any modules are enabled
    const enabledModuleIds = this.getEnabledModuleIds(context);
    if (enabledModuleIds.length > 0) {
      const registry = await this.getRegistry();

      // Filter to only modules that exist in the registry
      const validIds = enabledModuleIds.filter((id) => registry.has(id));
      if (validIds.length > 0) {
        const resolver = new ModuleResolver(registry);
        const resolved = resolver.resolve(validIds);

        const modulesDir = this.getModulesTemplatesDir();
        const extraDeps = new Map<string, string>();
        const extraDevDeps = new Map<string, string>();

        for (const mod of resolved.ordered) {
          if (mod.alwaysIncluded) continue;
          if (mod.isEnabled && !mod.isEnabled(context)) continue;

          const moduleTemplateDir = join(modulesDir, mod.id);
          if (!(await pathExists(moduleTemplateDir))) continue;

          // Collect and render module templates (excluding pubspec.partial.yaml)
          const moduleFiles = await this.collectAndRenderTemplatesFromDir(
            moduleTemplateDir,
            templateContext,
            ['pubspec.partial.yaml'],
          );
          generatedFiles.push(...moduleFiles);

          // Process pubspec.partial.yaml for dependency merging
          const partialPath = join(moduleTemplateDir, 'pubspec.partial.yaml');
          if (await pathExists(partialPath)) {
            const partialContent = await readFile(partialPath, 'utf-8');
            const rendered = this.renderer.render(partialContent, templateContext);
            const parsed = yamlLoad(rendered) as Record<string, Record<string, string>> | null;
            if (parsed) {
              if (parsed.dependencies) {
                for (const [name, version] of Object.entries(parsed.dependencies)) {
                  const v = String(version);
                  const existing = extraDeps.get(name);
                  extraDeps.set(name, existing ? pickNewerVersion(existing, v) : v);
                }
              }
              if (parsed.dev_dependencies) {
                for (const [name, version] of Object.entries(parsed.dev_dependencies)) {
                  const v = String(version);
                  const existing = extraDevDeps.get(name);
                  extraDevDeps.set(name, existing ? pickNewerVersion(existing, v) : v);
                }
              }
            }
          }
        }

        // Merge module deps into the rendered pubspec.yaml
        if (extraDeps.size > 0 || extraDevDeps.size > 0) {
          this.mergePubspecDependencies(generatedFiles, extraDeps, extraDevDeps);
        }
      }
    }

    // 3. Write files to disk
    const fileMap = new Map<string, string>(
      generatedFiles.map((f) => [f.relativePath, f.content]),
    );

    const writer = new FileWriter({
      outputDir: context.outputDir,
      dryRun: context.scaffold.dryRun,
      overwriteMode: context.scaffold.overwrite,
    });

    const writeResult = await writer.writeAll(fileMap);

    // 4. Post-process
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
    return join(__dirname, '../../templates/core');
  }

  private getModulesTemplatesDir(): string {
    if (this.modulesTemplatesDirOverride !== undefined) {
      return this.modulesTemplatesDirOverride;
    }
    return join(__dirname, '../../templates/modules');
  }

  private async getRegistry(): Promise<ModuleRegistry> {
    if (this.registryOverride) return this.registryOverride;
    const registry = new ModuleRegistry();
    await registry.loadAll();
    return registry;
  }

  /**
   * Determine which module IDs are enabled from the project context.
   */
  private getEnabledModuleIds(context: ProjectContext): string[] {
    const ids: string[] = [];
    if (context.modules.auth !== false) ids.push('auth');
    if (context.modules.api !== false) ids.push('api');
    if (context.modules.database !== false) ids.push('database');
    if (context.modules.i18n !== false) ids.push('i18n');
    if (context.modules.theme !== false) ids.push('theme');
    if (context.modules.push !== false) ids.push('push');
    if (context.modules.analytics !== false) ids.push('analytics');
    if (context.modules.cicd !== false) ids.push('cicd');
    if (context.modules.deepLinking !== false) ids.push('deep-linking');
    return ids;
  }

  /**
   * Collect all template files from a directory and render them.
   */
  private async collectAndRenderTemplatesFromDir(
    baseDir: string,
    templateContext: TemplateContext,
    excludeFiles: string[] = [],
  ): Promise<GeneratedFile[]> {
    const exists = await pathExists(baseDir);
    if (!exists) return [];

    const entries = await readdir(baseDir, { recursive: true });
    const results: GeneratedFile[] = [];

    for (const entry of entries) {
      const entryStr = String(entry);
      const absolutePath = join(baseDir, entryStr);

      const fileStat = await stat(absolutePath);
      if (fileStat.isDirectory()) continue;

      // Check exclusions
      if (excludeFiles.some((e) => entryStr === e || entryStr.endsWith(e))) continue;

      const isHbs = extname(entryStr) === '.hbs';
      const outputPath = isHbs ? entryStr.replace(/\.hbs$/, '') : entryStr;

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

  /**
   * Merge additional dependencies from modules into the rendered pubspec.yaml.
   */
  private mergePubspecDependencies(
    files: GeneratedFile[],
    extraDeps: Map<string, string>,
    extraDevDeps: Map<string, string>,
  ): void {
    const pubspecIdx = files.findIndex((f) => f.relativePath === 'pubspec.yaml');
    if (pubspecIdx < 0) return;

    const pubspec = yamlLoad(files[pubspecIdx].content) as Record<string, unknown>;

    const deps = (pubspec['dependencies'] ?? {}) as Record<string, unknown>;
    for (const [name, version] of extraDeps) {
      if (typeof deps[name] === 'string') {
        deps[name] = pickNewerVersion(deps[name] as string, version);
      } else if (deps[name] === undefined) {
        deps[name] = version;
      }
      // Skip SDK-style deps like flutter: {sdk: flutter}
    }
    pubspec['dependencies'] = deps;

    const devDeps = (pubspec['dev_dependencies'] ?? {}) as Record<string, unknown>;
    for (const [name, version] of extraDevDeps) {
      if (typeof devDeps[name] === 'string') {
        devDeps[name] = pickNewerVersion(devDeps[name] as string, version);
      } else if (devDeps[name] === undefined) {
        devDeps[name] = version;
      }
    }
    pubspec['dev_dependencies'] = devDeps;

    files[pubspecIdx] = {
      ...files[pubspecIdx],
      content: yamlDump(pubspec, { indent: 2, lineWidth: 120, noRefs: true }),
    };
  }
}
