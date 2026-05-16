# What "Good Code" Looks Like in This Repo

A practical playbook for keeping Arena's code healthy as it grows. The patterns below are codebase-specific — Convex + Next.js 16 + React 19 — and exist to prevent the failure modes the audit surfaced (see `docs/AUDIT.md`).

This is not a style guide. It's a list of rules that, when followed, make whole classes of bugs impossible.

## 1. Every Convex mutation starts with an auth call

Pattern:

```ts
export const updateBio = mutation({
  args: { bio: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const me = await getAuthUser(ctx);       // <-- always first
    if (args.bio.length > 2000) throw new Error("Bio too long");
    await ctx.db.patch(me._id, { bio: args.bio });
    return null;
  },
});
```

Anti-pattern (the audit found multiple): take a `userId` as an arg and trust it. **The server already knows who the caller is — never let the client tell it.**

If a mutation operates on a non-self resource, follow up with `requireOwnerOrAdmin(ctx, resource.ownerId)`.

## 2. Validators are the contract — never `v.any()`, never `v.string()` for an enum

If the schema says

```ts
status: v.union(v.literal("active"), v.literal("closed"), v.literal("rejected"))
```

then the function arg validator says the **same thing**, not `v.string() as any`. The `as any` is a tell that the validator and the schema disagree — fix the validator, not the cast.

Always cap user-submitted strings:

```ts
body: v.string(),                          // ❌ unbounded
body: v.string(),                          // ✅ + `if (args.body.length > 4000) throw …` in handler
```

(Convex doesn't have inline string-length validators yet, so enforce in the handler. Centralize the caps in `convex/constants.ts`.)

## 3. Reads use indexes; never `collect()` a user-data table without a bound

If you find yourself writing `ctx.db.query("users").collect()`, you have a bug. Use:
- `withIndex("by_points", q => …).order("desc").take(10)` for leaderboards.
- `.paginate(args.paginationOpts)` for any list a user can scroll.
- A denormalized counter for "how many unread X does user Y have" — `.collect().length` is explicitly forbidden by the Convex agent guidelines.

When you need to count or sum, **maintain a counter in the writing mutation**, not a scan in the reading query.

## 4. Mutations are idempotent

Two ways a mutation gets run twice:
- A user double-clicks Submit.
- An external system retries (Stripe webhook, cron rerun, scheduler).

Both must be safe.

**Pattern for webhooks:**

```ts
const seen = await ctx.db.query("stripeEvents")
  .withIndex("by_eventId", q => q.eq("eventId", event.id))
  .unique();
if (seen) return; // idempotent: already processed
await ctx.db.insert("stripeEvents", { eventId: event.id, processedAt: Date.now() });
// … do the work
```

**Pattern for "award points to every voter once":** an `awards` table keyed `(roundId, voterId)` with a unique compound index. Insert before patch; catch the unique-violation and skip.

**Pattern for double-submit:** include a client-generated `clientRequestId` in the args; dedupe on it server-side.

## 5. Tokens are crypto-random, not `Math.random()`

Anywhere a string gates access to a resource (review tokens, magic links, password resets), use `crypto.randomUUID()` or `crypto.getRandomValues`. `Math.random()` is predictable enough that you should treat it as plaintext.

## 6. One source of truth for shared constants

Three places defining the prize split is a guarantee one of them is wrong. The rule:
- Constants used by both client and Convex live in `src/lib/<thing>.ts` and are imported by Convex.
- Enum literals (`UserRole`, `BqType`, `SubmissionStatus`, `BountyStatus`) are exported as both a `const` and a `type` from a single file, used in `v.union(v.literal(...))` in `convex/schema.ts` AND imported by client code.

Concretely, this kills the audit's C10 and C11 findings forever.

## 7. RSC by default; `"use client"` is opt-in

Default to server components. Add `"use client"` **only** when:
- The component uses a hook (`useState`, `useEffect`, `useQuery`, `useMutation`, `useContext`).
- The component attaches event handlers.
- The component reads `window` / `document` / `localStorage`.

A component that just lays out props with no interactivity should be a server component — it ships zero JS to the user.

If a leaf needs interactivity but its parent doesn't, mark the leaf as `"use client"`, not the parent.

## 8. Every Convex query a UI depends on has loading / null / error handling

```tsx
const stats = useQuery(api.users.getMyStats);

if (stats === undefined) return <Skeleton />;   // loading
if (stats === null) return <EmptyState />;      // signed-out / no profile
return <StatTile value={stats.points} />;       // ready
```

`stats === undefined` (loading) and `stats === null` (resolved-but-empty) are different states. Crashing on one of them is the most common useQuery bug.

Pair with `loading.tsx` and `error.tsx` siblings in each route group so the browser doesn't go blank on first paint.

## 9. Mutations that hit the network are `action`s

`mutation` runs inside Convex's transactional DB layer. Calling Stripe / Anthropic / Resend / Twilio from inside one is illegal and silently breaks at scale.

Pattern:

```ts
// convex/stripe.ts
export const createCheckoutSession = action({ … });   // network call here
// then
await ctx.runMutation(internal.bounties.createPending, { … });
```

If the action is only called from other Convex code (cron, webhook, another action), make it `internalAction`. Public `action`s are callable from the client — gate them with `getAuthUser`.

## 10. Public Convex queries return only what unauth callers should see

When in doubt, require auth. When auth is intentionally not required (public landing pages, share links), project the response shape explicitly:

```ts
return { _id, fullName, school, points };       // no email, no phone
```

Returning a full `Doc<"users">` is the easy thing; it's also the leak.

## 11. Cron jobs and crons table are internal-only and idempotent

`crons.cron("name", cronExpression, internal.module.fn, args)` — note `internal`. If the function it calls is `internalMutation`/`internalAction` and idempotent (see rule 4), the cron is safe to rerun.

Per Convex agent guidelines: do not use `crons.daily` / `crons.weekly` / `crons.monthly`. Use `crons.cron(...)` with an explicit cron expression so the schedule is unambiguous.

## 12. The build pipeline does not deploy backend from preview branches

`vercel.json`:

```jsonc
{
  "framework": "nextjs",
  "buildCommand": "[ \"$VERCEL_ENV\" = \"production\" ] && npx convex deploy --cmd 'next build' || next build"
}
```

Or use Convex's preview deploys (`--preview-create $VERCEL_GIT_COMMIT_REF`). Either way, the rule is: a preview-branch build never overwrites prod functions.

## 13. Env vars are validated at startup, not at first use

`src/env.ts`:

```ts
import { z } from "zod";

const schema = z.object({
  NEXT_PUBLIC_CONVEX_URL: z.string().url(),
  STRIPE_SECRET_KEY: z.string().startsWith("sk_"),
  STRIPE_WEBHOOK_SECRET: z.string().startsWith("whsec_"),
  RESEND_API_KEY: z.string().min(1),
  NEXT_PUBLIC_APP_URL: z.string().url(),
});

export const env = schema.parse(process.env);
```

Imported once from `next.config.ts` so a missing var fails the build, not a midnight prod request.

## 14. PRs are gated by lint + typecheck + build

`.github/workflows/ci.yml`:

```yaml
on: [pull_request]
jobs:
  ci:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: npm }
      - run: npm ci
      - run: npm run lint
      - run: npx tsc --noEmit
      - run: npx next build
```

Without this gate, every regression in the audit comes back.

## 15. Observability and rate limiting are not optional

- **Sentry** wired into Next.js and Convex (`@sentry/nextjs`, custom error reporter in actions).
- **`@convex-dev/rate-limiter`** on every public mutation that accepts user input (`submitApplication`, `sendMessage`, `castVotes`, `createSubmission`, `requestToBecomeNominator`).
- A structured logger (or at least a `convex/logger.ts` helper) instead of bare `console.log`.

---

## ESLint rules that catch most violations of the above

Add to `eslint.config.mjs`:

```js
rules: {
  "@typescript-eslint/no-explicit-any": "error",
  "@typescript-eslint/no-floating-promises": "error",
  "@typescript-eslint/no-non-null-assertion": "warn",
  "react-hooks/exhaustive-deps": "error",
  "no-console": ["warn", { allow: ["warn", "error"] }],
}
```

## tsconfig flags to enable

```jsonc
{
  "compilerOptions": {
    "strict": true,                       // already on
    "noUncheckedIndexedAccess": true,     // catches array[i] vs array[i]!
    "noImplicitOverride": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

`noUncheckedIndexedAccess` alone would have surfaced multiple `as any` casts the audit found.

## Pull-request checklist (copy into `.github/pull_request_template.md`)

- [ ] New Convex `mutation`/`action` calls `getAuthUser`/`requireAdmin` in its first line, OR has a comment explaining why it's public.
- [ ] All `args` use schema-matching validators (no `v.any()`, no `v.string()` for an enum).
- [ ] Any new `ctx.db.query(...).collect()` is bounded by an index + `.take(N)` or `.paginate(...)`.
- [ ] Any mutation that could be retried (webhook handler, cron call, button) is idempotent.
- [ ] Constants used by both client and Convex live in one file imported by both.
- [ ] New routes have `loading.tsx` / `error.tsx` siblings.
- [ ] Components without hooks/handlers are server components.
- [ ] No `<img>` for user-uploaded content (use `next/image` with configured `remotePatterns`).
- [ ] `npx tsc --noEmit` and `npm run lint` clean.
