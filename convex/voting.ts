import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUser } from "./helpers";

/**
 * Get the currently open voting round with eligible submissions.
 */
export const getCurrentRound = query({
  args: {},
  handler: async (ctx) => {
    // Find the open voting round
    const round = await ctx.db
      .query("votingRounds")
      .withIndex("by_status", (q) => q.eq("status", "open"))
      .first();

    if (!round) return null;

    // Get eligible submissions for this month
    // (scored submissions that meet threshold)
    const submissions = await ctx.db
      .query("submissions")
      .withIndex("by_monthYear_status", (q) =>
        q.eq("monthYear", round.monthYear).eq("status", "scored")
      )
      .collect();

    // Attach AI scores and user info, filter by threshold
    const eligible = await Promise.all(
      submissions.map(async (sub) => {
        const score = await ctx.db
          .query("aiScores")
          .withIndex("by_submissionId", (q) => q.eq("submissionId", sub._id))
          .first();
        const user = await ctx.db.get(sub.userId);

        // Count votes for this submission in this round
        const votes = await ctx.db
          .query("votes")
          .withIndex("by_roundId_submissionId", (q) =>
            q.eq("votingRoundId", round._id).eq("submissionId", sub._id)
          )
          .collect();

        return {
          ...sub,
          aiScore: score ?? undefined,
          user: user
            ? { _id: user._id, fullName: user.fullName, schoolName: user.schoolName }
            : null,
          voteCount: votes.length,
        };
      })
    );

    // Filter by minimum score threshold
    const filtered = eligible.filter(
      (s) => s.aiScore && s.aiScore.overallScore >= round.minScoreThreshold
    );

    // Get the prize pool for this month
    const prizePool = await ctx.db
      .query("prizePools")
      .withIndex("by_monthYear", (q) => q.eq("monthYear", round.monthYear))
      .first();

    return {
      ...round,
      submissions: filtered.sort(
        (a, b) =>
          (b.aiScore?.overallScore ?? 0) - (a.aiScore?.overallScore ?? 0)
      ),
      prizePool: prizePool ?? undefined,
    };
  },
});

/**
 * Get the current user's votes for a specific round.
 */
export const getMyVotes = query({
  args: { roundId: v.id("votingRounds") },
  handler: async (ctx, args) => {
    const user = await getAuthUser(ctx);
    const votes = await ctx.db
      .query("votes")
      .withIndex("by_roundId_voterId", (q) =>
        q.eq("votingRoundId", args.roundId).eq("voterUserId", user._id)
      )
      .collect();
    return votes.map((v) => v.submissionId);
  },
});

/**
 * Hard upper bound on submissions a single voter can rank in one round.
 * The realistic per-round eligible count is well under this — the cap exists
 * to prevent a malicious caller from writing thousands of vote rows in a
 * single mutation. Raise if the eligible pool ever grows past it.
 */
const MAX_VOTES_PER_ROUND = 100;

/**
 * Cast votes — deletes existing votes for this round and inserts new ones.
 *
 * Invariant: at most one (roundId, voterUserId, submissionId) row exists
 * (enforced by dedup'ing the input + delete-then-insert in a single
 * transaction; documented via the `by_roundId_voterId_submissionId` index).
 */
export const castVotes = mutation({
  args: {
    roundId: v.id("votingRounds"),
    submissionIds: v.array(v.id("submissions")),
  },
  handler: async (ctx, args) => {
    const user = await getAuthUser(ctx);

    if (args.submissionIds.length > MAX_VOTES_PER_ROUND) {
      throw new Error(
        `Cannot rank more than ${MAX_VOTES_PER_ROUND} submissions in a single round`
      );
    }

    // Verify round is open
    const round = await ctx.db.get(args.roundId);
    if (!round || round.status !== "open") {
      throw new Error("Voting round is not open");
    }

    // Dedup — a caller passing [s1, s1, s2] must not produce two rows for s1,
    // which would double-count in finalization tallies.
    const uniqueSubmissionIds = Array.from(new Set(args.submissionIds));

    // Delete existing votes for this user + round
    const existing = await ctx.db
      .query("votes")
      .withIndex("by_roundId_voterId", (q) =>
        q.eq("votingRoundId", args.roundId).eq("voterUserId", user._id)
      )
      .collect();
    for (const vote of existing) {
      await ctx.db.delete(vote._id);
    }

    // Insert new votes
    for (const submissionId of uniqueSubmissionIds) {
      // Prevent voting for own submission
      const submission = await ctx.db.get(submissionId);
      if (submission && submission.userId === user._id) {
        continue; // Skip own submissions
      }
      await ctx.db.insert("votes", {
        votingRoundId: args.roundId,
        voterUserId: user._id,
        submissionId,
      });
    }
  },
});

/**
 * Get vote results for a round (tallies by submission).
 */
export const getResults = query({
  args: { roundId: v.id("votingRounds") },
  handler: async (ctx, args) => {
    const round = await ctx.db.get(args.roundId);
    if (!round) return null;

    // Get all votes for this round
    const allVotes = await ctx.db
      .query("votes")
      .withIndex("by_roundId_submissionId", (q) =>
        q.eq("votingRoundId", args.roundId)
      )
      .collect();

    // Tally by submission
    const tallies: Record<string, number> = {};
    for (const vote of allVotes) {
      const key = vote.submissionId;
      tallies[key] = (tallies[key] ?? 0) + 1;
    }

    // Get submission details
    const results = await Promise.all(
      Object.entries(tallies)
        .sort(([, a], [, b]) => b - a)
        .map(async ([submissionId, voteCount]) => {
          const submissionDoc = await ctx.db.get(submissionId as any) as any;
          const user = submissionDoc ? await ctx.db.get(submissionDoc.userId) as any : null;
          return {
            submissionId,
            title: submissionDoc?.title ?? "Unknown",
            userName: user?.fullName ?? "Unknown",
            voteCount,
          };
        })
    );

    return { round, results };
  },
});
