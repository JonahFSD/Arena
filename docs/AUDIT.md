# Arena Codebase Audit — 2026-05-16

Five parallel subagents scanned the codebase across five concern areas (auth/security, Convex backend patterns, frontend, type safety & tech debt, perf & tooling). Findings are deduped and prioritized below.

**Codebase shape:** Next.js 16 (App Router) + Convex + React 19 + TS5. ~23.6k LOC across 145 TS/TSX files in `src/`, ~5.6k LOC across 25 Convex modules. Stripe wired, AI scoring stubbed, email via Resend, Twilio configured. No tests, no CI workflows, no observability, no middleware.

The audit treats this as a pre-launch hardening pass. Critical = ship blocker. High = fix before broad user growth. Medium = next sprint. Low = backlog.

---

## Critical — fix before any real user touches this

### C1. `createBountyCheckoutSession` lets a caller spoof any other user as bounty creator
`convex/stripe.ts:21-72`. The public action accepts `creatorUserId: v.id("users")` and stuffs it into Stripe metadata; the webhook (`convex/stripe.ts:117`) trusts the value and inserts the bounty owned by that ID. Any authed user can create a paid bounty attributed to anyone else.
**Fix:** drop the arg. Inside the handler, `const me = await getAuthUser(ctx); const creatorUserId = me._id;`.

### C2. `updateProfile` accepts any field, including `role` and `points`
`convex/users.ts:235-277` does `Object.entries(args)` → `ctx.db.patch(user._id, updates)`. Convex strips unknown args at the validator boundary, but anything in the schema (e.g., `role`, `points`, `totalEarnings`, `referredBy`) that isn't explicitly blocked can be set by the user. Privilege-escalation vector to `superadmin`.
**Fix:** allow-list the writable fields explicitly. Build `updates` from a `const ALLOWED = ['fullName','bio','schoolName','graduationYear','skills','tools',...]` set.

### C3. Stripe webhook is not idempotent
`convex/http.ts:21` + `convex/stripe.ts:117-131`. Stripe retries on non-2xx; nothing dedupes on `event.id`, so a retried `checkout.session.completed` creates duplicate bounty rows (and double-charges your prize pool accounting).
**Fix:** add a `stripeEvents` table with a unique index on `eventId`. Short-circuit in the webhook action if `eventId` exists.

### C4. Webhook also blindly trusts `creatorUserId` metadata
`convex/stripe.ts:125`: `creatorUserId: meta.creatorUserId! as any`. After C1 is fixed this is partly mitigated, but you still re-coerce a 500-byte string into an `Id<"users">`. Validate the user exists before insert.
**Fix:** `const creator = await ctx.db.get(meta.creatorUserId as Id<"users">); if (!creator) throw …`.

### C5. `PaywallGate` stub always grants access
`src/components/auth/paywall-gate.tsx:13-16` hardcodes `hasAccess = true`. Every paywalled route (`bounties/[id]`, `pitches/new`, `community/members`, `community/messages`) imports the stub. A separate working component exists at `src/components/paywall-gate.tsx`.
**Fix:** delete the stub and rewire callers to the real component, or wire `api.memberships.getMyMembership` into the stub.

### C6. `next build` force-deploys to **production** Convex on every Vercel build
`package.json:8` is `"build": "npx convex deploy && next build"`. Every preview branch ships a prod Convex deploy. Preview branches can stomp prod schema and functions.
**Fix:** branch in `vercel.json` on `$VERCEL_ENV`:
```
"buildCommand": "[ \"$VERCEL_ENV\" = \"production\" ] && npx convex deploy --cmd 'next build' || next build"
```
Or adopt Convex's preview-deploy flow (`--preview-create`).

### C7. Voting finalization is non-idempotent and unbounded
`convex/votingActions.ts:115-285` reads all votes, all submissions, all winners, awards points to every voter inside one mutation. Re-running double-awards points (no "awarded" marker). It also bumps into Convex's 16k-doc / 8MB transaction limit at scale.
**Fix:** add a `voting_awards` log table with unique `(roundId, voterId)`; skip if present. Split the workload via `ctx.scheduler.runAfter(0, internal.votingActions.awardPointsBatch, {…})`.

### C8. Bounty review tokens use `Math.random()`
`convex/bounties.ts:396-403`. The token gates a public route (`/review/bounty/[token]`); `Math.random()` is non-cryptographic and predictable.
**Fix:** `crypto.randomUUID()` (already used in `convex/nominators.ts`).

### C9. Modal has no a11y primitives
`src/components/ui/modal.tsx:54-95`. No `role="dialog"`, no `aria-modal`, no focus trap, no `aria-label` on the close button. Keyboard and screen-reader users can't navigate it.
**Fix:** `role="dialog" aria-modal="true" aria-labelledby={titleId}`, restore focus on close, trap Tab inside.

### C10. Schema drift on `bqType`
`src/app/(platform)/community/members/page.tsx:12-21` (and seed data) uses `"Investor"` / `"Pioneer"`; `convex/schema.ts:30-39` only allows `Anchor | Visionary | Operator | Catalyst | Strategist | Builder`. Server-side `validate` will reject any write attempting these.
**Fix:** regenerate demo data with valid literals; export a shared `BQ_TYPES` const from `convex/schema.ts` and import everywhere.

### C11. Prize-split constants diverge across 3 files
- `convex/votingActions.ts:54-56` → 50/30/20
- `convex/seed.ts:820-822` → 55/30/15
- `src/lib/hall-of-fame-prize-pool.ts:17-20` → 50/30/10/10 with 10% op fee (but `votingActions.ts` uses 20%)

Three sources of truth means one of them is wrong every time you change a percentage.
**Fix:** single `PRIZE_SPLIT` const in `src/lib/prize-split.ts`, imported by both frontend and Convex.

---

## High — fix before user growth or marketing push

### Auth / data exposure
- **H1.** `convex/storage.ts:9-25` — `generateUploadUrl` and `getUrl` are unauthenticated; no MIME/size limits; storage IDs can be attached to any user's avatar or any submission. Require auth on both; track ownership of uploads.
- **H2.** Public queries leak PII to unauthed callers:
  - `convex/users.ts:22-91` (`getById`, `listMembers`) returns `email`, `phone`, `age`, `notificationPreferences`.
  - `convex/submissions.ts:43-130` (`getById`) returns submitter `email`.
  - `convex/collaborators.ts:180-208` (`getBySubmission`) returns collaborator `email`.
  - `convex/bounties.ts:10-77` returns `needs_review`/`rejected` bounties to unauth callers despite a doc-comment claiming otherwise.

  **Fix:** require `getAuthUser(ctx)` on these and project only public fields (no `email`/`phone`).
- **H3.** `convex/bounties.ts:84-107` — public `create` mutation inserts a bounty with no Stripe payment. Path bypass to free bounties. Restrict to `requireAdmin` or remove.
- **H4.** `convex/voting.ts:98-137` `castVotes` has no array-length cap and no dedup; concurrent calls insert duplicate vote rows. Cap `submissionIds.length`, add a unique compound index `by_roundId_voterId_submissionId`.
- **H5.** `convex/applications.ts:9-79` `submitApplication`, `convex/nominators.ts:13-180` — public, unrate-limited, fire emails on each call. Spam + email-enumeration vector.

### Backend correctness / scale
- **H6.** Full-table `collect()` in hot paths:
  - `convex/users.ts:45,65,101` (every dashboard call)
  - `convex/admin.ts:13-76` (6 tables collected per dashboard call)
  - `convex/messages.ts:23` (entire `messages` table)
  - `convex/sidebarBadges.ts:28,68` (every page render)
  - `convex/notifications.ts:29-37` (uses forbidden `.collect().length`)
  - `convex/submissions.ts:177` (lists then JS-filters)
  - `convex/bounties.ts:20`, `convex/voting.ts:72`, `convex/auth.ts:25`

  **Fix:** use the existing indexes (e.g., `by_points` for leaderboard) or add compound indexes (`by_recipientUserId_readAt`, `by_bountyId_userId`, `by_userId_status`). Use `.take(N)` or `.paginate()`. Maintain denormalized counters for unread counts and admin stats.
- **H7.** `convex/votingActions.ts:62-77` — three full-table `collect()`s + tight-loop email sends in a mutation. Tx-limit blowup. Fan out via `ctx.scheduler.runAfter`.
- **H8.** `convex/prizes.ts:81` — `users.collect()` inside a `Promise.all(pools.map())` = N full-table scans per page. Hoist `allUsers` outside the map.
- **H9.** `convex/crons.ts:7,14` uses `crons.monthly` — forbidden by Convex agent guidelines (only `.interval` / `.cron`). Switch to `crons.cron("open voting round", "0 0 1 * *", …)`.

### Frontend correctness
- **H10.** `src/app/(platform)/dashboard/page.tsx:174-200` — `stats === undefined` is guarded but `null` is not; `stats.points.toLocaleString()` will crash if the query returns `null`. Use `stats == null ? "—" : …`.
- **H11.** `src/app/(platform)/community/messages/page.tsx:178-194` — `handleSend` awaits the mutation with no try/catch; failures throw to render. Add try/catch + inline error state, disable Send while in flight.
- **H12.** Raw `<img>` for avatars / leadership photos (`src/components/ui/avatar.tsx:22`, `src/app/(platform)/admin/leadership/page.tsx:51`). Replace with `next/image` and configure `images.remotePatterns` in `next.config.ts` for `*.convex.cloud`.
- **H13.** `<a href="/login">` in `src/app/(marketing)/page.tsx:238` — full reload. Use `<Link>`.
- **H14.** No security headers anywhere. Add a `headers()` block to `next.config.ts` with CSP, HSTS, X-Frame-Options=DENY, Referrer-Policy=strict-origin-when-cross-origin, X-Content-Type-Options=nosniff, Permissions-Policy.

### Tooling
- **H15.** `package.json:19` `lucide-react: ^1.7.0` is almost certainly the wrong version line — `lucide-react` is published in the `0.46x` range. Pin to e.g. `^0.460.0`.
- **H16.** No `.env.example` and no startup env validation. Add `src/env.ts` with a zod schema; import from `next.config.ts` to fail fast.
- **H17.** No CI workflows. Add `.github/workflows/ci.yml` running `eslint`, `tsc --noEmit`, `next build` on PRs.
- **H18.** No rate limiting. Install `@convex-dev/rate-limiter` and gate `submitApplication`, `sendMessage`, `castVotes`, `createSubmission`, `requestToBecomeNominator` per-user/per-IP.

### Type safety
- **H19.** `as any` on every `ctx.db.get` in `convex/voting.ts:168-169`, `convex/messages.ts:49-50`. Drop the casts — IDs are already strongly typed.
- **H20.** `additionalLinks: v.any()` in `convex/schema.ts:162` and `convex/submissions.ts:246,288`. Replace with `v.optional(v.array(v.object({ label: v.string(), url: v.string() })))`.
- **H21.** `args.status: v.string() as any` in `convex/bounties.ts:17` and `convex/applications.ts:105`. Use the matching `v.union(v.literal(...), ...)`.

---

## Medium — next sprint

- **M1.** `src/types/index.ts` is 99% dead (only `SubmissionStatus` is still referenced). Inline that one type, delete the file.
- **M2.** `supabase/*.sql` (5 files) — zero code references. Delete the folder; AGENTS.md already marks Supabase as removed.
- **M3.** Dead Convex functions with no client callers: `convex/voting.ts` `getMyVotes`, `getResults`; all of `convex/notifications.ts`; `convex/verify.ts`; `convex/resetAuth.ts`; `convex/addUsers.ts`; `convex/admin.ts:181 getAuditLog`; `convex/bounties.ts:384 getReviewToken`. Wire them up or delete.
- **M4.** Components incorrectly marked `"use client"` that don't need it (`src/components/dashboard/{submission-hero,leaderboard-widget,ai-feedback-card,mission-drop-banner,voting-queue}.tsx`, several `src/components/ui/*` forwardRef wrappers). Drop the directive to ship them as RSC.
- **M5.** `src/contexts/community-members-filters-context.tsx:113-159` re-renders every consumer on every keystroke. Split into UI state vs filter state contexts.
- **M6.** No `loading.tsx` / `error.tsx` siblings for `(platform)/dashboard`, `(platform)/community/messages`, `(platform)/admin/bounties`, `(platform)/pitches/voting`. Blank screens until queries resolve. Add skeletons + error boundaries.
- **M7.** `window.alert(...)` used for validation in `src/app/(platform)/settings/page.tsx:140,157,161` and `pitches/voting/page.tsx:229`. Replace with inline error / toast.
- **M8.** `tsconfig.json` missing strict-mode upgrades: `noUncheckedIndexedAccess`, `noImplicitOverride`, `noFallthroughCasesInSwitch`. Enable at minimum the first.
- **M9.** `eslint.config.mjs` is bare Next default. Add `@typescript-eslint/no-explicit-any: error`, `@typescript-eslint/no-floating-promises`, and `react-hooks/exhaustive-deps: error`.
- **M10.** `convex/schema.ts` denormalized fields `points`, `pointsThisMonth`, `totalEarnings`, `networkCount` are `v.optional` but read as `?? 0` everywhere. Make required with default 0, or stop denormalizing. Notably `pointsThisMonth` is never updated when cron awards points → "this month" leaderboard silently desyncs.
- **M11.** Multiple unbounded `v.string()` user inputs: `messages.send` body, `bounties.submitSolution` `submissionUrl`, `leadership.submitAmbassadorApplication` `whyStatement`/`leadershipExperience`. Cap lengths in validators.
- **M12.** `convex/email.ts` — no `List-Unsubscribe` header, no idempotency key, hard-coded from-address. Deliverability + CAN-SPAM risk.
- **M13.** `convex/stripe.ts:172` — unbounded `while (hasMore)` loop over Stripe charges in `getProjectedPrizePool` — will time out at scale. Cache the monthly aggregate.
- **M14.** Inconsistent URL env: `convex/email.ts:67` uses `NEXT_PUBLIC_APP_URL`; `convex/stripe.ts:38` uses `NEXT_PUBLIC_SITE_URL`. Pick one.
- **M15.** No observability — no Sentry, no structured logger, plain `console.error` in webhook and email paths.

## Low — backlog

- **L1.** `package.json:18` `lightningcss` is pulled transitively by Tailwind 4; remove the direct dep.
- **L2.** `public/` ships Next starter SVGs (`next.svg`, `vercel.svg`, `globe.svg`, `window.svg`, `file.svg`). Delete.
- **L3.** `src/app/layout.tsx:32` `viewport.maximumScale = 1` blocks pinch-zoom — a11y regression. Remove or set to 5.
- **L4.** `src/app/(marketing)/orb.ts:13` does `import * as THREE from "three"` — pulls full three.js into the marketing bundle. Dynamic-import the orb component (`dynamic(() => import("./orb-client"), { ssr: false })`).
- **L5.** Inter font loaded in both `src/app/layout.tsx` and `src/app/(marketing)/page.tsx` — double payload.
- **L6.** `console.log/warn/error` in client code: `src/app/(marketing)/page.tsx:104`, `src/app/(platform)/community/leadership/page.tsx:496`, `src/app/(platform)/settings/page.tsx:200`, `src/app/(platform)/admin/applications/page.tsx:70`.
- **L7.** `convex/seed.ts:1281 clearAll` is shipped as an `internalMutation` in prod with no env guard. Gate behind `process.env.ALLOW_DESTRUCTIVE === "1"`.
- **L8.** Role literals `"member" | "admin" | "superadmin"` duplicated 50+ times. Export a `UserRole` type/const.
- **L9.** Hard-coded `STATES` array of 7 items in `src/lib/community-filter.constants.ts:31` vs full 50-state list in `src/lib/us-states.ts`. Derive from the latter.
- **L10.** `src/components/bounties/bounties-list.tsx:11-17` — module-level `Date.now()`, cached for bundle lifetime. Move into `useMemo`.

---

## What "good code" looks like for this codebase

See `docs/GOOD-CODE.md` for the playbook. The short version:

1. Every Convex `mutation` / non-public `query` calls `getAuthUser` or `requireAdmin` in its first line.
2. Every public function has both `args` and `returns` validators using the **exact** schema literals (never `v.string()` for an enum, never `v.any()`).
3. Reads use `withIndex`; never `collect()` a user-data table without a filter you can guarantee bounded.
4. Mutations are idempotent: external retries (Stripe webhooks, cron reruns, double-clicks) cannot produce duplicate rows or double-award points.
5. Secrets/IDs never come from the client when the server already knows them (caller's `userId` comes from auth, not from `args`).
6. Components default to RSC; `"use client"` is only added when needed.
7. There is a single source of truth for shared constants (roles, prize splits, BQ types) imported by both client and Convex.
