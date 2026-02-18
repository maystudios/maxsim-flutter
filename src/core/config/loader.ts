import { readFile } from 'node:fs/promises';
import { load as yamlLoad } from 'js-yaml';
import { ZodError } from 'zod';
import { MaxsimConfigSchema } from './schema.js';
import type { MaxsimConfig } from '../../types/config.js';

export function parseConfig(raw: unknown): MaxsimConfig {
  try {
    return MaxsimConfigSchema.parse(raw);
  } catch (err) {
    if (err instanceof ZodError) {
      const messages = err.errors.map((e) => `  - ${e.path.join('.')}: ${e.message}`).join('\n');
      throw new Error(`Invalid configuration:\n${messages}`);
    }
    throw err;
  }
}

export async function loadConfig(filePath: string): Promise<MaxsimConfig> {
  let raw: string;
  try {
    raw = await readFile(filePath, 'utf-8');
  } catch (err) {
    const nodeErr = err as NodeJS.ErrnoException;
    if (nodeErr.code === 'ENOENT') {
      throw new Error(`Config file not found: ${filePath}`);
    }
    throw new Error(`Failed to read config file: ${filePath}: ${String(err)}`);
  }

  let parsed: unknown;
  try {
    parsed = yamlLoad(raw);
  } catch (err) {
    throw new Error(`Invalid YAML in config file ${filePath}: ${String(err)}`);
  }

  return parseConfig(parsed);
}
