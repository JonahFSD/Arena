# Changelog

All notable changes to `arena-team-kit` are documented here. The format follows
Keep a Changelog, and this plugin uses semantic versioning.

## [0.1.0] — 2026-05-23

### Added
- Initial plugin scaffold: `.claude-plugin/plugin.json` manifest plus `skills/`,
  `agents/`, `hooks/`, and `bin/` component directories.
- Root `.claude-plugin/marketplace.json` defining the `arena` marketplace.
- `.claude/settings.json` registering the `arena` marketplace for the team.

### Changed
- Migrated the `thermo-nuclear-code-quality-review` skill from `.claude/skills/`
  into the plugin; the standalone copy was removed.
