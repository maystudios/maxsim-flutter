# Git Workflow Rules

## Commit Message Format (Conventional Commits)

- `feat: [Story-ID] - short description` — new features / story work
- `fix: short description` — bug fixes
- `chore: short description` — tooling, config, CI, deps
- `refactor: short description` — code restructuring, no behavior change
- `test: short description` — adding or fixing tests
- `docs: short description` — documentation only

## Workflow Order

1. Run quality gates: `npm run quality`
2. Stage only relevant files (`git add <files>`) — never blind `git add -A`
3. Commit with clear conventional-commit message
4. **Push immediately**: `git push` (or `git push -u origin <branch>` for new branches)

## Rules

- One logical change per commit — don't bundle unrelated changes
- NEVER skip pre-commit hooks (`--no-verify` is forbidden)
- NEVER force-push to `main`
- NEVER amend published commits unless explicitly asked
- ALWAYS push to remote after every commit — no local-only commits
