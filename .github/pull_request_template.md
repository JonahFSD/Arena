<!--
Pull-request checklist — derived from docs/GOOD-CODE.md. Tick each
box or note why it's N/A. The CI gate runs lint + typecheck + build
(see .github/workflows/ci.yml); these checks are things tsc can't
catch.
-->

## Summary

<!-- 1–3 bullets on what this PR does and why. -->

## Checklist

- [ ] New Convex `mutation`/`action` calls `getAuthUser`/`requireAdmin`
      in its first line, OR has a comment explaining why it's public.
- [ ] All `args` use schema-matching validators (no `v.any()`, no
      `v.string()` for an enum).
- [ ] Any new `ctx.db.query(...).collect()` is bounded by an index +
      `.take(N)` or `.paginate(...)`.
- [ ] Any mutation that could be retried (webhook handler, cron call,
      button) is idempotent.
- [ ] Public queries return only what unauth callers should see —
      project the response shape explicitly, no full `Doc<"users">`.
- [ ] Any `v.id("_storage")` mutation arg is gated by
      `requireOwnedUpload` (per AGENTS.md File Storage section).
- [ ] Constants used by both client and Convex live in one file
      imported by both.
- [ ] New routes have `loading.tsx` / `error.tsx` siblings.
- [ ] Components without hooks/handlers are server components.
- [ ] `npm run lint` and `npm run typecheck` clean locally.

## Test plan

<!-- How was this verified? Browser smoke test? `npm run build:ci`? -->
