import {
  QueryCtx,
  MutationCtx,
} from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { Id } from "./_generated/dataModel";

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
