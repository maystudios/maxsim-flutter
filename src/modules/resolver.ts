import type { ModuleManifest } from '../types/module.js';
import type { ModuleRegistry } from './registry.js';

/**
 * Result of module resolution — an ordered list of modules
 * with all dependencies included and topologically sorted.
 */
export interface ResolveResult {
  /** Modules in dependency order (dependencies before dependents) */
  readonly ordered: readonly ModuleManifest[];
}

/**
 * Resolves selected modules by validating dependencies, detecting
 * circular dependencies and conflicts, and returning a topologically
 * sorted list that includes all transitive dependencies.
 */
export class ModuleResolver {
  constructor(private readonly registry: ModuleRegistry) {}

  /**
   * Resolve a set of selected module IDs into a topologically sorted list.
   * Always-included modules are automatically added.
   *
   * @param selectedIds - Module IDs explicitly chosen by the user
   * @returns ResolveResult with ordered modules
   * @throws Error on missing dependency, circular dependency, or conflict
   */
  resolve(selectedIds: readonly string[]): ResolveResult {
    // Collect all module IDs: always-included + user-selected
    const allIds = new Set<string>(selectedIds);
    for (const m of this.registry.getAlwaysIncluded()) {
      allIds.add(m.id);
    }

    // Validate all selected IDs exist in the registry
    for (const id of allIds) {
      if (!this.registry.has(id)) {
        throw new Error(`Module '${id}' not found in registry`);
      }
    }

    // Add transitive dependencies
    this.addTransitiveDependencies(allIds);

    // Check for conflicts between selected modules
    this.checkConflicts(allIds);

    // Topological sort
    const ordered = this.topologicalSort(allIds);

    return { ordered };
  }

  /**
   * Expand the set of IDs to include all transitive dependencies.
   */
  private addTransitiveDependencies(ids: Set<string>): void {
    const visited = new Set<string>();
    const stack = [...ids];

    while (stack.length > 0) {
      const id = stack.pop()!;
      if (visited.has(id)) continue;
      visited.add(id);

      const manifest = this.registry.get(id);
      for (const depId of manifest.requires) {
        if (!this.registry.has(depId)) {
          throw new Error(
            `Module '${id}' requires '${depId}', but '${depId}' was not found in registry`,
          );
        }
        if (!ids.has(depId)) {
          ids.add(depId);
        }
        if (!visited.has(depId)) {
          stack.push(depId);
        }
      }
    }
  }

  /**
   * Check for conflicts between selected modules.
   */
  private checkConflicts(ids: Set<string>): void {
    for (const id of ids) {
      const manifest = this.registry.get(id);
      if (!manifest.conflictsWith) continue;

      for (const conflictId of manifest.conflictsWith) {
        if (ids.has(conflictId)) {
          throw new Error(
            `Module '${id}' conflicts with '${conflictId}' — they cannot be used together`,
          );
        }
      }
    }
  }

  /**
   * Perform a topological sort using Kahn's algorithm (BFS-based).
   * Detects circular dependencies.
   */
  private topologicalSort(ids: Set<string>): ModuleManifest[] {
    // Build adjacency list and in-degree count (only for selected modules)
    const inDegree = new Map<string, number>();
    const dependents = new Map<string, string[]>(); // dep -> modules that depend on it

    for (const id of ids) {
      if (!inDegree.has(id)) {
        inDegree.set(id, 0);
      }
      if (!dependents.has(id)) {
        dependents.set(id, []);
      }
    }

    for (const id of ids) {
      const manifest = this.registry.get(id);
      for (const depId of manifest.requires) {
        if (ids.has(depId)) {
          inDegree.set(id, (inDegree.get(id) ?? 0) + 1);
          dependents.get(depId)!.push(id);
        }
      }
    }

    // Start with modules that have no dependencies (in-degree 0)
    const queue: string[] = [];
    for (const [id, degree] of inDegree) {
      if (degree === 0) {
        queue.push(id);
      }
    }
    // Sort the initial queue for deterministic output
    queue.sort();

    const result: ModuleManifest[] = [];

    while (queue.length > 0) {
      const id = queue.shift()!;
      result.push(this.registry.get(id));

      for (const depId of dependents.get(id)!) {
        const newDegree = inDegree.get(depId)! - 1;
        inDegree.set(depId, newDegree);
        if (newDegree === 0) {
          // Insert into queue in sorted position for deterministic order
          const insertIdx = queue.findIndex((q) => q > depId);
          if (insertIdx === -1) {
            queue.push(depId);
          } else {
            queue.splice(insertIdx, 0, depId);
          }
        }
      }
    }

    // If not all modules were sorted, there's a cycle
    if (result.length !== ids.size) {
      const unsorted = [...ids].filter((id) => !result.some((m) => m.id === id));
      throw new Error(
        `Circular dependency detected among modules: ${unsorted.join(', ')}`,
      );
    }

    return result;
  }
}
