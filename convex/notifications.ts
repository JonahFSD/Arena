import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUser } from "./helpers";
import { Id } from "./_generated/dataModel";

/**
 * List the current user's notifications, newest first.
 */
export const list = query({
  args: {},
  handler: async (ctx) => {
    const user = await getAuthUser(ctx);
    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_userId_read", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(50);
    return notifications;
  },
});

/**
 * Get count of unread notifications for the current user.
 */
export const getUnreadCount = query({
  args: {},
  handler: async (ctx) => {
    const user = await getAuthUser(ctx);
    const unread = await ctx.db
      .query("notifications")
      .withIndex("by_userId_read", (q) =>
        q.eq("userId", user._id).eq("read", false)
      )
      .collect();
    return unread.length;
  },
});

/**
 * Mark a single notification as read.
 */
export const markRead = mutation({
  args: { notificationId: v.id("notifications") },
  handler: async (ctx, args) => {
    const user = await getAuthUser(ctx);
    const notification = await ctx.db.get(args.notificationId);
    if (!notification || notification.userId !== user._id) {
      throw new Error("Notification not found");
    }
    await ctx.db.patch(args.notificationId, { read: true });
  },
});

/**
 * Mark all of the current user's notifications as read.
 */
export const markAllRead = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await getAuthUser(ctx);
    const unread = await ctx.db
      .query("notifications")
      .withIndex("by_userId_read", (q) =>
        q.eq("userId", user._id).eq("read", false)
      )
      .collect();
    for (const n of unread) {
      await ctx.db.patch(n._id, { read: true });
    }
  },
});

/**
 * Internal: create a notification for a user.
 * Called by other mutations (submissions, voting, messages, etc.)
 */
export const create = internalMutation({
  args: {
    userId: v.id("users"),
    type: v.string(),
    title: v.string(),
    body: v.string(),
    actionUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("notifications", {
      userId: args.userId,
      type: args.type,
      title: args.title,
      body: args.body,
      read: false,
      actionUrl: args.actionUrl,
    });
  },
});
