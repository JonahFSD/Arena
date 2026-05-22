import type { MutationCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import type { SeededUsers } from "./seedUsers";
import type { SeededSubmissions } from "./seedPitches";

export async function seedVoting(
  ctx: MutationCtx,
  users: SeededUsers,
  submissions: SeededSubmissions,
): Promise<void> {
  const votingRounds = await insertVotingRounds(ctx);
  await insertVotes(ctx, users, votingRounds, submissions);
  await insertPrizePools(ctx, users);
}

async function insertVotingRounds(
  ctx: MutationCtx,
): Promise<Record<string, Id<"votingRounds">>> {
  const votingRounds: Record<string, Id<"votingRounds">> = {};

  votingRounds.march = await ctx.db.insert("votingRounds", {
    monthYear: "2026-03",
    opensAt: new Date("2026-04-01T14:00:00Z").getTime(),
    closesAt: new Date("2026-04-07T14:00:00Z").getTime(),
    minScoreThreshold: 80,
    status: "open",
  });

  votingRounds.february = await ctx.db.insert("votingRounds", {
    monthYear: "2026-02",
    opensAt: new Date("2026-03-01T14:00:00Z").getTime(),
    closesAt: new Date("2026-03-07T14:00:00Z").getTime(),
    minScoreThreshold: 80,
    status: "finalized",
  });

  votingRounds.january = await ctx.db.insert("votingRounds", {
    monthYear: "2026-01",
    opensAt: new Date("2026-02-01T14:00:00Z").getTime(),
    closesAt: new Date("2026-02-07T14:00:00Z").getTime(),
    minScoreThreshold: 80,
    status: "finalized",
  });

  console.log("   ✅ Created 3 voting rounds");
  return votingRounds;
}

async function insertVotes(
  ctx: MutationCtx,
  users: SeededUsers,
  votingRounds: Record<string, Id<"votingRounds">>,
  submissions: SeededSubmissions,
): Promise<void> {
  const voters = [
    users.elijah, users.grace, users.maria, users.noah, users.ava,
    users.caleb, users.sophia, users.isaiah, users.mia,
  ];

  // Feb voting: Sarah's SermonAI vs Maria's GiveSmart
  for (const voter of voters.slice(0, 7)) {
    await ctx.db.insert("votes", {
      votingRoundId: votingRounds.february,
      voterUserId: voter,
      submissionId: submissions.sermonai,
    });
  }
  for (const voter of voters.slice(0, 4)) {
    await ctx.db.insert("votes", {
      votingRoundId: votingRounds.february,
      voterUserId: voter,
      submissionId: submissions.givesmart,
    });
  }

  // Jan voting: Caleb's WorshipFlow vs Ava's FaithFunds
  for (const voter of voters.slice(0, 6)) {
    await ctx.db.insert("votes", {
      votingRoundId: votingRounds.january,
      voterUserId: voter,
      submissionId: submissions.worshipflow,
    });
  }
  for (const voter of voters.slice(0, 5)) {
    await ctx.db.insert("votes", {
      votingRoundId: votingRounds.january,
      voterUserId: voter,
      submissionId: submissions.faithfunds,
    });
  }

  console.log("   ✅ Created votes");
}

async function insertPrizePools(
  ctx: MutationCtx,
  users: SeededUsers,
): Promise<void> {
  await ctx.db.insert("prizePools", {
    monthYear: "2026-03",
    totalCollected: 220000,
    operationalFeePct: 10,
    netPrize: 198000,
    firstPlacePct: 50,
    secondPlacePct: 30,
    thirdPlacePct: 20,
    payoutStatus: "pending",
  });

  await ctx.db.insert("prizePools", {
    monthYear: "2026-02",
    totalCollected: 195000,
    operationalFeePct: 10,
    netPrize: 175500,
    firstPlacePct: 50,
    secondPlacePct: 30,
    thirdPlacePct: 20,
    firstPlaceUserId: users.sarah,
    secondPlaceUserId: users.maria,
    payoutStatus: "paid",
    stripeTransferId: "tr_demo_feb2026",
    finalizedAt: new Date("2026-03-08T14:00:00Z").getTime(),
  });

  await ctx.db.insert("prizePools", {
    monthYear: "2026-01",
    totalCollected: 180000,
    operationalFeePct: 10,
    netPrize: 162000,
    firstPlacePct: 50,
    secondPlacePct: 30,
    thirdPlacePct: 20,
    firstPlaceUserId: users.caleb,
    secondPlaceUserId: users.ava,
    payoutStatus: "paid",
    stripeTransferId: "tr_demo_jan2026",
    finalizedAt: new Date("2026-02-08T14:00:00Z").getTime(),
  });

  console.log("   ✅ Created 3 prize pools");
}
