import { query, mutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { adjustUserCounter, getAuthUser } from "./helpers";

/**
 * Compute a deterministic thread ID from two user IDs.
 */
function computeThreadId(userId1: string, userId2: string): string {
  return [userId1, userId2].sort().join("_");
}

/**
 * List all message threads for the current user.
 * Returns each thread with the other user's info, last message, and unread count.
 */
export const listThreads = query({
  args: {},
  handler: async (ctx) => {
    const user = await getAuthUser(ctx);

    // Walk inbox + outbox via dedicated indexes instead of scanning the
    // entire messages table. A union covers both sides since either
    // direction makes the user a thread participant.
    const [received, sent] = await Promise.all([
      ctx.db
        .query("messages")
        .withIndex("by_recipientUserId", (q) =>
          q.eq("recipientUserId", user._id)
        )
        .collect(),
      ctx.db
        .query("messages")
        .withIndex("by_senderUserId", (q) =>
          q.eq("senderUserId", user._id)
        )
        .collect(),
    ]);
    const myMessages = [...received, ...sent];

    // Group by thread
    const threadMap = new Map<
      string,
      { messages: typeof myMessages; otherUserId: string }
    >();
    for (const msg of myMessages) {
      if (!threadMap.has(msg.threadId)) {
        const otherUserId =
          msg.senderUserId === user._id
            ? (msg.recipientUserId as string)
            : (msg.senderUserId as string);
        threadMap.set(msg.threadId, { messages: [], otherUserId });
      }
      threadMap.get(msg.threadId)!.messages.push(msg);
    }

    // Build thread list
    const threads = await Promise.all(
      Array.from(threadMap.entries()).map(
        async ([threadId, { messages, otherUserId }]) => {
          const otherUserDoc = await ctx.db.get(otherUserId as any);
          const otherUser = otherUserDoc as any;
          const sorted = messages.sort(
            (a, b) => b._creationTime - a._creationTime
          );
          const lastMessage = sorted[0];
          const unreadCount = messages.filter(
            (m) => m.recipientUserId === user._id && !m.readAt
          ).length;

          const fromMe = messages.filter((m) => m.senderUserId === user._id);
          const toMe = messages.filter((m) => m.recipientUserId === user._id);
          const lastSentAt =
            fromMe.length > 0
              ? Math.max(...fromMe.map((m) => m._creationTime))
              : 0;
          const lastReceivedAt =
            toMe.length > 0
              ? Math.max(...toMe.map((m) => m._creationTime))
              : 0;

          const otherAvatarUrl = otherUser?.avatarStorageId
            ? await ctx.storage.getUrl(otherUser.avatarStorageId)
            : null;

          return {
            threadId,
            otherUser: otherUser
              ? {
                  _id: otherUser._id,
                  fullName: otherUser.fullName,
                  schoolName: otherUser.schoolName,
                  avatarStorageId: otherUser.avatarStorageId,
                  avatarUrl: otherAvatarUrl,
                  lookingForCofounders: otherUser.lookingForCofounders ?? false,
                  networkCount: otherUser.networkCount ?? 0,
                }
              : null,
            lastMessage: {
              body: lastMessage.body,
              senderUserId: lastMessage.senderUserId,
              _creationTime: lastMessage._creationTime,
            },
            lastSentAt,
            lastReceivedAt,
            unreadCount,
          };
        }
      )
    );

    // Sort by most recent message
    return threads.sort(
      (a, b) => b.lastMessage._creationTime - a.lastMessage._creationTime
    );
  },
});

/**
 * Get all messages in a thread (real-time reactive).
 */
export const getThread = query({
  args: { threadId: v.string() },
  handler: async (ctx, args) => {
    const user = await getAuthUser(ctx);

    const messages = await ctx.db
      .query("messages")
      .withIndex("by_threadId", (q) => q.eq("threadId", args.threadId))
      .collect();

    // Verify current user is a participant
    const isParticipant = messages.some(
      (m) =>
        m.senderUserId === user._id || m.recipientUserId === user._id
    );
    if (messages.length > 0 && !isParticipant) {
      throw new Error("Access denied");
    }

    // Attach sender info
    const withSenders = await Promise.all(
      messages.map(async (msg) => {
        const sender = await ctx.db.get(msg.senderUserId);
        return {
          ...msg,
          isMe: msg.senderUserId === user._id,
          senderName: sender?.fullName ?? "Unknown",
        };
      })
    );

    return withSenders.sort((a, b) => a._creationTime - b._creationTime);
  },
});

/**
 * Send a message to another user.
 */
export const send = mutation({
  args: {
    recipientUserId: v.id("users"),
    body: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getAuthUser(ctx);
    if (args.recipientUserId === user._id) {
      throw new Error("Cannot send messages to yourself");
    }

    const threadId = computeThreadId(
      user._id as string,
      args.recipientUserId as string
    );

    await ctx.db.insert("messages", {
      threadId,
      senderUserId: user._id,
      recipientUserId: args.recipientUserId,
      body: args.body,
    });
    await adjustUserCounter(ctx, args.recipientUserId, "unreadMessages", 1);

    // Notify the recipient (in-app)
    const preview =
      args.body.length > 80 ? args.body.slice(0, 80) + "..." : args.body;
    await ctx.scheduler.runAfter(0, internal.notifications.create, {
      userId: args.recipientUserId,
      type: "new_message",
      title: `New message from ${user.fullName}`,
      body: preview,
      actionUrl: `/community/messages/${threadId}`,
    });

    // Send email notification (if recipient has it enabled)
    const recipient = await ctx.db.get(args.recipientUserId);
    if (recipient) {
      const prefs = recipient.notificationPreferences;
      if (!prefs || prefs.newMessagesEmail !== false) {
        await ctx.scheduler.runAfter(0, internal.email.sendNotification, {
          to: recipient.email,
          recipientName: recipient.fullName.split(" ")[0],
          subject: `New message from ${user.fullName}`,
          heading: `Message from ${user.fullName}`,
          body: preview,
          ctaLabel: "Reply",
          ctaUrl: `/community/messages/${threadId}`,
        });
      }
    }
  },
});

/**
 * Mark all messages in a thread as read (for the current user).
 */
export const markThreadRead = mutation({
  args: { threadId: v.string() },
  handler: async (ctx, args) => {
    const user = await getAuthUser(ctx);
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_threadId", (q) => q.eq("threadId", args.threadId))
      .collect();

    const unread = messages.filter(
      (m) => m.recipientUserId === user._id && !m.readAt
    );
    for (const msg of unread) {
      await ctx.db.patch(msg._id, { readAt: Date.now() });
    }
    if (unread.length > 0) {
      await adjustUserCounter(ctx, user._id, "unreadMessages", -unread.length);
    }
  },
});
