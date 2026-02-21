import fs from 'fs-extra';
import { chmod, mkdir } from 'node:fs/promises';
import path from 'node:path';
import type { ProjectContext } from '../core/context.js';

interface HookEntry {
  matcher?: string;
  hooks: Array<{
    type: 'command';
    command: string;
    timeout?: number;
  }>;
}

export interface HooksConfig {
  hooks: {
    TaskCompleted?: HookEntry[];
    TeammateIdle?: HookEntry[];
    PreToolUse?: HookEntry[];
    PostToolUse?: HookEntry[];
    Notification?: HookEntry[];
    PreCompact?: HookEntry[];
    Stop?: HookEntry[];
  };
}

export interface HooksResult {
  scripts: string[];
  config: HooksConfig;
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

const PROTECT_SECRETS_SH = `#!/bin/bash
# PreToolUse hook: block access to secret/credential files
# Matches Read, Edit, Write tool invocations

INPUT=$(cat)
FILE=$(echo "$INPUT" | jq -r '.tool_input.file_path // .tool_input.path // empty')

[ -z "$FILE" ] && exit 0

# Check for sensitive file patterns
case "$FILE" in
  *.env|*.env.*|*.pem|*.key)
    echo '{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"deny","permissionDecisionReason":"Blocked: access to sensitive file '"$FILE"'"}}'
    exit 0
    ;;
esac

BASENAME=$(basename "$FILE")
case "$BASENAME" in
  credentials*|secrets*)
    echo '{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"deny","permissionDecisionReason":"Blocked: access to credentials/secrets file '"$FILE"'"}}'
    exit 0
    ;;
esac

exit 0
`;

const NOTIFY_WAITING_SH = `#!/bin/bash
# Notification hook: send desktop notification when Claude needs attention
# Triggered on idle_prompt events

INPUT=$(cat)

# Cross-platform notification
MESSAGE="Claude Code needs your attention"

if command -v osascript &>/dev/null; then
  # macOS
  osascript -e "display notification \\"$MESSAGE\\" with title \\"Claude Code\\"" 2>/dev/null &
elif command -v notify-send &>/dev/null; then
  # Linux (freedesktop)
  notify-send "Claude Code" "$MESSAGE" 2>/dev/null &
elif command -v powershell.exe &>/dev/null; then
  # Windows (WSL)
  powershell.exe -Command "[System.Reflection.Assembly]::LoadWithPartialName('System.Windows.Forms') | Out-Null; [System.Windows.Forms.MessageBox]::Show('$MESSAGE', 'Claude Code')" 2>/dev/null &
fi

exit 0
`;

const QUALITY_GATE_TASK_SH = `#!/bin/bash
# TaskCompleted hook — BLOCKS task completion if quality checks fail (exit 2)

# Read task info from stdin
TASK_JSON=$(cat)
TASK_SUBJECT=$(echo "$TASK_JSON" | grep -o '"subject":"[^"]*"' | head -1 | sed 's/"subject":"//;s/"//')

# Only check implementation tasks (story IDs or implementation keywords)
if ! echo "$TASK_SUBJECT" | grep -qiE '(P[0-9]+-|SDD-|implement|feat|build|create)'; then
  exit 0
fi

echo "Quality Gate: Running checks for implementation task..."
echo ""

# Run flutter analyze
echo "Running flutter analyze..."
if ! flutter analyze --no-pub 2>&1; then
  echo ""
  echo "BLOCKED: flutter analyze found issues. Fix them before completing this task."
  exit 2
fi

echo ""

# Run flutter test
echo "Running flutter test..."
if ! flutter test 2>&1; then
  echo ""
  echo "BLOCKED: flutter test failed. Fix failing tests before completing this task."
  exit 2
fi

echo ""
echo "Quality Gate PASSED. Task may proceed."
exit 0
`;

const PRECOMPACT_PRESERVE_SH = `#!/bin/bash
# PreCompact hook — preserves critical context before compaction

echo "## Context Preservation Summary"
echo ""
echo "### Modified Files"
git diff --name-only 2>/dev/null || echo "(not a git repo)"
echo ""
echo "### Staged Files"
git diff --cached --name-only 2>/dev/null || echo "(none)"
echo ""
echo "### Current Branch"
git branch --show-current 2>/dev/null || echo "(unknown)"
echo ""
echo "### Recent Commits"
git log --oneline -5 2>/dev/null || echo "(none)"
echo ""
if [ -f ".claude/decisions.md" ]; then
  echo "### Architecture Decisions"
  cat .claude/decisions.md
fi

exit 0
`;

const CONTEXT_MONITOR_SH = `#!/bin/bash
# Stop hook — advisory context management guidance
# Runs when a conversation stops; warns about context fill and recommends actions

echo "## Context Management Advisory"
echo ""
echo "### Recommendations"
echo "- If context is getting large, use /clear to reset"
echo "- Delegate complex sub-tasks to subagents via the Task tool"
echo "- Use PreCompact hook to preserve critical context before compaction"
echo ""
echo "### Current Working State"
git status --short 2>/dev/null || echo "(not a git repo)"
echo ""
echo "### Uncommitted Changes"
git diff --stat 2>/dev/null || echo "(none)"
echo ""
echo "### Suspicious Patterns Check"
# Check for potential context poisoning indicators
if git diff --cached --name-only 2>/dev/null | grep -qE '\\.(env|pem|key)$'; then
  echo "WARNING: Staged files include potentially sensitive files"
fi
echo ""
echo "Remember: commit early, commit often. Push after every commit."

exit 0
`;

export async function writeHooks(context: ProjectContext, outputPath: string): Promise<HooksResult> {
  const claudeDir = path.join(outputPath, '.claude');
  const hooksDir = path.join(claudeDir, 'hooks');

  await fs.ensureDir(claudeDir);
  await mkdir(hooksDir, { recursive: true });

  // Write shell scripts
  const blockDangerousPath = path.join(hooksDir, 'block-dangerous.sh');
  const formatDartPath = path.join(hooksDir, 'format-dart.sh');
  const protectSecretsPath = path.join(hooksDir, 'protect-secrets.sh');
  const notifyWaitingPath = path.join(hooksDir, 'notify-waiting.sh');
  const qualityGateTaskPath = path.join(hooksDir, 'quality-gate-task.sh');
  const precompactPreservePath = path.join(hooksDir, 'precompact-preserve.sh');
  const contextMonitorPath = path.join(hooksDir, 'context-monitor.sh');

  await fs.writeFile(blockDangerousPath, BLOCK_DANGEROUS_SH);
  await fs.writeFile(formatDartPath, FORMAT_DART_SH);
  await fs.writeFile(protectSecretsPath, PROTECT_SECRETS_SH);
  await fs.writeFile(notifyWaitingPath, NOTIFY_WAITING_SH);
  await fs.writeFile(qualityGateTaskPath, QUALITY_GATE_TASK_SH);
  await fs.writeFile(precompactPreservePath, PRECOMPACT_PRESERVE_SH);
  await fs.writeFile(contextMonitorPath, CONTEXT_MONITOR_SH);

  // Make scripts executable (mode 0o755)
  await chmod(blockDangerousPath, 0o755);
  await chmod(formatDartPath, 0o755);
  await chmod(protectSecretsPath, 0o755);
  await chmod(notifyWaitingPath, 0o755);
  await chmod(qualityGateTaskPath, 0o755);
  await chmod(precompactPreservePath, 0o755);
  await chmod(contextMonitorPath, 0o755);

  const scripts = [blockDangerousPath, formatDartPath, protectSecretsPath, notifyWaitingPath, qualityGateTaskPath, precompactPreservePath, contextMonitorPath];

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
      {
        matcher: 'Read|Edit|Write',
        hooks: [
          {
            type: 'command',
            command: '.claude/hooks/protect-secrets.sh',
            timeout: 5,
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
            command: '.claude/hooks/quality-gate-task.sh',
            timeout: 120,
          },
        ],
      },
    ],
    Notification: [
      {
        matcher: 'idle_prompt',
        hooks: [
          {
            type: 'command',
            command: '.claude/hooks/notify-waiting.sh',
            timeout: 10,
          },
        ],
      },
    ],
    PreCompact: [
      {
        hooks: [
          {
            type: 'command',
            command: '.claude/hooks/precompact-preserve.sh',
            timeout: 30,
          },
        ],
      },
    ],
    Stop: [
      {
        hooks: [
          {
            type: 'command',
            command: '.claude/hooks/context-monitor.sh',
            timeout: 15,
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

  return { scripts, config };
}
