import { internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";

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
        operationalFeePct: 20,
        netPrize: 0,
        firstPlacePct: 50,
        secondPlacePct: 30,
        thirdPlacePct: 20,
        payoutStatus: "pending",
      });
    }

    // Notify all members that voting is open
    const members = await ctx.db
      .query("users")
      .withIndex("by_role", (q) => q.eq("role", "member"))
      .collect();

    // Also notify admins and superadmins
    const admins = await ctx.db
      .query("users")
      .withIndex("by_role", (q) => q.eq("role", "admin"))
      .collect();
    const superadmins = await ctx.db
      .query("users")
      .withIndex("by_role", (q) => q.eq("role", "superadmin"))
      .collect();

    const allUsers = [...members, ...admins, ...superadmins];

    for (const user of allUsers) {
      await ctx.db.insert("notifications", {
        userId: user._id,
        type: "voting_open",
        title: "Voting is Open!",
        body: `The ${monthYear} voting round is now open. Cast your votes before the 8th!`,
        read: false,
        actionUrl: "/pitches/voting",
      });

      // Send email notification (checks user preference)
      const prefs = user.notificationPreferences;
      if (!prefs || prefs.votingRoundEmail !== false) {
        await ctx.scheduler.runAfter(0, internal.email.sendNotification, {
          to: user.email,
          recipientName: user.fullName.split(" ")[0],
          subject: `Voting is Open — ${monthYear}`,
          heading: "Voting is Open!",
          body: `The ${monthYear} voting round is now open. Cast your votes before the 8th!`,
          ctaLabel: "Vote Now",
          ctaUrl: "/pitches/voting",
        });
      }
    }

    console.log(
      `Opened voting round for ${monthYear}. Notified ${allUsers.length} users.`
    );
  },
});

/**
 * Close the current voting round and finalize results.
 * Called by cron job on the 8th of each month.
 * Tallies votes, determines winners, awards points, and notifies winners.
 */
export const closeAndFinalize = internalMutation({
  args: {},
  handler: async (ctx) => {
    // Find the current open voting round
    const round = await ctx.db
      .query("votingRounds")
      .withIndex("by_status", (q) => q.eq("status", "open"))
      .first();

    if (!round) {
      console.log("No open voting round found, skipping finalization.");
      return;
    }

    // Close the round
    await ctx.db.patch(round._id, {
      status: "finalized",
      closesAt: Date.now(),
    });

    // Tally all votes for this round
    const allVotes = await ctx.db
      .query("votes")
      .withIndex("by_roundId_submissionId", (q) =>
        q.eq("votingRoundId", round._id)
      )
      .collect();

    // Count votes per submission
    const tallies: Record<string, number> = {};
    for (const vote of allVotes) {
      const key = vote.submissionId as string;
      tallies[key] = (tallies[key] ?? 0) + 1;
    }

    // Sort by vote count descending
    const ranked = Object.entries(tallies)
      .sort(([, a], [, b]) => b - a);

    // Determine top 3 winners
    const winners: {
      place: number;
      submissionId: string;
      userId: Id<"users"> | null;
      points: number;
    }[] = [];

    const pointsByPlace = [1000, 750, 500];

    for (let i = 0; i < Math.min(3, ranked.length); i++) {
      const [submissionId] = ranked[i];
      const submission = await ctx.db.get(submissionId as Id<"submissions">);
      winners.push({
        place: i + 1,
        submissionId,
        userId: submission?.userId ?? null,
        points: pointsByPlace[i],
      });
    }

    // Update prize pool with winners
    const prizePool = await ctx.db
      .query("prizePools")
      .withIndex("by_monthYear", (q) => q.eq("monthYear", round.monthYear))
      .first();

    if (prizePool) {
      const patchData: Record<string, unknown> = {
        finalizedAt: Date.now(),
      };
      if (winners[0]?.userId) patchData.firstPlaceUserId = winners[0].userId;
      if (winners[1]?.userId) patchData.secondPlaceUserId = winners[1].userId;
      if (winners[2]?.userId) patchData.thirdPlaceUserId = winners[2].userId;
      await ctx.db.patch(prizePool._id, patchData);
    }

    // Award points to top 3 winners
    for (const winner of winners) {
      if (winner.userId) {
        const user = await ctx.db.get(winner.userId);
        if (user) {
          await ctx.db.patch(user._id, {
            points: (user.points ?? 0) + winner.points,
          });
        }
      }
    }

    // Award +400 points to all users with submissions in the top 10
    const top10SubmissionIds = ranked.slice(0, 10).map(([id]) => id);
    const top3UserIds = new Set(
      winners.map((w) => w.userId).filter(Boolean) as Id<"users">[]
    );
    const top10AwardedUserIds = new Set<string>();

    for (const subId of top10SubmissionIds) {
      const submission = await ctx.db.get(subId as Id<"submissions">);
      if (submission && !top3UserIds.has(submission.userId)) {
        // Don't double-award top 3 winners, and don't award same user twice
        if (!top10AwardedUserIds.has(submission.userId as string)) {
          top10AwardedUserIds.add(submission.userId as string);
          const user = await ctx.db.get(submission.userId);
          if (user) {
            await ctx.db.patch(user._id, {
              points: (user.points ?? 0) + 400,
            });
          }
        }
      }
    }

    // Award +100 points to all users who voted in this round
    const voterIds = new Set<string>();
    for (const vote of allVotes) {
      voterIds.add(vote.voterUserId as string);
    }

    for (const voterId of voterIds) {
      const user = await ctx.db.get(voterId as Id<"users">);
      if (user) {
        await ctx.db.patch(user._id, {
          points: (user.points ?? 0) + 100,
        });
      }
    }

    // Create notifications for winners + send email
    const placeLabels = ["1st", "2nd", "3rd"];
    for (const winner of winners) {
      if (winner.userId) {
        const submission = await ctx.db.get(
          winner.submissionId as Id<"submissions">
        );
        const winnerUser = await ctx.db.get(winner.userId);
        const title = `Congratulations! You placed ${placeLabels[winner.place - 1]}!`;
        const body = `Your submission "${submission?.title ?? "Unknown"}" won ${placeLabels[winner.place - 1]} place in the ${round.monthYear} voting round! You earned +${winner.points} points.`;

        await ctx.db.insert("notifications", {
          userId: winner.userId,
          type: "voting_winner",
          title,
          body,
          read: false,
          actionUrl: "/pitches/results",
        });

        // Send winner email
        if (winnerUser) {
          const prefs = winnerUser.notificationPreferences;
          if (!prefs || prefs.winnersEmail !== false) {
            await ctx.scheduler.runAfter(0, internal.email.sendNotification, {
              to: winnerUser.email,
              recipientName: winnerUser.fullName.split(" ")[0],
              subject: `You placed ${placeLabels[winner.place - 1]} — ${round.monthYear}!`,
              heading: title,
              body,
              ctaLabel: "View Results",
              ctaUrl: "/pitches/results",
            });
          }
        }
      }
    }

    console.log(
      `Finalized voting round for ${round.monthYear}. ` +
        `${allVotes.length} total votes, ${ranked.length} submissions received votes, ` +
        `${voterIds.size} voters awarded participation points.`
    );
  },
});
