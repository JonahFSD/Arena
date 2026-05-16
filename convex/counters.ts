import { internalMutation } from "./_generated/server";

/**
 * Recompute every denormalized counter from the underlying source-of-truth
 * tables. Idempotent — safe to run any time the live counters might have
 * drifted (after a schema rollout, a bulk import, or a missed trigger).
 *
 * Run with: `npx convex run counters:recomputeAll`
 *
 * Tables it touches:
 *   - submissions.voteCount      ← count from `votes` (scoped by round)
 *   - bounties.submissionsCount  ← count from `bountySubmissions`
 *   - userCounters.unreadMessages       ← unread messages where recipient = user
 *   - userCounters.unreadNotifications  ← unread notifications for user
 *
 * Note: walks whole tables, so for very large datasets we'd batch via the
 * scheduler. Current scale (single-deployment demo) makes one transaction
 * fine.
 */
export const recomputeAll = internalMutation({
  args: {},
  handler: async (ctx) => {
    // submissions.voteCount — a submission's votes only live in its own
    // month's round, so scope the count via by_roundId_submissionId.
    const submissions = await ctx.db.query("submissions").collect();
    let submissionsTouched = 0;
    for (const sub of submissions) {
      const round = await ctx.db
        .query("votingRounds")
        .withIndex("by_monthYear", (q) => q.eq("monthYear", sub.monthYear))
        .first();
      let count = 0;
      if (round) {
        const votes = await ctx.db
          .query("votes")
          .withIndex("by_roundId_submissionId", (q) =>
            q.eq("votingRoundId", round._id).eq("submissionId", sub._id)
          )
          .collect();
        count = votes.length;
      }
      if (count !== (sub.voteCount ?? 0)) {
        await ctx.db.patch(sub._id, { voteCount: count });
        submissionsTouched++;
      }
    }

    // bounties.submissionsCount
    const bounties = await ctx.db.query("bounties").collect();
    let bountiesTouched = 0;
    for (const bounty of bounties) {
      const subs = await ctx.db
        .query("bountySubmissions")
        .withIndex("by_bountyId", (q) => q.eq("bountyId", bounty._id))
        .collect();
      if (subs.length !== (bounty.submissionsCount ?? 0)) {
        await ctx.db.patch(bounty._id, { submissionsCount: subs.length });
        bountiesTouched++;
      }
    }

    // userCounters — recreate one row per user with the live unread totals.
    const users = await ctx.db.query("users").collect();
    let usersTouched = 0;
    for (const user of users) {
      const unreadMessages = await ctx.db
        .query("messages")
        .withIndex("by_recipientUserId_readAt", (q) =>
          q.eq("recipientUserId", user._id).eq("readAt", undefined)
        )
        .collect();
      const unreadNotifications = await ctx.db
        .query("notifications")
        .withIndex("by_userId_read", (q) =>
          q.eq("userId", user._id).eq("read", false)
        )
        .collect();
      const next = {
        userId: user._id,
        unreadMessages: unreadMessages.length,
        unreadNotifications: unreadNotifications.length,
      };
      const existing = await ctx.db
        .query("userCounters")
        .withIndex("by_userId", (q) => q.eq("userId", user._id))
        .unique();
      if (existing) {
        if (
          existing.unreadMessages !== next.unreadMessages ||
          existing.unreadNotifications !== next.unreadNotifications
        ) {
          await ctx.db.patch(existing._id, {
            unreadMessages: next.unreadMessages,
            unreadNotifications: next.unreadNotifications,
          });
          usersTouched++;
        }
      } else {
        await ctx.db.insert("userCounters", next);
        usersTouched++;
      }
    }

    console.log(
      `   ✅ Recomputed counters: ${submissionsTouched} submissions, ` +
        `${bountiesTouched} bounties, ${usersTouched} user rows`
    );
    return {
      submissionsTouched,
      bountiesTouched,
      usersTouched,
    };
  },
});
