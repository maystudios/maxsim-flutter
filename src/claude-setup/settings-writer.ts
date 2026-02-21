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
        'Read(./**/google-services.json)',
        'Read(./**/GoogleService-Info.plist)',
        'Bash(rm -rf *)',
        'Bash(sudo *)',
        'Bash(git push --force *)',
      ],
    },
  };

  if (hooksConfig) {
    settings.hooks = hooksConfig.hooks;
  }

  // Always include AUTOCOMPACT override; conditionally add agent teams
  const env: Record<string, string> = {
    CLAUDE_AUTOCOMPACT_PCT_OVERRIDE: '70',
  };
  if (context.claude?.agentTeams) {
    env.CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS = '1';
  }
  settings.env = env;

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
        'Bash(dart run build_runner *)',
        'Bash(git diff *)',
        'Bash(git status)',
        'Bash(git log *)',
        'Read(./lib/**)',
        'Read(./test/**)',
        'Read(./pubspec.yaml)',
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
