---
name: ralph
description: Run Ralph autonomous agent loop or check Ralph status. Use /ralph to start autonomous development, /ralph status to check progress.
disable-model-invocation: true
argument-hint: [action: run|status|resume]
---

# Ralph Autonomous Development Skill

## Actions

### Run
Start the Ralph agent loop:
```bash
./ralph.sh --tool claude 25
```

This will autonomously iterate through prd.json stories, implementing one per iteration.

### Status
Check current Ralph progress:
1. Read `prd.json` — count completed vs remaining stories
2. Read `progress.txt` — see what was done in recent iterations
3. Report phase progress and estimated remaining work

### Resume
If Ralph stopped mid-run (max iterations or error):
1. Check `progress.txt` for last completed story
2. Check `prd.json` for next incomplete story
3. Restart Ralph from where it left off

## Prerequisites

- `jq` installed (`sudo apt install jq`)
- `claude` CLI in PATH
- `prd.json` exists with valid stories
- `npm run build` succeeds (project compiles)

## TDD Integration

Ralph iterations follow TDD discipline:
- Quality gates include test-first verification
- Each story must have tests written before implementation
- `npm run quality` is run before marking any story complete
- Coverage thresholds must be met: statements 80%, branches 75%, functions 80%, lines 80%

## Monitoring

While Ralph runs, you can:
- Watch `progress.txt` for real-time updates
- Check `prd.json` for story completion status
- Check git log for commits (one per completed story)
