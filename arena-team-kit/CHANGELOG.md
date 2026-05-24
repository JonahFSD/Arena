# Changelog

## [0.3.0] — 2026-05-23

### Added
- `loop-on-ci` skill — iterate a branch to green CI: read failures via `gh pr checks`,
  apply one actionable fix per iteration, push, wait, repeat.
- `fix-ci` skill — diagnose and fix a specific failing CI check using `gh pr checks`
  as the single source of truth.
- `verify-this` skill — prove or disprove a change with falsifiable evidence; scoped
  to what Arena can produce today (`npm run typecheck`, `npm run build:ci`, manual
  browser checks). `unit-test-verified` and `live-ui-verified` verdict tiers are
  present but marked unavailable until Phase 7 adds the test harness.
- `review-and-ship` skill — final pre-merge review and ship workflow; runs available
  checks, references `convex-review` for Convex PRs, opens or updates a PR.
- `fix-merge-conflicts` skill — resolve merge/rebase conflicts safely; never
  bypasses hooks.
- `what-did-i-get-done` skill — summarise authored commits over a user-specified
  time range into a concise status update.
- `ci-watcher` agent — the plugin's first subagent; polls `gh pr checks` for the
  current PR, reports which checks fail and why, and hands back one actionable
  next step. Runs as a background agent.

### Changed
- `agents/.gitkeep` removed now that the `agents/` directory has a real occupant.
- `.github/pull_request_template.md` — replaced the vague `## Test plan` section
  with a falsifiable `## Verification` block (claim → evidence → verdict),
  mirroring the `verify-this` skill.

All notable changes to `arena-team-kit` are documented here. The format follows
Keep a Changelog, and this plugin uses semantic versioning.

## [0.2.0] — 2026-05-23

### Added
- `deslop` skill — port of cursor-team-kit's deslop skill for removing AI code
  slop; strips unnecessary comments, defensive checks, and `any` casts introduced
  on a branch.
- `make-pr-easy-to-review` skill — port of cursor-team-kit's skill for preparing
  PRs with a clean commit history, good descriptions, and clear reviewer guidance.
- `check-compiler-errors` skill — port of cursor-team-kit's skill for running
  `npm run typecheck` / `npm run build:ci`, summarising errors, and fixing them.
- `convex-review` skill — Arena-specific judgment checklist for Convex PRs:
  auth-first mutations, bounded reads, idempotency, crypto-random tokens, network
  calls in actions, public query projections, and cron hygiene — encoding the
  rules from `docs/GOOD-CODE.md` that ESLint cannot mechanically check.

### Changed
- GOOD-CODE.md §ESLint and §tsconfig sections updated from aspirational to
  enforced: rules are now wired into `eslint.config.mjs`; `noImplicitOverride`
  and `noFallthroughCasesInSwitch` are enabled in `tsconfig.json`.
- `eslint-seatbelt` ratchet adopted: `eslint.seatbelt.tsv` baseline snapshotted
  at 27 errors post-deslop; per-file counts can only trend down from here.
- `eslint-plugin-import-x` installed for `import-x/first` rule (ESLint 10
  compatible fork of `eslint-plugin-import`).

## [0.1.0] — 2026-05-23

### Added
- Initial plugin scaffold: `.claude-plugin/plugin.json` manifest plus `skills/`,
  `agents/`, `hooks/`, and `bin/` component directories.
- Root `.claude-plugin/marketplace.json` defining the `arena` marketplace.
- `.claude/settings.json` registering the `arena` marketplace for the team.

### Changed
- Migrated the `thermo-nuclear-code-quality-review` skill from `.claude/skills/`
  into the plugin; the standalone copy was removed.
