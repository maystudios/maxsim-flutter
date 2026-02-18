---
name: run-ralph
description: Start Ralph autonomous agent loop to implement PRD stories
---

Start the Ralph autonomous agent loop to implement stories from prd.json.

Before starting, verify:
1. `prd.json` exists and has incomplete stories
2. `npm run build` compiles without errors
3. Git working directory is clean

Then run:
```bash
./ralph.sh --tool claude 25
```

Monitor progress via `progress.txt` and `prd.json`.
