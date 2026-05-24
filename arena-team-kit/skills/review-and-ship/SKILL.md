---
name: review-and-ship
description: Review the current branch for bugs, intent fit, and correctness; run available checks; commit focused work; open or update a PR.
---

# Review and Ship

## Trigger

Reviewing changes before shipping. Close key issues, verify behavior, and open or update a PR.

## Prerequisites

`gh` (GitHub CLI) must be installed and authenticated. If not:

```
Error: gh is not installed or not authenticated.
Install: https://cli.github.com
Authenticate: gh auth login
```

## Workflow

1. Gather context: diff against base branch, uncommitted changes, recent commits, changed files.
2. Run the available verification checks for changed behavior:
   - `npm run typecheck` — zero TypeScript errors required
   - `npm run build:ci` — zero build errors required
   - Manual browser check for any UI changes
3. Review for correctness, regressions, security, and intent fit. Use the `convex-review` skill for any PR touching `convex/`.
4. Fix critical issues before finalizing.
5. Commit selective files with a concise Conventional Commits message.
6. Push the branch and open or update a PR.

## Commands

```bash
git fetch origin main
git diff origin/main...HEAD
git status
npm run typecheck
npm run build:ci
gh pr checks --json name,bucket,state,workflow,link
```

## Arena-Specific Checks

- If the PR touches `convex/` → run the `convex-review` skill.
- If the PR touches ESLint config or tsconfig → confirm `eslint.seatbelt.tsv` counts do not increase.
- All Convex mutations must call `getAuthUser`/`requireAdmin` — see AGENTS.md.

## Guardrails

- Prioritize correctness, security, and regressions over style-only comments.
- Keep commits focused — avoid unrelated file changes.
- **NEVER bypass hooks (`--no-verify`)** — if pre-commit checks fail, fix the underlying issue.
- Use `gh pr checks` instead of guessing CI state from local commands.
- Use `verify-this` to produce falsifiable evidence for claims in the PR description.

## Note on Tests

Arena has no automated test suite yet (arriving in Phase 7). Verification is currently limited to `npm run typecheck`, `npm run build:ci`, manual browser steps, and `gh pr checks`. Document any verification gaps explicitly in the PR's `## Verification` section.

## Output

- Findings summary (critical, warning, note)
- Checks run and outcomes
- PR URL
