#!/usr/bin/env bash
# Hook: PreToolUse on Bash
# Blocks dangerous commands that could bypass safety checks or destroy data.

set -euo pipefail

# Read tool input from stdin (JSON)
INPUT=$(cat)

# Extract the command from the JSON input
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty' 2>/dev/null || echo "")

if [ -z "$COMMAND" ]; then
  exit 0
fi

# Check for dangerous patterns
BLOCKED_PATTERNS=(
  "rm -rf"
  "--no-verify"
  "--force"
  "git push --force"
  "git push -f "
  "git reset --hard"
  "git clean -f"
)

for pattern in "${BLOCKED_PATTERNS[@]}"; do
  if echo "$COMMAND" | grep -qF "$pattern"; then
    echo '{"decision":"block","reason":"Blocked dangerous command pattern: '"$pattern"'. This command can cause irreversible damage. Use safer alternatives or get explicit user approval."}'
    exit 0
  fi
done

# Allow the command
exit 0
