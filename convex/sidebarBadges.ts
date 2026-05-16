import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { getAuthUser } from "./helpers";

export type SidebarBadgeCounts = {
  /** Unread direct messages (recipient = current user, not read). */
  community: number;
  /** Active bounties created after `lastViewedBountiesAt` (0 if never opened Bounties). */
  bounties: number;
  /** 1 if subscription is past_due (payment failed), else 0. */
  settingsBilling: number;
};

/**
 * Counts for gold sidebar badges: Community (unread messages), Bounties (new since last visit), Settings (billing issue).
 */
export const getCounts = query({
  args: {},
  handler: async (ctx): Promise<SidebarBadgeCounts | null> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const user = await ctx.db.get(userId);
    if (!user) return null;

    // Scope to {recipient, unread} via compound index instead of pulling
    // the user's entire inbox and filtering in JS on every page render.
    // Capped at 100 because the badge UI tops out at "99+" — Phase B will
    // swap this for an O(1) denormalized counter.
    const unread = await ctx.db
      .query("messages")
      .withIndex("by_recipientUserId_readAt", (q) =>
        q.eq("recipientUserId", user._id).eq("readAt", undefined)
      )
      .take(100);
    const community = unread.length;

    // Bounded "new bounties since last visit". The active list is small
    // (admin-curated), but the take cap defends against an "active flood".
    const listedBounties = await ctx.db
      .query("bounties")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .take(200);
    const lastViewed = user.lastViewedBountiesAt;
    const bounties =
      lastViewed === undefined
        ? 0
        : listedBounties.filter((b) => b._creationTime > lastViewed).length;

    const membership = await ctx.db
      .query("memberships")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .first();
    const settingsBilling =
      membership?.status === "past_due" ? 1 : 0;

    return { community, bounties, settingsBilling };
  },
});

export type SubTabBadgeCounts = {
  /** Unread direct messages for the Chat subtab. */
  communityChat: number;
};

/**
 * Badge counts for individual subtabs (e.g. Community > Chat).
 */
export const getSubTabBadges = query({
  args: {},
  handler: async (ctx): Promise<SubTabBadgeCounts | null> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    // See getCounts above — same compound-index pattern, same 100 cap.
    const unread = await ctx.db
      .query("messages")
      .withIndex("by_recipientUserId_readAt", (q) =>
        q.eq("recipientUserId", userId).eq("readAt", undefined)
      )
      .take(100);
    const communityChat = unread.length;

    return { communityChat };
  },
});

/**
 * Call when the user visits the Bounties list so the "new bounties" badge resets.
 */
export const markBountiesViewed = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await getAuthUser(ctx);
    await ctx.db.patch(user._id, { lastViewedBountiesAt: Date.now() });
  },
});
