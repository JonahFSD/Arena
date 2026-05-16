import { internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";
import { insertNotification } from "./helpers";
import { PRIZE_SPLIT, PLACE_LEADERBOARD_POINTS } from "./prizeSplit";

// Each notify batch caps per-user work at ~4 doc ops (insert + counter +
// scheduler entry + user read), so 100/batch stays comfortably under
// Convex's 16k-write / 32k-read per-transaction limits even with
// growth. Matches the VOTER_BATCH_SIZE pattern below for finalization.
const NOTIFY_BATCH_SIZE = 100;

/**
 * Open a new voting round on the 1st of each month.
 * Called by cron job. Creates the round + prize pool if they don't exist,
 * and notifies all members.
 */
export const openNewRound = internalMutation({
  args: {},
  handler: async (ctx) => {
    // Compute current month as YYYY-MM
    const now = new Date();
    const monthYear = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;

    // Check if a round already exists for this month
    const existing = await ctx.db
      .query("votingRounds")
      .withIndex("by_monthYear", (q) => q.eq("monthYear", monthYear))
      .first();

    if (existing) {
      console.log(`Voting round for ${monthYear} already exists, skipping.`);
      return;
    }

    // Compute closesAt as the 8th of this month at midnight UTC
    const closesAt = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 8, 0, 0, 0)
    ).getTime();

    // Create the voting round
    await ctx.db.insert("votingRounds", {
      monthYear,
      status: "open",
      opensAt: Date.now(),
      closesAt,
      minScoreThreshold: 60,
    });

    // Create prize pool entry if one doesn't exist
    const existingPool = await ctx.db
      .query("prizePools")
      .withIndex("by_monthYear", (q) => q.eq("monthYear", monthYear))
      .first();

    if (!existingPool) {
      await ctx.db.insert("prizePools", {
        monthYear,
        totalCollected: 0,
        operationalFeePct: PRIZE_SPLIT.operationalFeePct,
        netPrize: 0,
        firstPlacePct: PRIZE_SPLIT.firstPlacePct,
        secondPlacePct: PRIZE_SPLIT.secondPlacePct,
        thirdPlacePct: PRIZE_SPLIT.thirdPlacePct,
        payoutStatus: "pending",
      });
    }

    // Collect notify-eligible user IDs (bounded per role). The orchestrator
    // only writes scheduler entries here — the actual notification inserts +
    // email sends happen in batched mutations below so we stay under the
    // 16k-write per-transaction limit no matter how many members exist.
    //
    // 10000-per-role cap is way more than realistic for a high-school
    // venture studio; if we ever cross it we'd need to paginate the
    // collect itself via a self-rescheduling fan-out.
    const [members, admins, superadmins] = await Promise.all([
      ctx.db
        .query("users")
        .withIndex("by_role", (q) => q.eq("role", "member"))
        .take(10000),
      ctx.db
        .query("users")
        .withIndex("by_role", (q) => q.eq("role", "admin"))
        .take(200),
      ctx.db
        .query("users")
        .withIndex("by_role", (q) => q.eq("role", "superadmin"))
        .take(50),
    ]);

    if (members.length === 10000) {
      console.warn(
        `openNewRound: hit member cap (10000) for ${monthYear} — extra users won't be notified until the cap is raised or pagination is added.`
      );
    }

    const userIds = [...members, ...admins, ...superadmins].map((u) => u._id);

    for (let i = 0; i < userIds.length; i += NOTIFY_BATCH_SIZE) {
      await ctx.scheduler.runAfter(
        0,
        internal.votingActions.notifyVotingOpenBatch,
        {
          monthYear,
          userIds: userIds.slice(i, i + NOTIFY_BATCH_SIZE),
        }
      );
    }

    console.log(
      `Opened voting round for ${monthYear}. Queued ${userIds.length} users ` +
        `across ${Math.ceil(userIds.length / NOTIFY_BATCH_SIZE)} batch(es).`
    );
  },
});

/**
 * Notify one batch of users that voting is open: insert the in-app
 * notification (via the counter-maintaining helper) and schedule the
 * email if the user hasn't opted out. Idempotency note: a re-run of
 * openNewRound is blocked by the existing-round check, so this batch
 * isn't expected to fire twice for the same month under normal
 * operation.
 */
export const notifyVotingOpenBatch = internalMutation({
  args: {
    monthYear: v.string(),
    userIds: v.array(v.id("users")),
  },
  handler: async (ctx, args) => {
    const body = `The ${args.monthYear} voting round is now open. Cast your votes before the 8th!`;
    // Each iteration is independent — different userId, different
    // userCounters row — so we can fan out the per-user work in parallel
    // within the batch. Doc-op budget is per-transaction not per-call,
    // so this is purely a wall-clock win.
    await Promise.all(
      args.userIds.map(async (userId) => {
        const user = await ctx.db.get(userId);
        if (!user) return;

        await insertNotification(ctx, {
          userId,
          type: "voting_open",
          title: "Voting is Open!",
          body,
          actionUrl: "/pitches/voting",
        });

        const prefs = user.notificationPreferences;
        if (!prefs || prefs.votingRoundEmail !== false) {
          await ctx.scheduler.runAfter(0, internal.email.sendNotification, {
            to: user.email,
            recipientName: user.fullName.split(" ")[0],
            subject: `Voting is Open — ${args.monthYear}`,
            heading: "Voting is Open!",
            body,
            ctaLabel: "Vote Now",
            ctaUrl: "/pitches/voting",
          });
        }
      })
    );
  },
});

// Batch sizes chosen so each batch mutation stays well under Convex's
// 16k-writes / 32k-reads / 16MiB per-transaction limits. Per-voter cost
// is ~4 doc ops (lookup + insert award + read user + patch user).
const VOTER_BATCH_SIZE = 100;
const TOP10_POINTS = 400;
const VOTER_POINTS = 100;

type AwardKind = "place_1" | "place_2" | "place_3" | "top10" | "voter";

/**
 * Idempotent award helper. Inserts a votingAwards row and increments the
 * user's points only if no row exists for (round, user, kind). Returns the
 * fresh user doc on success, or null if the award was already recorded or
 * the user is missing.
 */
async function recordAward(
  ctx: MutationCtx,
  args: {
    votingRoundId: Id<"votingRounds">;
    userId: Id<"users">;
    kind: AwardKind;
    points: number;
  }
) {
  const existing = await ctx.db
    .query("votingAwards")
    .withIndex("by_round_user_kind", (q) =>
      q
        .eq("votingRoundId", args.votingRoundId)
        .eq("userId", args.userId)
        .eq("kind", args.kind)
    )
    .unique();

  if (existing) return null;

  const user = await ctx.db.get(args.userId);
  if (!user) return null;

  await ctx.db.insert("votingAwards", {
    votingRoundId: args.votingRoundId,
    userId: args.userId,
    kind: args.kind,
    points: args.points,
    awardedAt: Date.now(),
  });

  await ctx.db.patch(user._id, {
    points: (user.points ?? 0) + args.points,
  });

  return user;
}

/**
 * Close the current voting round and finalize results.
 *
 * Orchestrator only: closes the round, tallies votes, records winners on the
 * prize pool, and schedules batch mutations for point awards. Point awards
 * and winner notifications run in separate transactions via
 * ctx.scheduler.runAfter so the whole flow stays under the per-transaction
 * doc limit even when scale grows.
 *
 * Idempotency is enforced by the votingAwards table — each batch checks the
 * (roundId, userId, kind) index before granting points, so a re-run (manual
 * trigger, cron drift) is safe.
 */
export const closeAndFinalize = internalMutation({
  args: {},
  handler: async (ctx) => {
    const round = await ctx.db
      .query("votingRounds")
      .withIndex("by_status", (q) => q.eq("status", "open"))
      .first();

    if (!round) {
      console.log("No open voting round found, skipping finalization.");
      return;
    }

    await ctx.db.patch(round._id, {
      status: "finalized",
      closesAt: Date.now(),
    });

    const allVotes = await ctx.db
      .query("votes")
      .withIndex("by_roundId_submissionId", (q) =>
        q.eq("votingRoundId", round._id)
      )
      .collect();

    const tallies: Record<string, number> = {};
    for (const vote of allVotes) {
      const key = vote.submissionId as string;
      tallies[key] = (tallies[key] ?? 0) + 1;
    }

    const rankedSubmissionIds = Object.entries(tallies)
      .sort(([, a], [, b]) => b - a)
      .map(([id]) => id as Id<"submissions">);

    // Resolve top 3 winners (skip submissions whose author is gone)
    const winners: {
      place: 1 | 2 | 3;
      submissionId: Id<"submissions">;
      submissionTitle: string;
      userId: Id<"users">;
      points: number;
    }[] = [];

    for (let i = 0; i < Math.min(3, rankedSubmissionIds.length); i++) {
      const submission = await ctx.db.get(rankedSubmissionIds[i]);
      if (!submission) continue;
      const place = (i + 1) as 1 | 2 | 3;
      winners.push({
        place,
        submissionId: rankedSubmissionIds[i],
        submissionTitle: submission.title,
        userId: submission.userId,
        points: PLACE_LEADERBOARD_POINTS[place],
      });
    }

    // Persist winners on the prize pool (idempotent — same data on re-run)
    const prizePool = await ctx.db
      .query("prizePools")
      .withIndex("by_monthYear", (q) => q.eq("monthYear", round.monthYear))
      .first();

    if (prizePool) {
      const patchData: Record<string, unknown> = { finalizedAt: Date.now() };
      if (winners[0]) patchData.firstPlaceUserId = winners[0].userId;
      if (winners[1]) patchData.secondPlaceUserId = winners[1].userId;
      if (winners[2]) patchData.thirdPlaceUserId = winners[2].userId;
      await ctx.db.patch(prizePool._id, patchData);
    }

    // Top-10 authors (excluding anyone already in top 3), deduped by user
    const top3UserIds = new Set(winners.map((w) => w.userId as string));
    const top10AuthorIds: Id<"users">[] = [];
    const seenTop10 = new Set<string>();
    for (const subId of rankedSubmissionIds.slice(0, 10)) {
      const submission = await ctx.db.get(subId);
      if (!submission) continue;
      const uid = submission.userId as string;
      if (top3UserIds.has(uid) || seenTop10.has(uid)) continue;
      seenTop10.add(uid);
      top10AuthorIds.push(submission.userId);
    }

    // Unique voter IDs from this round
    const voterIdSet = new Set<string>();
    for (const vote of allVotes) {
      voterIdSet.add(vote.voterUserId as string);
    }
    const voterIds = [...voterIdSet] as Id<"users">[];

    // Schedule award batches. Each batch is its own transaction.
    if (winners.length > 0) {
      await ctx.scheduler.runAfter(
        0,
        internal.votingActions.awardWinnersBatch,
        { votingRoundId: round._id, monthYear: round.monthYear, winners }
      );
    }

    if (top10AuthorIds.length > 0) {
      await ctx.scheduler.runAfter(
        0,
        internal.votingActions.awardTop10Batch,
        { votingRoundId: round._id, userIds: top10AuthorIds }
      );
    }

    for (let i = 0; i < voterIds.length; i += VOTER_BATCH_SIZE) {
      await ctx.scheduler.runAfter(
        0,
        internal.votingActions.awardVotersBatch,
        {
          votingRoundId: round._id,
          userIds: voterIds.slice(i, i + VOTER_BATCH_SIZE),
        }
      );
    }

    console.log(
      `Finalized voting round for ${round.monthYear}. ` +
        `${allVotes.length} total votes, ${rankedSubmissionIds.length} submissions received votes, ` +
        `${voterIds.length} voters queued in ${Math.ceil(voterIds.length / VOTER_BATCH_SIZE)} batch(es).`
    );
  },
});

/**
 * Award 1st/2nd/3rd place points + send winner notifications and emails.
 * Idempotent on (roundId, userId, kind=place_N) — re-runs are no-ops.
 */
export const awardWinnersBatch = internalMutation({
  args: {
    votingRoundId: v.id("votingRounds"),
    monthYear: v.string(),
    winners: v.array(
      v.object({
        place: v.union(v.literal(1), v.literal(2), v.literal(3)),
        submissionId: v.id("submissions"),
        submissionTitle: v.string(),
        userId: v.id("users"),
        points: v.number(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const placeLabels = ["1st", "2nd", "3rd"] as const;

    for (const winner of args.winners) {
      const kind = `place_${winner.place}` as AwardKind;
      const user = await recordAward(ctx, {
        votingRoundId: args.votingRoundId,
        userId: winner.userId,
        kind,
        points: winner.points,
      });
      if (!user) continue;

      const title = `Congratulations! You placed ${placeLabels[winner.place - 1]}!`;
      const body = `Your submission "${winner.submissionTitle}" won ${placeLabels[winner.place - 1]} place in the ${args.monthYear} voting round! You earned +${winner.points} points.`;

      await insertNotification(ctx, {
        userId: winner.userId,
        type: "voting_winner",
        title,
        body,
        actionUrl: "/pitches/results",
      });

      const prefs = user.notificationPreferences;
      if (!prefs || prefs.winnersEmail !== false) {
        await ctx.scheduler.runAfter(0, internal.email.sendNotification, {
          to: user.email,
          recipientName: user.fullName.split(" ")[0],
          subject: `You placed ${placeLabels[winner.place - 1]} — ${args.monthYear}!`,
          heading: title,
          body,
          ctaLabel: "View Results",
          ctaUrl: "/pitches/results",
        });
      }
    }
  },
});

/**
 * Award +400 points to top-10 submission authors (excluding top 3).
 * Idempotent on (roundId, userId, kind=top10).
 */
export const awardTop10Batch = internalMutation({
  args: {
    votingRoundId: v.id("votingRounds"),
    userIds: v.array(v.id("users")),
  },
  handler: async (ctx, args) => {
    for (const userId of args.userIds) {
      await recordAward(ctx, {
        votingRoundId: args.votingRoundId,
        userId,
        kind: "top10",
        points: TOP10_POINTS,
      });
    }
  },
});

/**
 * Award +100 voter-participation points. Idempotent on (roundId, userId,
 * kind=voter). Called once per VOTER_BATCH_SIZE-sized slice of voters.
 */
export const awardVotersBatch = internalMutation({
  args: {
    votingRoundId: v.id("votingRounds"),
    userIds: v.array(v.id("users")),
  },
  handler: async (ctx, args) => {
    for (const userId of args.userIds) {
      await recordAward(ctx, {
        votingRoundId: args.votingRoundId,
        userId,
        kind: "voter",
        points: VOTER_POINTS,
      });
    }
  },
});
