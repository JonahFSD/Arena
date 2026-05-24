---
name: loop-on-ci
description: Monitor PR checks and fix failures until green. Uses gh pr checks as the single source of CI truth for PR-attached checks.
---

# Loop on CI

## Trigger

Need to watch a branch or pull request and iterate on CI failures until all required checks are green.

Use `gh pr checks` as the single source of truth. It includes all PR-attached checks; `gh run list` only covers GitHub Actions and misses external checks.

## Prerequisites

`gh` (GitHub CLI) must be installed and authenticated. If not:

```
Error: gh is not installed or not authenticated.
Install: https://cli.github.com
Authenticate: gh auth login
```

## Workflow

1. Resolve the PR for the current branch.
2. Inspect current PR checks before waiting.
3. If checks already failed, diagnose those failures first.
4. Apply ONE actionable fix per iteration — do not batch unrelated fixes.
5. Push the fix; wait for CI to re-evaluate.
6. Re-check the full PR check set and repeat until all required checks are green.

Use the `ci-watcher` subagent to poll for results and surface actionable failures.

## Commands

```bash
# Resolve the active PR
gh pr view --json number,url,headRefName

# Inspect all attached checks
gh pr checks --json name,bucket,state,workflow,link

# Watch pending checks and fail fast
gh pr checks --watch --fail-fast

# GitHub Actions logs when the failing check links to a GHA run
gh run view <run-id> --log-failed
```

## Arena CI Gates

| Job name | Type |
|---|---|
| Typecheck | Hard gate — must be green |
| Build | Hard gate — must be green |
| Lint (advisory) | Advisory — `continue-on-error`, failure does not block merge |
| Convex preview deploy (advisory) | Advisory — `continue-on-error` |

Focus loop iterations on the two hard gates. Advisory failures are noted but do not block.

## Guardrails

- Apply ONE fix per iteration — one failure cause at a time.
- **NEVER bypass hooks (`--no-verify`)** — fix the underlying issue instead.
- If a failure is clearly unrelated to the PR and appears fixed on main, merge latest main rather than adding unrelated fixes.
- If failures are flaky, retry once and report flake evidence before fixing.
- Re-run `gh pr checks --json name,bucket,state,workflow,link` after every push — the check set can change.

## Output

- Current CI status
- Failure summary and fix applied per iteration
- PR URL once all hard-gate checks are green
