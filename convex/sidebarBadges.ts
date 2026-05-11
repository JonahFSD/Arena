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

    const received = await ctx.db
      .query("messages")
      .withIndex("by_recipientUserId", (q) => q.eq("recipientUserId", user._id))
      .collect();
    const community = received.filter((m) => m.readAt === undefined).length;

    const listedBounties = await ctx.db
      .query("bounties")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .collect();
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

    const received = await ctx.db
      .query("messages")
      .withIndex("by_recipientUserId", (q) => q.eq("recipientUserId", userId))
      .collect();
    const communityChat = received.filter((m) => m.readAt === undefined).length;

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
