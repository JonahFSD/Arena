# arena-team-kit

Arena's first-party Claude Code plugin. Bundles the team's agent workflows — code quality, CI,
memory, orchestration — as installable skills, agents, hooks, and bins. Currently ships the one
migrated skill below; more components land in later phases.

## Skills

### `thermo-nuclear-code-quality-review`

A strict maintainability review focused on abstraction quality, file-size hygiene, and
spaghetti-condition growth. Run it as a slash command:

```
/arena-team-kit:thermo-nuclear-code-quality-review
```

> **Note**: Claude Code has a known cosmetic quirk (anthropics/claude-code#50486) where plugin
> skills may appear in autocomplete without the `arena-team-kit:` namespace prefix — as just
> `/thermo-nuclear-code-quality-review`. Both forms invoke the same skill; this is not a
> problem with the setup.

## Local development

Load the plugin without installing it:

```bash
claude --plugin-dir ./arena-team-kit
```

This makes the plugin available for the session without touching your installed plugins.

## Team install

The plugin is published through the in-repo `arena` marketplace defined at
`.claude-plugin/marketplace.json` (repo root). The marketplace is registered for the team in
`.claude/settings.json`, so teammates are prompted to install it when they trust the project
folder.

If the automatic prompt fires, accept it and then run:

```
/plugin install arena-team-kit@arena
```

### Fallback: manual registration

There is a known Claude Code bug (anthropics/claude-code#32606) where the folder-trust install
prompt does not reliably fire. If it doesn't appear, register the marketplace manually once,
then install:

```
/plugin marketplace add .
/plugin install arena-team-kit@arena
```

After installing, reload without restarting:

```
/reload-plugins
```

## Related tooling

The six Convex skills under `.agents/skills/` are upstream, hash-locked via `skills-lock.json`,
and are deliberately separate from this plugin. Do not move them into `arena-team-kit/`.
