#!/usr/bin/env bash
# Hook: PreToolUse on Read|Edit|Write
# Blocks access to secret/credential files.

set -euo pipefail

INPUT=$(cat)

# Extract file path from tool input (works for Read, Edit, Write)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // .tool_input.path // empty' 2>/dev/null || echo "")

if [ -z "$FILE_PATH" ]; then
  exit 0
fi

# Normalize to basename for pattern matching
BASENAME=$(basename "$FILE_PATH")
DIRNAME=$(dirname "$FILE_PATH")

# Block .env files
case "$BASENAME" in
  .env|.env.*|.env.local|.env.production|.env.staging)
    echo '{"decision":"block","reason":"Blocked access to environment file: '"$BASENAME"'. These files may contain secrets."}'
    exit 0
    ;;
esac

# Block known credential patterns
case "$BASENAME" in
  credentials*|secrets*|*.pem|*.key|*secret*|*credential*|service-account*.json)
    echo '{"decision":"block","reason":"Blocked access to potential credentials file: '"$BASENAME"'."}'
    exit 0
    ;;
esac

exit 0
