import { internalMutation, internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { seedUsers } from "./seedUsers";
import { seedApplications, seedNominators } from "./seedApplications";
import { seedPitches } from "./seedPitches";
import { seedVoting } from "./seedVoting";
import { seedCommunity } from "./seedCommunity";
import { seedBounties } from "./seedBounties";
import { seedGovernance } from "./seedGovernance";

// ============================================
// SEED DATA — realistic demo data for the platform
//
// Run with:  npx convex run seed:run
//
// This is idempotent — it checks for existing data
// before inserting. To reset, clear the tables in the
// Convex dashboard first, then re-run.
// ============================================

/**
 * Main entry point — calls the insert mutation.
 * Uses an action so we can orchestrate multiple mutations.
 */
export const run = internalAction({
  args: {},
  handler: async (ctx) => {
    await ctx.runMutation(internal.seed.insertAll);
    // Backfill denormalized counters from the just-seeded rows so badge
    // queries return the right values immediately.
    await ctx.runMutation(internal.counters.recomputeAll);
  },
});

/**
 * Inserts all demo data in a single transaction.
 */
export const insertAll = internalMutation({
  args: {},
  handler: async (ctx) => {
    // Check if we've already seeded
    const existingUsers = await ctx.db.query("users").take(1);
    if (existingUsers.length > 0) {
      console.log("⚠️  Database already has data. Skipping seed.");
      console.log("   Clear tables in the dashboard first if you want to re-seed.");
      return;
    }

    console.log("🌱 Seeding database...");

    const users = await seedUsers(ctx);
    await seedApplications(ctx, users);
    const submissions = await seedPitches(ctx, users);
    await seedVoting(ctx, users, submissions);
    await seedCommunity(ctx, users, submissions);
    await seedBounties(ctx, users);
    await seedGovernance(ctx, users);
    await seedNominators(ctx, users);

    console.log("\n🎉 Seed complete! All demo data is live.");
    console.log("   View it at: https://dashboard.convex.dev/d/energetic-okapi-601");
  },
});

/**
 * Clear all seed data — use from the dashboard or CLI.
 *
 * Run with:  npx convex run seed:clearAll
 */
export const clearAll = internalMutation({
  args: {},
  handler: async (ctx) => {
    const tables = [
      "authRateLimits", "authRefreshTokens", "authSessions",
      "authVerificationCodes", "authVerifiers", "authAccounts",
      "ambassadorApplications", "leadershipPositions",
      "nominations", "nominators", "nominatorRequests",
      "auditLog", "ventureStudioFlags", "bountySubmissions", "bounties",
      "notifications", "messages", "votes", "prizePools", "votingRounds",
      "aiScores", "submissionCollaborators", "submissions", "applications",
      "memberships", "userCounters", "users",
    ] as const;

    for (const table of tables) {
      const docs = await ctx.db.query(table).collect();
      for (const doc of docs) {
        await ctx.db.delete(doc._id);
      }
      console.log(`   🗑️  Cleared ${docs.length} rows from ${table}`);
    }

    console.log("\n✅ All tables cleared. Run seed:run to re-seed.");
  },
});
