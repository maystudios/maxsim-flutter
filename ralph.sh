#!/bin/bash
# Ralph - Autonomous AI Agent Loop
# Iterates through prd.json stories using Claude Code or Amp CLI
# Source: https://github.com/snarktank/ralph

set -euo pipefail

TOOL="claude"
MAX_ITERATIONS=25
ITERATION=0

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --tool)
      TOOL="$2"
      shift 2
      ;;
    --tool=*)
      TOOL="${1#*=}"
      shift
      ;;
    [0-9]*)
      MAX_ITERATIONS="$1"
      shift
      ;;
    *)
      echo "Usage: ./ralph.sh [--tool claude|amp] [max_iterations]"
      exit 1
      ;;
  esac
done

# Validate tool
if [[ "$TOOL" != "claude" && "$TOOL" != "amp" ]]; then
  echo "Error: --tool must be 'claude' or 'amp'"
  exit 1
fi

# Check dependencies
if ! command -v jq &> /dev/null; then
  echo "Error: jq is required. Install it: sudo apt install jq"
  exit 1
fi

if ! command -v "$TOOL" &> /dev/null; then
  echo "Error: $TOOL CLI not found in PATH"
  exit 1
fi

# Check prd.json exists
if [[ ! -f "prd.json" ]]; then
  echo "Error: prd.json not found in current directory"
  exit 1
fi

# Archive previous run if branch changed
CURRENT_BRANCH=$(jq -r '.branchName // "main"' prd.json)
if [[ -f ".last-branch" ]]; then
  LAST_BRANCH=$(cat .last-branch)
  if [[ "$CURRENT_BRANCH" != "$LAST_BRANCH" ]]; then
    echo "Branch changed from $LAST_BRANCH to $CURRENT_BRANCH. Archiving previous run..."
    mkdir -p archive
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    [[ -f "progress.txt" ]] && mv progress.txt "archive/progress_${LAST_BRANCH}_${TIMESTAMP}.txt"
    cp prd.json "archive/prd_${LAST_BRANCH}_${TIMESTAMP}.json"
  fi
fi
echo "$CURRENT_BRANCH" > .last-branch

echo "=== Ralph Autonomous Agent Loop ==="
echo "Tool: $TOOL"
echo "Max iterations: $MAX_ITERATIONS"
echo "Branch: $CURRENT_BRANCH"
echo "==================================="

while [[ $ITERATION -lt $MAX_ITERATIONS ]]; do
  ITERATION=$((ITERATION + 1))
  echo ""
  echo "--- Iteration $ITERATION / $MAX_ITERATIONS ---"

  # Run the AI tool
  if [[ "$TOOL" == "claude" ]]; then
    OUTPUT=$(claude --dangerously-skip-permissions -p "Read prd.json and progress.txt. Check the current git branch matches '$CURRENT_BRANCH'. Find the highest-priority user story where passes is false. Implement ONLY that one story. Run quality checks (npm run typecheck, npm run lint, npm test). Commit with message 'feat: [StoryID] - [Story Title]'. Mark the story passes:true in prd.json. Append a timestamped entry to progress.txt describing what you did. If ALL stories now have passes:true, respond with <promise>COMPLETE</promise>." 2>&1) || true
  else
    OUTPUT=$(amp --dangerously-allow-all -p "$(cat prompt.md)" 2>&1) || true
  fi

  # Check for completion
  if echo "$OUTPUT" | grep -q "<promise>COMPLETE</promise>"; then
    echo ""
    echo "=== ALL STORIES COMPLETE ==="
    echo "Ralph finished in $ITERATION iterations."
    exit 0
  fi

  echo "Story not yet complete. Continuing..."
  sleep 2
done

echo ""
echo "=== MAX ITERATIONS REACHED ==="
echo "Ralph did not complete all stories within $MAX_ITERATIONS iterations."
exit 1
