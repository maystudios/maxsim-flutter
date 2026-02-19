import fs from 'fs-extra';
import path from 'node:path';
import type { ProjectContext } from '../core/context.js';

interface HookEntry {
  matcher?: string;
  hooks: Array<{
    type: 'command';
    command: string;
  }>;
}

interface HooksConfig {
  hooks: {
    TaskCompleted?: HookEntry[];
    PreToolUse?: HookEntry[];
    PostToolUse?: HookEntry[];
  };
}

export async function writeHooks(_context: ProjectContext, outputPath: string): Promise<void> {
  const claudeDir = path.join(outputPath, '.claude');
  await fs.ensureDir(claudeDir);

  const config: HooksConfig = {
    hooks: {
      TaskCompleted: [
        {
          hooks: [
            {
              type: 'command',
              command: 'flutter analyze && flutter test',
            },
          ],
        },
      ],
    },
  };

  const settingsPath = path.join(claudeDir, 'settings.local.json');
  await fs.writeFile(settingsPath, JSON.stringify(config, null, 2) + '\n');
}
