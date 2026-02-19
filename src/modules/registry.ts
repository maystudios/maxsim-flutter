import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { readdir, stat } from 'node:fs/promises';
import type { ModuleManifest } from '../types/module.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Registry that discovers and loads all module definitions
 * from src/modules/definitions/ (at runtime: dist/modules/definitions/).
 */
export class ModuleRegistry {
  private readonly modules = new Map<string, ModuleManifest>();
  private loaded = false;

  /** Override the definitions directory (useful for testing) */
  private readonly definitionsDir: string;

  constructor(definitionsDir?: string) {
    this.definitionsDir = definitionsDir ?? join(__dirname, 'definitions');
  }

  /**
   * Discover and load all module definitions from the definitions directory.
   * Each subdirectory should contain a module.ts/module.js exporting `{ manifest }`.
   */
  async loadAll(): Promise<void> {
    this.modules.clear();

    let entries: string[];
    try {
      entries = await readdir(this.definitionsDir);
    } catch {
      // Definitions directory doesn't exist — no modules to load
      this.loaded = true;
      return;
    }

    for (const entry of entries) {
      const entryPath = join(this.definitionsDir, entry);
      const entryStat = await stat(entryPath);
      if (!entryStat.isDirectory()) continue;

      const modulePath = join(entryPath, 'module.js');
      try {
        const moduleExports = (await import(modulePath)) as { manifest?: ModuleManifest };
        if (moduleExports.manifest && typeof moduleExports.manifest.id === 'string') {
          this.modules.set(moduleExports.manifest.id, moduleExports.manifest);
        }
      } catch {
        // Module either doesn't exist or isn't implemented yet — skip
      }
    }

    this.loaded = true;
  }

  /**
   * Register a module manifest directly (useful for testing or programmatic registration).
   */
  register(manifest: ModuleManifest): void {
    this.modules.set(manifest.id, manifest);
  }

  /**
   * Get a module by ID. Throws if the module is not registered.
   */
  get(id: string): ModuleManifest {
    const m = this.modules.get(id);
    if (!m) {
      throw new Error(`Module '${id}' not found in registry`);
    }
    return m;
  }

  /**
   * Check if a module is registered.
   */
  has(id: string): boolean {
    return this.modules.has(id);
  }

  /**
   * Get all registered modules.
   */
  getAll(): ModuleManifest[] {
    return Array.from(this.modules.values());
  }

  /**
   * Get all modules that are always included (e.g., core).
   */
  getAlwaysIncluded(): ModuleManifest[] {
    return this.getAll().filter((m) => m.alwaysIncluded === true);
  }

  /**
   * Get all optional (user-selectable) modules.
   */
  getOptional(): ModuleManifest[] {
    return this.getAll().filter((m) => m.alwaysIncluded !== true);
  }

  /**
   * Get the IDs of all optional (user-selectable) modules.
   * Excludes modules marked alwaysIncluded (e.g., core).
   * This is the single source of truth for which optional modules the tool supports.
   */
  getAllOptionalIds(): string[] {
    return this.getOptional().map((m) => m.id);
  }

  /**
   * Get the number of registered modules.
   */
  get size(): number {
    return this.modules.size;
  }

  /**
   * Whether loadAll() has been called.
   */
  get isLoaded(): boolean {
    return this.loaded;
  }
}
