import {
  QueryCtx,
  MutationCtx,
} from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import type { Doc, Id } from "./_generated/dataModel";

/**
 * Get the currently authenticated user document.
 * Throws if not authenticated or user doc not found.
 */
export async function getAuthUser(ctx: QueryCtx | MutationCtx) {
  const userId = await getAuthUserId(ctx);
  if (!userId) {
    throw new Error("Not authenticated");
  }
  const user = await ctx.db.get(userId);
  if (!user) {
    throw new Error("User not found");
  }
  return user;
}

/**
 * Get the authenticated user ID, or null if not logged in.
 */
export async function getAuthUserIdOrNull(ctx: QueryCtx | MutationCtx) {
  return await getAuthUserId(ctx);
}

/**
 * Require the current user to be an admin or superadmin.
 * Returns the user document.
 */
export async function requireAdmin(ctx: QueryCtx | MutationCtx) {
  const user = await getAuthUser(ctx);
  if (user.role !== "admin" && user.role !== "superadmin") {
    throw new Error("Admin access required");
  }
  return user;
}

/**
 * Require the current user to be the owner of a resource OR an admin.
 * Returns the user document.
 */
export async function requireOwnerOrAdmin(
  ctx: QueryCtx | MutationCtx,
  ownerId: Id<"users">
) {
  const user = await getAuthUser(ctx);
  if (user._id !== ownerId && user.role !== "admin" && user.role !== "superadmin") {
    throw new Error("Access denied");
  }
  return user;
}

/**
 * Strip PII and internal fields from a user doc before returning it
 * to any caller that isn't the user themselves. Use this on every
 * query that resolves a user from a foreign key — community profile,
 * submission author, collaborator list, etc. Per docs/GOOD-CODE.md
 * rule 10: returning a full Doc<"users"> is the easy thing AND the
 * leak.
 */
export type PublicUser = Omit<
  Doc<"users">,
  | "email"
  | "phone"
  | "age"
  | "authSubject"
  | "referralCode"
  | "referredBy"
  | "notificationPreferences"
  | "lastViewedBountiesAt"
>;

export function toPublicUser(user: Doc<"users">): PublicUser {
  const {
    email: _email,
    phone: _phone,
    age: _age,
    authSubject: _authSubject,
    referralCode: _referralCode,
    referredBy: _referredBy,
    notificationPreferences: _notificationPreferences,
    lastViewedBountiesAt: _lastViewedBountiesAt,
    ...publicFields
  } = user;
  return publicFields;
}

/**
 * Strip admin-only fields (review token, Stripe IDs, admin notes)
 * from a bounty doc before returning it to non-admin callers.
 * Admins consume `getReviewToken` (admin-gated) for the review URL.
 */
export type PublicBounty = Omit<
  Doc<"bounties">,
  | "reviewToken"
  | "stripePaymentIntentId"
  | "stripeCheckoutSessionId"
  | "adminNotes"
>;

export function toPublicBounty(bounty: Doc<"bounties">): PublicBounty {
  const {
    reviewToken: _reviewToken,
    stripePaymentIntentId: _stripePaymentIntentId,
    stripeCheckoutSessionId: _stripeCheckoutSessionId,
    adminNotes: _adminNotes,
    ...publicFields
  } = bounty;
  return publicFields;
}

/**
 * Fixed-window rate limit for public mutations. Throws a generic
 * "too many requests" error when the per-identifier count exceeds `max`
 * within `windowMs`.
 *
 * Convex mutations have no client IP, so public endpoints can only limit
 * by what the caller provides (typically the submitted email). That's
 * still useful: it caps same-identifier spam, and crucially makes the
 * cost of enumerating *one* email's status bounded.
 *
 * Concurrency: two simultaneous calls for the same key conflict on the
 * `rateLimits.by_key` range, so Convex OCC serializes them and the
 * counter stays correct.
 *
 * TODO: rows for expired windows accumulate forever — add a periodic
 * cleanup cron when the table gets large.
 */
export async function enforceRateLimit(
  ctx: MutationCtx,
  args: { action: string; identifier: string; max: number; windowMs: number }
) {
  const key = `${args.action}:${args.identifier}`;
  const now = Date.now();
  const existing = await ctx.db
    .query("rateLimits")
    .withIndex("by_key", (q) => q.eq("key", key))
    .unique();

  if (!existing) {
    await ctx.db.insert("rateLimits", {
      key,
      windowStart: now,
      count: 1,
    });
    return;
  }

  if (now - existing.windowStart >= args.windowMs) {
    await ctx.db.patch(existing._id, { windowStart: now, count: 1 });
    return;
  }

  if (existing.count >= args.max) {
    throw new Error(
      "Too many requests from this address. Please try again later."
    );
  }

  await ctx.db.patch(existing._id, { count: existing.count + 1 });
}

/* ---- denormalized user counters ---- */

type UserCounterField = "unreadMessages" | "unreadNotifications";

/**
 * Read denormalized counters for a user. Returns zeros when no row exists
 * yet (lazy init — the first writer creates the row).
 */
export async function readUserCounters(
  ctx: QueryCtx | MutationCtx,
  userId: Id<"users">
): Promise<{ unreadMessages: number; unreadNotifications: number }> {
  const row = await ctx.db
    .query("userCounters")
    .withIndex("by_userId", (q) => q.eq("userId", userId))
    .unique();
  return {
    unreadMessages: row?.unreadMessages ?? 0,
    unreadNotifications: row?.unreadNotifications ?? 0,
  };
}

/**
 * Adjust one of a user's denormalized counters by `delta`. Floors at 0 so
 * we self-heal at the boundary if a write goes missing somewhere; the
 * authoritative recompute is `counters.recomputeAll`.
 */
export async function adjustUserCounter(
  ctx: MutationCtx,
  userId: Id<"users">,
  field: UserCounterField,
  delta: number
): Promise<void> {
  if (delta === 0) return;
  const existing = await ctx.db
    .query("userCounters")
    .withIndex("by_userId", (q) => q.eq("userId", userId))
    .unique();
  if (!existing) {
    await ctx.db.insert("userCounters", {
      userId,
      unreadMessages: field === "unreadMessages" ? Math.max(0, delta) : 0,
      unreadNotifications:
        field === "unreadNotifications" ? Math.max(0, delta) : 0,
    });
    return;
  }
  const next = Math.max(0, existing[field] + delta);
  if (next !== existing[field]) {
    await ctx.db.patch(existing._id, { [field]: next });
  }
}

/* ---- platform-level denormalized stats (admin dashboard) ---- */

type PlatformStatField =
  | "totalMembers"
  | "totalSubmissions"
  | "pendingApplications"
  | "totalRevenue"
  | "totalVotes"
  | "aiScoreSum"
  | "aiScoreCount";

/**
 * Read the platformStats singleton. Returns zeros when the row hasn't
 * been initialized yet — `counters.recomputeAll` lazy-creates it.
 */
export async function readPlatformStats(ctx: QueryCtx | MutationCtx) {
  const row = await ctx.db
    .query("platformStats")
    .withIndex("by_key", (q) => q.eq("key", "global"))
    .unique();
  return {
    totalMembers: row?.totalMembers ?? 0,
    totalSubmissions: row?.totalSubmissions ?? 0,
    pendingApplications: row?.pendingApplications ?? 0,
    totalRevenue: row?.totalRevenue ?? 0,
    totalVotes: row?.totalVotes ?? 0,
    aiScoreSum: row?.aiScoreSum ?? 0,
    aiScoreCount: row?.aiScoreCount ?? 0,
  };
}

/**
 * Bump a platformStats field by `delta`. Lazy-creates the singleton row
 * if missing and floors at 0 (drift self-heals at the boundary; full
 * authoritative recompute is `counters.recomputeAll`).
 */
export async function bumpPlatformStat(
  ctx: MutationCtx,
  field: PlatformStatField,
  delta: number
): Promise<void> {
  if (delta === 0) return;
  const existing = await ctx.db
    .query("platformStats")
    .withIndex("by_key", (q) => q.eq("key", "global"))
    .unique();
  if (!existing) {
    const seed = {
      key: "global" as const,
      totalMembers: 0,
      totalSubmissions: 0,
      pendingApplications: 0,
      totalRevenue: 0,
      totalVotes: 0,
      aiScoreSum: 0,
      aiScoreCount: 0,
    };
    seed[field] = Math.max(0, delta);
    await ctx.db.insert("platformStats", seed);
    return;
  }
  const next = Math.max(0, existing[field] + delta);
  if (next !== existing[field]) {
    await ctx.db.patch(existing._id, { [field]: next });
  }
}

/**
 * Set a counter to an exact value. Used by "mark all read" flows where we
 * know the post-state without summing deltas.
 */
export async function setUserCounter(
  ctx: MutationCtx,
  userId: Id<"users">,
  field: UserCounterField,
  value: number
): Promise<void> {
  const clamped = Math.max(0, value);
  const existing = await ctx.db
    .query("userCounters")
    .withIndex("by_userId", (q) => q.eq("userId", userId))
    .unique();
  if (!existing) {
    await ctx.db.insert("userCounters", {
      userId,
      unreadMessages: field === "unreadMessages" ? clamped : 0,
      unreadNotifications: field === "unreadNotifications" ? clamped : 0,
    });
    return;
  }
  if (clamped !== existing[field]) {
    await ctx.db.patch(existing._id, { [field]: clamped });
  }
}
