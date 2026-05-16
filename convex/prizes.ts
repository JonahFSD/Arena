import { query } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

/**
 * Get all past prize pool rounds for the Hall of Fame / Results page.
 * Includes winner user info AND winning submission details.
 */
export const getPastRounds = query({
  args: {},
  handler: async (ctx) => {
    const pools = await ctx.db
      .query("prizePools")
      .order("desc")
      .collect();

    // Get all votes to determine winning submissions per round
    const allVotes = await ctx.db.query("votes").collect();
    const allRounds = await ctx.db.query("votingRounds").collect();

    const withWinners = await Promise.all(
      pools.map(async (pool) => {
        // Find the voting round for this month
        const round = allRounds.find((r) => r.monthYear === pool.monthYear);

        // Tally votes for this round to find winning submissions
        let winningSubmissions: {
          place: number;
          submissionId: string;
          title: string;
          score: number;
        }[] = [];

        if (round) {
          const roundVotes = allVotes.filter(
            (v) => v.votingRoundId === round._id
          );
          const tallies: Record<string, number> = {};
          for (const vote of roundVotes) {
            const key = vote.submissionId as string;
            tallies[key] = (tallies[key] ?? 0) + 1;
          }
          const ranked = Object.entries(tallies)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 3);

          winningSubmissions = await Promise.all(
            ranked.map(async ([subId], i) => {
              const submission = await ctx.db.get(subId as Id<"submissions">);
              const aiScore = submission
                ? await ctx.db
                    .query("aiScores")
                    .withIndex("by_submissionId", (q) =>
                      q.eq("submissionId", submission._id)
                    )
                    .first()
                : null;
              return {
                place: i + 1,
                submissionId: subId,
                title: submission?.title ?? "Unknown",
                score: aiScore?.overallScore ?? 0,
              };
            })
          );
        }

        // Resolve winner user info
        const first = pool.firstPlaceUserId
          ? await ctx.db.get(pool.firstPlaceUserId)
          : null;
        const second = pool.secondPlaceUserId
          ? await ctx.db.get(pool.secondPlaceUserId)
          : null;
        const third = pool.thirdPlaceUserId
          ? await ctx.db.get(pool.thirdPlaceUserId)
          : null;

        return {
          ...pool,
          winningSubmissions,
          firstPlaceUser: first
            ? { _id: first._id, fullName: first.fullName, schoolName: first.schoolName }
            : null,
          secondPlaceUser: second
            ? { _id: second._id, fullName: second.fullName, schoolName: second.schoolName }
            : null,
          thirdPlaceUser: third
            ? { _id: third._id, fullName: third.fullName, schoolName: third.schoolName }
            : null,
        };
      })
    );

    return withWinners;
  },
});

/**
 * Get a single prize pool by month.
 */
export const getByMonth = query({
  args: { monthYear: v.string() },
  handler: async (ctx, args) => {
    const pool = await ctx.db
      .query("prizePools")
      .withIndex("by_monthYear", (q) => q.eq("monthYear", args.monthYear))
      .first();

    if (!pool) return null;

    // Attach winner info
    const first = pool.firstPlaceUserId
      ? await ctx.db.get(pool.firstPlaceUserId)
      : null;
    const second = pool.secondPlaceUserId
      ? await ctx.db.get(pool.secondPlaceUserId)
      : null;
    const third = pool.thirdPlaceUserId
      ? await ctx.db.get(pool.thirdPlaceUserId)
      : null;

    return {
      ...pool,
      firstPlaceUser: first
        ? { _id: first._id, fullName: first.fullName }
        : null,
      secondPlaceUser: second
        ? { _id: second._id, fullName: second.fullName }
        : null,
      thirdPlaceUser: third
        ? { _id: third._id, fullName: third.fullName }
        : null,
    };
  },
});
