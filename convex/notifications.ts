import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import {
  adjustUserCounter,
  getAuthUser,
  readUserCounters,
  setUserCounter,
} from "./helpers";
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
 * O(1) read from the denormalized counter; maintained by create/markRead/
 * markAllRead. Authoritative recompute lives in counters.recomputeAll.
 */
export const getUnreadCount = query({
  args: {},
  handler: async (ctx) => {
    const user = await getAuthUser(ctx);
    const counters = await readUserCounters(ctx, user._id);
    return counters.unreadNotifications;
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
    // Only decrement when the row was actually unread — re-marking a read
    // notification shouldn't drift the counter below the true value.
    if (!notification.read) {
      await ctx.db.patch(args.notificationId, { read: true });
      await adjustUserCounter(ctx, user._id, "unreadNotifications", -1);
    }
  },
});

/**
 * Mark all of the current user's notifications as read.
 *
 * We still need to walk the unread rows to flip `read: true` on each, but
 * the counter goes straight to 0 — no need to sum deltas.
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
    await setUserCounter(ctx, user._id, "unreadNotifications", 0);
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
    await adjustUserCounter(ctx, args.userId, "unreadNotifications", 1);
  },
});
