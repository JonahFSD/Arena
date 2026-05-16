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
