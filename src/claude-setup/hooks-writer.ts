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
    TeammateIdle?: HookEntry[];
    PreToolUse?: HookEntry[];
    PostToolUse?: HookEntry[];
  };
}

export async function writeHooks(context: ProjectContext, outputPath: string): Promise<void> {
  const claudeDir = path.join(outputPath, '.claude');
  await fs.ensureDir(claudeDir);

  const hooks: HooksConfig['hooks'] = {
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
  };

  if (context.claude?.agentTeams) {
    hooks.TeammateIdle = [
      {
        hooks: [
          {
            type: 'command',
            command: 'git diff --stat HEAD && git status --porcelain',
          },
        ],
      },
    ];
  }

  const config: HooksConfig = { hooks };

  const settingsPath = path.join(claudeDir, 'settings.local.json');
  await fs.writeFile(settingsPath, JSON.stringify(config, null, 2) + '\n');
}
