---
name: convex-review
description: Review Convex backend code against Arena's judgment rules from GOOD-CODE.md — auth-first mutations, bounded reads, idempotency, and more
---

# Convex Code Review

A judgment checklist for Arena's Convex backend. These are the rules from `docs/GOOD-CODE.md` that ESLint cannot mechanically enforce. Run this on any PR that touches `convex/`.

## Checklist

### Rule 1 — Every mutation starts with an auth call

**Pattern:**
```ts
export const updateBio = mutation({
  args: { bio: v.string() },
  handler: async (ctx, args) => {
    const me = await getAuthUser(ctx);       // <-- always first
    // ... rest of handler
  },
});
```

**Flag:** Any mutation whose handler does NOT call `getAuthUser(ctx)` or `requireAdmin(ctx)` in its first meaningful line, without a comment explaining why it is intentionally public.

**Flag:** Any mutation that accepts a `userId` as an arg and uses it as the identity — the server already knows the caller. Never trust client-supplied identity.

**Flag:** Any mutation that operates on a non-self resource without calling `requireOwnerOrAdmin(ctx, resource.ownerId)`.

---

### Rule 2 — Validators are the contract

**Flag:** `v.any()` anywhere in function args — this bypasses the type system.

**Flag:** `v.string()` used where the schema has `v.union(v.literal(...), ...)` — fix the validator to match the schema, don't widen it.

**Flag:** User-submitted string fields with no length cap. Pattern: check for `if (args.field.length > MAX) throw …` in the handler, or a reference to `convex/constants.ts`. Unbounded strings are a DoS vector.

---

### Rule 3 — Reads use indexes; never an unbounded `.collect()`

**Flag:** `ctx.db.query("table").collect()` with no `.withIndex(...)` and no `.take(N)` — this is an O(n) full-table scan.

**Flag:** Any leaderboard, feed, or list query that does not use `.paginate(args.paginationOpts)` or `.take(N)`.

**Flag:** Count or sum computed by `.collect().length` — maintain a denormalized counter in the writing mutation instead (per Convex agent guidelines).

---

### Rule 4 — Mutations are idempotent

**Flag:** Webhook handlers (Stripe, etc.) that do not check for a previously processed event ID before doing work:
```ts
// Required idempotency check for webhook handlers
const seen = await ctx.db.query("stripeEvents")
  .withIndex("by_eventId", q => q.eq("eventId", event.id))
  .unique();
if (seen) return;
```

**Flag:** Cron-invoked mutations that would produce duplicate data on a rerun.

**Flag:** Submission or vote mutations reachable by a double-click that do not use a `clientRequestId` dedup pattern or a unique-index guard.

---

### Rule 5 — Tokens are crypto-random

**Flag:** `Math.random()` used to generate any string that gates access to a resource (token, magic link, reset code). Use `crypto.randomUUID()` or `crypto.getRandomValues()` instead.

---

### Rule 8 — UI queries handle loading / null / error

**Flag:** `useQuery()` result used without checking for `undefined` (loading) or `null` (no data). The two states are different — crashing on one is the most common `useQuery` bug:
```tsx
if (stats === undefined) return <Skeleton />;   // loading
if (stats === null) return <EmptyState />;      // signed-out / no profile
return <StatTile value={stats.points} />;       // ready
```

**Flag:** A route group missing `loading.tsx` or `error.tsx` siblings when it depends on real-time data.

---

### Rule 9 — Network calls live in `action`s, not `mutation`s

**Flag:** Any call to `fetch(...)`, `stripe.something(...)`, `openai.something(...)`, Resend, Twilio, or any external HTTP client inside a `mutation` handler. Mutations run inside Convex's DB transaction — network calls there break at scale.

**Pattern:**
```ts
// convex/stripe.ts
export const createCheckoutSession = action({ … });   // network call here
// then call internal mutation for DB writes
await ctx.runMutation(internal.bounties.createPending, { … });
```

---

### Rule 10 — Public queries project their response shape

**Flag:** A `query` (or `internalQuery`) whose handler returns a full `Doc<"users">` or equivalent — this leaks email, phone, and other private fields.

**Pattern:**
```ts
return { _id, fullName, school, points };   // explicit projection
```

**Flag:** A query callable by unauthenticated clients that returns fields beyond what a public page needs.

---

### Rule 11 — Crons are `internal` and idempotent

**Flag:** A cron job pointing to a `mutation`/`action` that is NOT prefixed with `internal.`. Public functions should not be cron targets — they have no auth protection when called that way.

**Flag:** `crons.daily(...)`, `crons.weekly(...)`, `crons.monthly(...)` — use `crons.cron(...)` with an explicit cron expression per the Convex agent guidelines.

**Flag:** Cron-invoked functions that are not idempotent (see Rule 4).

---

## Approval Bar

Do not approve a Convex PR if any of the above flags apply and there is no clear justification. A missed auth call or unbounded collect is a production incident waiting to happen. These are not style nits — they are correctness requirements.
