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

## Verification

<!-- Restate this PR's central claim as something that could be proven
     false, then show baseline-vs-treatment evidence and land one verdict.
     This mirrors the `verify-this` skill in arena-team-kit. -->

**Claim:** <the change, stated so it could be falsified>

**Evidence:**
- Baseline (before): <observed behaviour, failing check, or metric>
- Treatment (after): <observed behaviour, passing check, or metric>
- How checked: <`npm run typecheck`, `npm run build:ci`, browser steps, `gh pr checks`>

**Verdict:** `VERIFIED` / `NOT VERIFIED` / `INCONCLUSIVE`
