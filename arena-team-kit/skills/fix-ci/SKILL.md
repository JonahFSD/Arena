---
name: fix-ci
description: Find failing PR checks, inspect logs or external check links, and apply one focused fix per iteration
---

# Fix CI

## Trigger

Branch or PR CI is failing and needs a fast, iterative path to green checks.

## Prerequisites

`gh` (GitHub CLI) must be installed and authenticated. If not:

```
Error: gh is not installed or not authenticated.
Install: https://cli.github.com
Authenticate: gh auth login
```

## Workflow

1. Resolve the active PR and inspect `gh pr checks --json name,bucket,state,workflow,link`.
2. Identify the first failing hard-gate check (Typecheck or Build). Advisory checks (Lint, Convex preview) are noted but not the primary target.
3. Extract the first actionable error from logs:
   - For GitHub Actions checks: `gh run view <run-id> --log-failed`
   - For external checks: follow the check link and inspect the reported error
4. Apply the smallest safe fix.
5. Push, re-check the PR check set, and repeat until all hard-gate checks are green.

## Commands

```bash
# Inspect all attached checks
gh pr checks --json name,bucket,state,workflow,link

# View failed GitHub Actions logs
gh run view <run-id> --log-failed

# Watch checks after pushing
gh pr checks --watch --fail-fast
```

## Arena CI Hard Gates

- **Typecheck** — `npm run typecheck` (tsc, zero errors required)
- **Build** — `npm run build:ci` (Next.js production build, zero errors required)

## Guardrails

- Fix ONE actionable failure at a time — do not batch unrelated changes.
- Prefer minimal, low-risk changes before broader refactors.
- **NEVER use `--no-verify`** — if a hook fails, fix the underlying issue.
- Keep `gh pr checks` as the single source of truth for PR CI state.

## Output

- Primary failing job and root error
- Fix applied
- Current CI status and next action
