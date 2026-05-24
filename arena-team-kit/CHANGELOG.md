# Changelog

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
