import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

/**
 * Create a temporary directory with an optional prefix.
 * Returns the absolute path to the directory.
 */
export async function createTempDir(prefix = 'test-'): Promise<string> {
  return mkdtemp(join(tmpdir(), prefix));
}

/**
 * Remove a temporary directory and all its contents.
 */
export async function removeTempDir(dir: string): Promise<void> {
  await rm(dir, { recursive: true, force: true });
}

/**
 * Auto-managed temp directory for Jest tests.
 * Call at describe scope — it registers beforeEach/afterEach hooks automatically.
 *
 * @example
 * ```ts
 * describe('MyTest', () => {
 *   const tmp = useTempDir('my-test-');
 *
 *   it('uses temp dir', async () => {
 *     const dir = tmp.path; // fresh temp dir each test
 *   });
 * });
 * ```
 */
export function useTempDir(prefix = 'test-'): { readonly path: string } {
  let dir = '';

  beforeEach(async () => {
    dir = await createTempDir(prefix);
  });

  afterEach(async () => {
    if (dir) {
      await removeTempDir(dir);
    }
  });

  return {
    get path() {
      return dir;
    },
  };
}
