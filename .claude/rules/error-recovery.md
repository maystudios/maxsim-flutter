---
paths:
  - "src/**"
  - "tests/**"
---
# Error Recovery Protocol

## 4-Tier Escalation

### Tier 1: Self-Correction
- Re-read the exact error message
- Check recent changes for mistakes
- Run `npm run typecheck` for type errors
- Run `npm test -- --testPathPattern=<failing>` to isolate
- Try clearing build: `npm run build`

### Tier 2: AI-to-AI Escalation
- After 2 failed attempts, ask another agent
- Share: exact error, what you tried, file paths
- A fresh context often spots what you missed

### Tier 3: Human-Augmented
- After 3 failed attempts total
- Ask user for: domain context, API docs, business rules

### Tier 4: Full Human Takeover
- When issue requires: external service access, production DB, manual testing
- Hand off with: error, repro steps, files, what was tried

## TypeScript-Specific Recovery
- `npm run build` — recompile
- `rm -rf node_modules && npm install` — clean deps
- Check `.js` ESM extensions in imports
- Check `jest.unstable_mockModule` ordering (BEFORE dynamic import)
