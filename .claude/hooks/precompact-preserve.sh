#!/usr/bin/env bash
# Hook: PreCompact
# Preserves critical context before auto-compaction.
# Outputs modified files, test results, and prd.json status.

set -euo pipefail

echo "=== PRE-COMPACT CONTEXT PRESERVATION ==="
echo ""

# Preserve modified files
echo "## Modified Files"
git status --short 2>/dev/null || echo "(not a git repo)"
echo ""

# Preserve recent test results
echo "## Last Test Results"
npm test --silent 2>&1 | tail -5 || echo "(tests not available)"
echo ""

# Preserve prd.json status
echo "## PRD Status"
if [ -f prd.json ]; then
  TOTAL=$(jq '[.phases[].stories[]] | length' prd.json 2>/dev/null || echo "?")
  DONE=$(jq '[.phases[].stories[] | select(.passes == true)] | length' prd.json 2>/dev/null || echo "?")
  echo "Stories: $DONE/$TOTAL complete"
else
  echo "(no prd.json found)"
fi
echo ""
echo "=== END CONTEXT PRESERVATION ==="
