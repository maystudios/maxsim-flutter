import { readFile, readdir } from 'node:fs/promises';
import { resolve, relative, join } from 'node:path';

const TEMPLATES_DIR = resolve('templates');

/** Recursively find all .dart.hbs files under a directory. */
async function findDartHbsFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { recursive: true });
  return entries
    .filter((e: string) => e.endsWith('.dart.hbs'))
    .map((e: string) => join(dir, e));
}

/** Extract @riverpod-annotated function/class names from a template file. */
function extractProviderNames(content: string): string[] {
  const names: string[] = [];
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (trimmed.startsWith('@riverpod') || trimmed.startsWith('@Riverpod')) {
      // The provider name is the function/class name on the next non-empty, non-annotation line
      for (let j = i + 1; j < lines.length; j++) {
        const next = lines[j].trim();
        if (!next || next.startsWith('@') || next.startsWith('//')) continue;
        // Match: `ReturnType functionName(` or `class ClassName extends`
        const funcMatch = next.match(/^\S+\s+(\w+)\s*\(/);
        const classMatch = next.match(/^class\s+(\w+)/);
        if (funcMatch) {
          names.push(funcMatch[1]);
        } else if (classMatch) {
          names.push(classMatch[1]);
        }
        break;
      }
    }
  }
  return names;
}

describe('Template integrity', () => {
  let coreTemplateFiles: string[];
  let moduleTemplateFiles: string[];
  let allTemplateFiles: string[];

  beforeAll(async () => {
    const coreDir = resolve(TEMPLATES_DIR, 'core');
    const modulesDir = resolve(TEMPLATES_DIR, 'modules');
    coreTemplateFiles = await findDartHbsFiles(coreDir);
    moduleTemplateFiles = await findDartHbsFiles(modulesDir);
    allTemplateFiles = [...coreTemplateFiles, ...moduleTemplateFiles];
  });

  it('has no duplicate @riverpod provider names between core and modules', async () => {
    const coreNames = new Map<string, string>();
    for (const file of coreTemplateFiles) {
      const content = await readFile(file, 'utf-8');
      for (const name of extractProviderNames(content)) {
        coreNames.set(name, relative(TEMPLATES_DIR, file));
      }
    }

    const conflicts: string[] = [];
    for (const file of moduleTemplateFiles) {
      const content = await readFile(file, 'utf-8');
      for (const name of extractProviderNames(content)) {
        if (coreNames.has(name)) {
          conflicts.push(
            `Provider "${name}" defined in both core (${coreNames.get(name)}) and module (${relative(TEMPLATES_DIR, file)})`,
          );
        }
      }
    }

    expect(conflicts).toEqual([]);
  });

  it('deep-linking module does NOT define @riverpod GoRouter router', async () => {
    const deepLinkProviderPath = resolve(
      TEMPLATES_DIR,
      'modules/deep-linking/lib/features/deep_linking/presentation/providers/deep_link_provider.dart.hbs',
    );
    const content = await readFile(deepLinkProviderPath, 'utf-8');
    const names = extractProviderNames(content);
    expect(names).not.toContain('router');
  });

  it('every file with part *.g.dart has @riverpod or @freezed, and vice versa', async () => {
    const violations: string[] = [];

    for (const file of allTemplateFiles) {
      const content = await readFile(file, 'utf-8');
      const hasPartGDart = /part\s+'[^']*\.g\.dart'/.test(content);
      // Any annotation that triggers build_runner code generation
      const hasAnnotation =
        content.includes('@riverpod') ||
        content.includes('@Riverpod') ||
        content.includes('@freezed') ||
        content.includes('@Freezed') ||
        content.includes('@DriftDatabase') ||
        content.includes('@DriftAccessor');

      if (hasPartGDart && !hasAnnotation) {
        violations.push(
          `${relative(TEMPLATES_DIR, file)}: has part '*.g.dart' but no @riverpod/@freezed annotation`,
        );
      }
      if (hasAnnotation && !hasPartGDart) {
        // Classes/functions with @riverpod need a .g.dart part directive
        // (skip @freezed with .freezed.dart only — those may use a different part file)
        const hasPartFreezed = /part\s+'[^']*\.freezed\.dart'/.test(content);
        if (!hasPartFreezed) {
          violations.push(
            `${relative(TEMPLATES_DIR, file)}: has @riverpod/@freezed but no part '*.g.dart' or '*.freezed.dart'`,
          );
        }
      }
    }

    expect(violations).toEqual([]);
  });

  it('no two modules define the same @riverpod provider name', async () => {
    // Group module files by module name
    const moduleProviders = new Map<string, Map<string, string>>();

    for (const file of moduleTemplateFiles) {
      const relPath = relative(TEMPLATES_DIR, file);
      // Extract module name: modules/<name>/...
      const moduleName = relPath.split('/')[1];
      const content = await readFile(file, 'utf-8');

      if (!moduleProviders.has(moduleName)) {
        moduleProviders.set(moduleName, new Map());
      }
      for (const name of extractProviderNames(content)) {
        moduleProviders.get(moduleName)!.set(name, relPath);
      }
    }

    const collisions: string[] = [];
    const moduleNames = Array.from(moduleProviders.keys());
    for (let i = 0; i < moduleNames.length; i++) {
      for (let j = i + 1; j < moduleNames.length; j++) {
        const a = moduleProviders.get(moduleNames[i])!;
        const b = moduleProviders.get(moduleNames[j])!;
        for (const [name, fileA] of a) {
          if (b.has(name)) {
            collisions.push(
              `Provider "${name}" defined in both ${moduleNames[i]} (${fileA}) and ${moduleNames[j]} (${b.get(name)})`,
            );
          }
        }
      }
    }

    expect(collisions).toEqual([]);
  });
});
