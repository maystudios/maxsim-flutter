import { writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import type { ProjectContext } from '../core/context.js';

interface SettingsJson {
  $schema: string;
  permissions: {
    deny: string[];
  };
  hooks?: Record<string, unknown>;
  env?: Record<string, string>;
}

interface SettingsLocalJson {
  permissions: {
    allow: string[];
  };
}

/**
 * Generates .claude/settings.json (team-shared) and .claude/settings.local.json (personal).
 * settings.json contains hooks, deny permissions, and env config.
 * settings.local.json contains only allow permissions for local development.
 */
export async function writeSettings(
  context: ProjectContext,
  outputPath: string,
  hooksConfig?: { hooks: Record<string, unknown> },
): Promise<void> {
  const claudeDir = join(outputPath, '.claude');
  await mkdir(claudeDir, { recursive: true });

  // Build settings.json (team-shared)
  const settings: SettingsJson = {
    $schema: 'https://json.schemastore.org/claude-code-settings.json',
    permissions: {
      deny: [
        'Read(./.env)',
        'Read(./.env.*)',
        'Edit(./.env)',
        'Edit(./.env.*)',
        'Read(./credentials*)',
        'Read(./secrets*)',
        'Read(./**/*.pem)',
        'Read(./**/*.key)',
        'Bash(rm -rf *)',
        'Bash(sudo *)',
      ],
    },
  };

  if (hooksConfig) {
    settings.hooks = hooksConfig.hooks;
  }

  if (context.claude?.agentTeams) {
    settings.env = {
      CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS: '1',
    };
  }

  await writeFile(
    join(claudeDir, 'settings.json'),
    JSON.stringify(settings, null, 2) + '\n',
    'utf-8',
  );

  // Build settings.local.json (personal)
  const settingsLocal: SettingsLocalJson = {
    permissions: {
      allow: [
        'Bash(flutter *)',
        'Bash(dart *)',
        'Bash(git diff *)',
        'Bash(git status)',
        'Bash(git log *)',
        'Read(./lib/**)',
        'Read(./test/**)',
        'Edit(./lib/**)',
        'Edit(./test/**)',
      ],
    },
  };

  await writeFile(
    join(claudeDir, 'settings.local.json'),
    JSON.stringify(settingsLocal, null, 2) + '\n',
    'utf-8',
  );
}
