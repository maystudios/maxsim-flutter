import fs from 'fs-extra';
import { chmod, mkdir } from 'node:fs/promises';
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

const BLOCK_DANGEROUS_SH = `#!/bin/bash
# PreToolUse hook: block dangerous bash commands
# Claude passes tool input as JSON on stdin

INPUT=$(cat)

DANGEROUS_PATTERNS=("rm -rf" "--no-verify" "--force" "reset --hard" "clean -f")

for PATTERN in "\${DANGEROUS_PATTERNS[@]}"; do
  if echo "$INPUT" | grep -qF "$PATTERN"; then
    echo "Blocked: dangerous pattern detected: $PATTERN" >&2
    exit 2
  fi
done

exit 0
`;

const FORMAT_DART_SH = `#!/bin/bash
# PostToolUse hook: run dart format on modified .dart files
# Claude passes tool input as JSON on stdin

INPUT=$(cat)

# Extract file_path from JSON and check if it's a .dart file
if echo "$INPUT" | grep -qE '"file_path"\\s*:\\s*"[^"]*\\.dart"'; then
  FILE=$(echo "$INPUT" | grep -oE '"file_path"\\s*:\\s*"[^"]+"' | sed 's/.*"file_path"\\s*:\\s*"//;s/".*//')
  if [[ -n "$FILE" ]]; then
    dart format "$FILE" 2>/dev/null || true
  fi
fi

exit 0
`;

export async function writeHooks(context: ProjectContext, outputPath: string): Promise<void> {
  const claudeDir = path.join(outputPath, '.claude');
  const hooksDir = path.join(claudeDir, 'hooks');

  await fs.ensureDir(claudeDir);
  await mkdir(hooksDir, { recursive: true });

  // Write shell scripts
  const blockDangerousPath = path.join(hooksDir, 'block-dangerous.sh');
  const formatDartPath = path.join(hooksDir, 'format-dart.sh');

  await fs.writeFile(blockDangerousPath, BLOCK_DANGEROUS_SH);
  await fs.writeFile(formatDartPath, FORMAT_DART_SH);

  // Make scripts executable (mode 0o755)
  await chmod(blockDangerousPath, 0o755);
  await chmod(formatDartPath, 0o755);

  // Build hooks config
  const hooks: HooksConfig['hooks'] = {
    PreToolUse: [
      {
        matcher: 'Bash',
        hooks: [
          {
            type: 'command',
            command: '.claude/hooks/block-dangerous.sh',
          },
        ],
      },
    ],
    PostToolUse: [
      {
        matcher: 'Edit|Write',
        hooks: [
          {
            type: 'command',
            command: '.claude/hooks/format-dart.sh',
          },
        ],
      },
    ],
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
