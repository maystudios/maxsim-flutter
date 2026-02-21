#!/usr/bin/env bash
# Hook: TaskCompleted
# Enforces quality gates after each agent task completion.
# Blocks non-compliant task completions with exit 2.

set -euo pipefail

INPUT=$(cat)

# Extract task subject if available
SUBJECT=$(echo "$INPUT" | jq -r '.task.subject // empty' 2>/dev/null || echo "")

# Only trigger for implementation tasks (not review/status tasks)
if echo "$SUBJECT" | grep -qiE "(P[0-9]+-[0-9]+|implement|feat|feature|story)"; then
  echo "QUALITY GATE: Running npm run quality before task completion..."

  if ! npm run quality --silent 2>&1; then
    echo ""
    echo "BLOCKED: Quality gates failed. Fix issues before completing this task:"
    echo "  1. npm run quality passes (typecheck + lint + test)"
    echo "  2. Coverage thresholds met (check jest.config.mjs)"
    echo "  3. No it.todo() or it.skip() remnants"
    echo "  4. Test names are behavioral"
    exit 2
  fi

  echo "QUALITY GATE: All checks passed."
fi

exit 0
