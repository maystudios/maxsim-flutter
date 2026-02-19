import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { load as yamlLoad, dump as yamlDump } from 'js-yaml';
import fsExtra from 'fs-extra';
const { pathExists } = fsExtra;
import { TemplateRenderer } from './renderer.js';
import { FileWriter } from './file-writer.js';
import type { ProjectContext } from '../core/context.js';
import type { GeneratedFile } from '../types/project.js';
import { ModuleRegistry } from '../modules/registry.js';
import { ModuleResolver } from '../modules/resolver.js';
import { pickNewerVersion } from '../modules/composer.js';
import { runDartFormat } from './post-processors/dart-format.js';
import { runFlutterPubGet } from './post-processors/flutter-pub-get.js';
import { runBuildRunner } from './post-processors/build-runner.js';
import { runClaudeSetup } from '../claude-setup/index.js';
import {
  buildTemplateContext,
  collectAndRenderTemplates,
  processPubspecPartial,
} from './template-helpers.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export interface ScaffoldResult {
  filesWritten: string[];
  filesSkipped: string[];
  conflicts: string[];
  postProcessorsRun: string[];
  postProcessorErrors: string[];
}

export interface ScaffoldEngineOptions {
  /** Override the core templates directory (useful for testing) */
  templatesDir?: string;
  /** Override the modules templates base directory (useful for testing) */
  modulesTemplatesDir?: string;
  /** Pre-loaded module registry (useful for testing) */
  registry?: ModuleRegistry;
  /** Skip Claude setup generation even if context.claude.enabled is true */
  noClaude?: boolean;
}

export class ScaffoldEngine {
  private renderer: TemplateRenderer;
  private readonly templatesDirOverride?: string;
  private readonly modulesTemplatesDirOverride?: string;
  private readonly registryOverride?: ModuleRegistry;
  private readonly noClaudeOverride: boolean;

  constructor(options: ScaffoldEngineOptions = {}) {
    this.renderer = new TemplateRenderer();
    this.templatesDirOverride = options.templatesDir;
    this.modulesTemplatesDirOverride = options.modulesTemplatesDir;
    this.registryOverride = options.registry;
    this.noClaudeOverride = options.noClaude ?? false;
  }

  async run(context: ProjectContext): Promise<ScaffoldResult> {
    const templateContext = buildTemplateContext(context);

    // 1. Collect and render core templates
    const generatedFiles = await collectAndRenderTemplates(
      this.getTemplatesDir(),
      templateContext,
      this.renderer,
    );

    // 2. Handle module templates if any modules are enabled
    const registry = await this.getRegistry();
    const enabledModuleIds = this.getEnabledModuleIds(context, registry);
    if (enabledModuleIds.length > 0) {
      // Filter to only modules that exist in the registry (safety net)
      const validIds = enabledModuleIds.filter((id) => registry.has(id));
      if (validIds.length > 0) {
        const resolver = new ModuleResolver(registry);
        const resolved = resolver.resolve(validIds);

        const modulesDir = this.getModulesTemplatesDir();
        const extraDeps = new Map<string, string | Record<string, unknown>>();
        const extraDevDeps = new Map<string, string | Record<string, unknown>>();
        const extraFlutter: Record<string, unknown> = {};

        for (const mod of resolved.ordered) {
          if (mod.alwaysIncluded) continue;
          if (mod.isEnabled && !mod.isEnabled(context)) continue;

          const moduleTemplateDir = join(modulesDir, mod.id);
          if (!(await pathExists(moduleTemplateDir))) continue;

          // Collect and render module templates (excluding pubspec.partial.yaml)
          const moduleFiles = await collectAndRenderTemplates(
            moduleTemplateDir,
            templateContext,
            this.renderer,
            ['pubspec.partial.yaml'],
          );
          generatedFiles.push(...moduleFiles);

          // Process pubspec.partial.yaml for dependency merging
          const partialPath = join(moduleTemplateDir, 'pubspec.partial.yaml');
          const partial = await processPubspecPartial(partialPath, this.renderer, templateContext);
          for (const [name, version] of partial.deps) {
            if (typeof version === 'object') {
              extraDeps.set(name, version);
            } else {
              const existing = extraDeps.get(name);
              extraDeps.set(
                name,
                existing !== undefined && typeof existing === 'string'
                  ? pickNewerVersion(existing, version)
                  : version,
              );
            }
          }
          for (const [name, version] of partial.devDeps) {
            if (typeof version === 'object') {
              extraDevDeps.set(name, version);
            } else {
              const existing = extraDevDeps.get(name);
              extraDevDeps.set(
                name,
                existing !== undefined && typeof existing === 'string'
                  ? pickNewerVersion(existing, version)
                  : version,
              );
            }
          }
          Object.assign(extraFlutter, partial.flutter);
        }

        // Merge module deps into the rendered pubspec.yaml
        if (extraDeps.size > 0 || extraDevDeps.size > 0 || Object.keys(extraFlutter).length > 0) {
          this.mergePubspecDependencies(generatedFiles, extraDeps, extraDevDeps, extraFlutter);
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

    // 4. Claude setup (CLAUDE.md, agents, skills, hooks, MCP config, prd.json)
    if (!context.scaffold.dryRun && context.claude.enabled && !this.noClaudeOverride) {
      await runClaudeSetup(context, context.outputDir);
    }

    // 5. Post-process
    const postProcessorsRun: string[] = [];
    const postProcessorErrors: string[] = [];

    if (!context.scaffold.dryRun) {
      if (context.scaffold.postProcessors.dartFormat) {
        try {
          await runDartFormat(context.outputDir);
          postProcessorsRun.push('dart-format');
        } catch (err) {
          postProcessorErrors.push(
            `dart format skipped: ${err instanceof Error ? err.message : String(err)}`,
          );
        }
      }

      if (context.scaffold.postProcessors.flutterPubGet) {
        try {
          await runFlutterPubGet(context.outputDir);
          postProcessorsRun.push('flutter-pub-get');
        } catch (err) {
          postProcessorErrors.push(
            `flutter pub get failed: ${err instanceof Error ? err.message : String(err)}`,
          );
        }
      }

      if (context.scaffold.postProcessors.buildRunner) {
        try {
          await runBuildRunner(context.outputDir);
          postProcessorsRun.push('build-runner');
        } catch (err) {
          postProcessorErrors.push(
            `build_runner failed: ${err instanceof Error ? err.message : String(err)}`,
          );
        }
      }
    }

    return {
      filesWritten: writeResult.written,
      filesSkipped: writeResult.skipped,
      conflicts: writeResult.conflicts,
      postProcessorsRun,
      postProcessorErrors,
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
   * Determine which optional module IDs are enabled in the given context,
   * using the registry as the authoritative list of known modules.
   * Maps kebab-case module IDs (e.g., 'deep-linking') to camelCase context
   * keys (e.g., 'deepLinking') for lookup.
   */
  private getEnabledModuleIds(context: ProjectContext, registry: ModuleRegistry): string[] {
    const mods = context.modules as Record<string, unknown>;
    return registry.getAllOptionalIds().filter((id) => {
      const key = id.replace(/-([a-z])/g, (_, c: string) => (c as string).toUpperCase());
      return mods[key] !== false && mods[key] !== undefined;
    });
  }

  /**
   * Merge additional dependencies from modules into the rendered pubspec.yaml.
   */
  private mergePubspecDependencies(
    files: GeneratedFile[],
    extraDeps: Map<string, string | Record<string, unknown>>,
    extraDevDeps: Map<string, string | Record<string, unknown>>,
    extraFlutter: Record<string, unknown> = {},
  ): void {
    const pubspecIdx = files.findIndex((f) => f.relativePath === 'pubspec.yaml');
    if (pubspecIdx < 0) return;

    const pubspec = yamlLoad(files[pubspecIdx].content) as Record<string, unknown>;

    const deps = (pubspec['dependencies'] ?? {}) as Record<string, unknown>;
    for (const [name, version] of extraDeps) {
      if (typeof version === 'object') {
        deps[name] = version;
      } else if (typeof deps[name] === 'string') {
        deps[name] = pickNewerVersion(deps[name] as string, version);
      } else if (deps[name] === undefined) {
        deps[name] = version;
      }
    }
    pubspec['dependencies'] = deps;

    const devDeps = (pubspec['dev_dependencies'] ?? {}) as Record<string, unknown>;
    for (const [name, version] of extraDevDeps) {
      if (typeof version === 'object') {
        devDeps[name] = version;
      } else if (typeof devDeps[name] === 'string') {
        devDeps[name] = pickNewerVersion(devDeps[name] as string, version);
      } else if (devDeps[name] === undefined) {
        devDeps[name] = version;
      }
    }
    pubspec['dev_dependencies'] = devDeps;

    if (Object.keys(extraFlutter).length > 0) {
      const flutterSection = (pubspec['flutter'] ?? {}) as Record<string, unknown>;
      Object.assign(flutterSection, extraFlutter);
      pubspec['flutter'] = flutterSection;
    }

    files[pubspecIdx] = {
      ...files[pubspecIdx],
      content: yamlDump(pubspec, { indent: 2, lineWidth: 120, noRefs: true }),
    };
  }
}
