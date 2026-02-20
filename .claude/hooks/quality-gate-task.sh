#!/usr/bin/env bash
# Hook: TaskCompleted
# Enforces quality gates after each agent task completion.
# Reminds agents to verify quality before marking tasks done.

set -euo pipefail

INPUT=$(cat)

# Extract task subject if available
SUBJECT=$(echo "$INPUT" | jq -r '.task.subject // empty' 2>/dev/null || echo "")

# Only trigger for implementation tasks (not review/status tasks)
if echo "$SUBJECT" | grep -qiE "(P[0-9]+-[0-9]+|implement|feat|feature|story)"; then
  echo "QUALITY GATE REMINDER: Before marking this task complete, verify:"
  echo "  1. npm run quality passes (typecheck + lint + test)"
  echo "  2. Coverage thresholds met (check jest.config.mjs)"
  echo "  3. No it.todo() or it.skip() remnants"
  echo "  4. Test names are behavioral"
fi

exit 0
