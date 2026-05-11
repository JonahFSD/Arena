import { query } from "./_generated/server";

/** Quick count of all seeded tables — run with: npx convex run verify:counts */
export const counts = query({
  args: {},
  handler: async (ctx) => {
    const tables = {
      users: (await ctx.db.query("users").collect()).length,
      applications: (await ctx.db.query("applications").collect()).length,
      submissions: (await ctx.db.query("submissions").collect()).length,
      submissionCollaborators: (await ctx.db.query("submissionCollaborators").collect()).length,
      aiScores: (await ctx.db.query("aiScores").collect()).length,
      votingRounds: (await ctx.db.query("votingRounds").collect()).length,
      votes: (await ctx.db.query("votes").collect()).length,
      prizePools: (await ctx.db.query("prizePools").collect()).length,
      messages: (await ctx.db.query("messages").collect()).length,
      notifications: (await ctx.db.query("notifications").collect()).length,
      bounties: (await ctx.db.query("bounties").collect()).length,
      bountySubmissions: (await ctx.db.query("bountySubmissions").collect()).length,
      ventureStudioFlags: (await ctx.db.query("ventureStudioFlags").collect()).length,
      auditLog: (await ctx.db.query("auditLog").collect()).length,
      leadershipPositions: (await ctx.db.query("leadershipPositions").collect()).length,
      ambassadorApplications: (await ctx.db.query("ambassadorApplications").collect()).length,
    };
    return tables;
  },
});
