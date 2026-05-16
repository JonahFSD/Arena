import { query } from "./_generated/server";
import { v } from "convex/values";
import { Doc, Id } from "./_generated/dataModel";

/**
 * Get all past prize pool rounds for the Hall of Fame / Results page.
 *
 * Winners are persisted on the prizePool doc at finalization
 * (votingActions.closeAndFinalize), so this read path no longer needs
 * to collect every vote and re-tally rounds on each page hit. We just
 * gather the unique winner userIds + submissionIds across all pools,
 * batch-load each set once, then JS-join in the map.
 */
export const getPastRounds = query({
  args: {},
  handler: async (ctx) => {
    const pools = await ctx.db
      .query("prizePools")
      .order("desc")
      .collect();

    // Gather unique IDs that we need to resolve for the response.
    const userIdSet = new Set<Id<"users">>();
    const submissionIdSet = new Set<Id<"submissions">>();
    for (const pool of pools) {
      if (pool.firstPlaceUserId) userIdSet.add(pool.firstPlaceUserId);
      if (pool.secondPlaceUserId) userIdSet.add(pool.secondPlaceUserId);
      if (pool.thirdPlaceUserId) userIdSet.add(pool.thirdPlaceUserId);
      if (pool.firstPlaceSubmissionId)
        submissionIdSet.add(pool.firstPlaceSubmissionId);
      if (pool.secondPlaceSubmissionId)
        submissionIdSet.add(pool.secondPlaceSubmissionId);
      if (pool.thirdPlaceSubmissionId)
        submissionIdSet.add(pool.thirdPlaceSubmissionId);
    }

    const userIds = [...userIdSet];
    const submissionIds = [...submissionIdSet];

    // One batched fan-out per resource type — replaces 3N sequential
    // user gets + 6N submission/score lookups in the previous version.
    const [userArr, submissionArr, aiScoreArr] = await Promise.all([
      Promise.all(userIds.map((id) => ctx.db.get(id))),
      Promise.all(submissionIds.map((id) => ctx.db.get(id))),
      Promise.all(
        submissionIds.map((id) =>
          ctx.db
            .query("aiScores")
            .withIndex("by_submissionId", (q) => q.eq("submissionId", id))
            .first()
        )
      ),
    ]);

    const userById = new Map<string, Doc<"users">>();
    for (const u of userArr) if (u) userById.set(u._id, u);

    const submissionById = new Map<string, Doc<"submissions">>();
    for (const s of submissionArr) if (s) submissionById.set(s._id, s);

    const aiScoreBySubmissionId = new Map<string, Doc<"aiScores">>();
    for (const score of aiScoreArr) {
      if (score) aiScoreBySubmissionId.set(score.submissionId, score);
    }

    const winnerSummary = (subId: Id<"submissions"> | undefined, place: 1 | 2 | 3) => {
      if (!subId) return null;
      const submission = submissionById.get(subId);
      if (!submission) return null;
      return {
        place,
        submissionId: subId,
        title: submission.title,
        score: aiScoreBySubmissionId.get(subId)?.overallScore ?? 0,
      };
    };

    const userSummary = (uid: Id<"users"> | undefined) => {
      if (!uid) return null;
      const u = userById.get(uid);
      return u
        ? { _id: u._id, fullName: u.fullName, schoolName: u.schoolName }
        : null;
    };

    return pools.map((pool) => {
      const winningSubmissions = [
        winnerSummary(pool.firstPlaceSubmissionId, 1),
        winnerSummary(pool.secondPlaceSubmissionId, 2),
        winnerSummary(pool.thirdPlaceSubmissionId, 3),
      ].filter((w): w is NonNullable<typeof w> => w !== null);

      return {
        ...pool,
        winningSubmissions,
        firstPlaceUser: userSummary(pool.firstPlaceUserId),
        secondPlaceUser: userSummary(pool.secondPlaceUserId),
        thirdPlaceUser: userSummary(pool.thirdPlaceUserId),
      };
    });
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
