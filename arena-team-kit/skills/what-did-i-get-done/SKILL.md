---
name: what-did-i-get-done
description: Summarize authored commits over a user-specified time period into a concise, high-signal status update
---

# What Did I Get Done

## Trigger

Need a short, high-signal summary of work completed in a specific time range — for example: yesterday, last 3 days, last week, or since a named commit.

## Workflow

1. Resolve the requested time window into concrete dates.
2. Read commits authored by the current git user email within that range: `git log --author="$(git config user.email)" --since="..." --until="..." --no-merges --oneline`.
3. Exclude merge commits and uncommitted changes.
4. Synthesize the most important shipped changes into a concise status update.
5. Include the actual date range used in the final summary.

## Commands

```bash
# Current git user email
git config user.email

# Commits by this user in a date range
git log \
  --author="$(git config user.email)" \
  --since="7 days ago" \
  --no-merges \
  --oneline

# Branch-scoped summary (commits not yet on main)
git log origin/main..HEAD --author="$(git config user.email)" --no-merges --oneline
```

## Guardrails

- Be extremely concise and information-dense.
- Prioritize substantial behavior or architecture changes.
- Omit cosmetic-only changes (formatting, import re-ordering, minor renames).
- Do not infer intent or motivation — describe changes functionally.

## Output

- One short summary suitable for a standup, status update, or async message
- Real date range used
- Optional 2–5 bullets for major changes only
