import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const CHECK_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours
const FETCH_TIMEOUT_MS = 3000; // 3 seconds
const REGISTRY_URL = 'https://registry.npmjs.org/maxsim-flutter/latest';
const CACHE_DIR = join(homedir(), '.maxsim-flutter');
const CACHE_FILE = join(CACHE_DIR, 'last-update-check');

export function getCurrentVersion(): string {
  try {
    const pkgPath = join(__dirname, '../../package.json');
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8')) as { version: string };
    return pkg.version;
  } catch {
    return '0.0.0';
  }
}

async function isCheckDue(): Promise<boolean> {
  try {
    const content = await readFile(CACHE_FILE, 'utf-8');
    const lastCheck = parseInt(content.trim(), 10);
    if (isNaN(lastCheck)) return true;
    return Date.now() - lastCheck > CHECK_INTERVAL_MS;
  } catch {
    // File doesn't exist — check is due
    return true;
  }
}

async function recordCheck(): Promise<void> {
  try {
    await mkdir(CACHE_DIR, { recursive: true });
    await writeFile(CACHE_FILE, String(Date.now()), 'utf-8');
  } catch {
    // Non-critical — ignore write errors
  }
}

function compareVersions(a: string, b: string): number {
  const partsA = a.split('.').map(Number);
  const partsB = b.split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    const diff = (partsA[i] ?? 0) - (partsB[i] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

/**
 * Check if a newer version of maxsim-flutter is available on npm.
 * Returns the newer version string, or null if no update or on any error.
 * Throttled to once per 24 hours.
 */
export async function checkForUpdate(): Promise<string | null> {
  try {
    if (!(await isCheckDue())) return null;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    let latestVersion: string;
    try {
      const response = await fetch(REGISTRY_URL, { signal: controller.signal });
      if (!response.ok) return null;
      const data = (await response.json()) as { version?: string };
      latestVersion = data.version ?? '';
    } finally {
      clearTimeout(timer);
    }

    await recordCheck();

    if (!latestVersion) return null;

    const currentVersion = getCurrentVersion();
    if (compareVersions(latestVersion, currentVersion) > 0) {
      return latestVersion;
    }

    return null;
  } catch {
    // Silently ignore all errors (network failures, timeouts, parse errors)
    return null;
  }
}
