import { join, extname } from 'node:path';
import { readFile, readdir, stat } from 'node:fs/promises';
import { load as yamlLoad } from 'js-yaml';
import fsExtra from 'fs-extra';
const { pathExists } = fsExtra;

import type { TemplateRenderer, TemplateContext } from './renderer.js';
import type { ProjectContext } from '../core/context.js';
import type { GeneratedFile } from '../types/project.js';
import { pickNewerVersion } from '../modules/composer.js';

export interface PubspecPartialResult {
  deps: Map<string, string | Record<string, unknown>>;
  devDeps: Map<string, string | Record<string, unknown>>;
  flutter: Record<string, unknown>;
}

/**
 * Build a TemplateContext from a ProjectContext.
 * Shared between the scaffold engine and add command.
 */
export function buildTemplateContext(ctx: ProjectContext): TemplateContext {
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
    claude: {
      enabled: ctx.claude.enabled,
      agentTeams: ctx.claude.agentTeams,
    },
  };
}

/**
 * Collect and render all template files from a directory, excluding specified files.
 * Shared between the scaffold engine and add command.
 */
export async function collectAndRenderTemplates(
  baseDir: string,
  templateContext: TemplateContext,
  renderer: TemplateRenderer,
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
    if (excludeFiles.some((e) => entryStr === e || entryStr.endsWith(e))) continue;

    const isHbs = extname(entryStr) === '.hbs';
    const outputPath = isHbs ? entryStr.replace(/\.hbs$/, '') : entryStr;

    let content: string;
    if (isHbs) {
      content = await renderer.renderFile(absolutePath, templateContext);
    } else {
      content = await readFile(absolutePath, 'utf-8');
    }

    results.push({ relativePath: outputPath, content, templateSource: absolutePath });
  }

  return results;
}

/**
 * Parse a pubspec.partial.yaml file and extract its deps/devDeps/flutter sections.
 * Returns empty maps when the file does not exist.
 * Shared between the scaffold engine and add command.
 */
export async function processPubspecPartial(
  partialPath: string,
  renderer: TemplateRenderer,
  templateContext: TemplateContext,
): Promise<PubspecPartialResult> {
  const deps = new Map<string, string | Record<string, unknown>>();
  const devDeps = new Map<string, string | Record<string, unknown>>();
  const flutter: Record<string, unknown> = {};

  if (!(await pathExists(partialPath))) return { deps, devDeps, flutter };

  const partialContent = await readFile(partialPath, 'utf-8');
  const rendered = renderer.render(partialContent, templateContext);
  const parsed = yamlLoad(rendered) as Record<string, Record<string, unknown>> | null;

  if (parsed) {
    if (parsed.dependencies) {
      for (const [name, version] of Object.entries(parsed.dependencies)) {
        if (typeof version === 'object' && version !== null) {
          deps.set(name, version as Record<string, unknown>);
        } else {
          const v = String(version);
          const existing = deps.get(name);
          deps.set(
            name,
            existing !== undefined && typeof existing === 'string'
              ? pickNewerVersion(existing, v)
              : v,
          );
        }
      }
    }

    if (parsed.dev_dependencies) {
      for (const [name, version] of Object.entries(parsed.dev_dependencies)) {
        if (typeof version === 'object' && version !== null) {
          devDeps.set(name, version as Record<string, unknown>);
        } else {
          const v = String(version);
          const existing = devDeps.get(name);
          devDeps.set(
            name,
            existing !== undefined && typeof existing === 'string'
              ? pickNewerVersion(existing, v)
              : v,
          );
        }
      }
    }

    if (parsed.flutter) {
      Object.assign(flutter, parsed.flutter);
    }
  }

  return { deps, devDeps, flutter };
}
