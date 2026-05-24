---
name: fix-merge-conflicts
description: Resolve merge conflicts non-interactively, validate build and typecheck, and finalize conflict resolution
---

# Fix Merge Conflicts

## Trigger

Branch has unresolved merge conflicts and needs a reliable path to a buildable state.

## Workflow

1. Detect all conflicting files from `git status` and conflict markers (`<<<<<<<`).
2. Resolve each conflict with minimal, correctness-first edits.
3. Prefer preserving both sides when safe. Otherwise, choose the variant that compiles and keeps public behavior stable.
4. Regenerate lockfiles with package manager tools (`npm install`) instead of hand-editing.
5. Run `npm run typecheck` and `npm run build:ci` to confirm a clean build.
6. Stage resolved files and summarize key resolution decisions.

## Commands

```bash
# Find conflicting files
git status
git diff --name-only --diff-filter=U

# After resolving each file
git add <resolved-file>

# Verify the build compiles cleanly
npm run typecheck
npm run build:ci

# Finalize (do NOT use --no-verify)
git commit
```

## Guardrails

- Keep changes minimal and readable — do not refactor while resolving.
- Do not leave conflict markers (`<<<<<<<`, `=======`, `>>>>>>>`) in any file.
- **NEVER use `--no-verify`** — if pre-commit hooks fail, fix the underlying issue before committing.
- Do not push or tag during conflict resolution.
- Do not rebase with `--strategy-option=theirs` or `--strategy-option=ours` without understanding what is discarded.

## Output

- Files resolved
- Notable resolution choices (which side was preferred and why)
- Build / typecheck outcome
