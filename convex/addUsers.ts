import { internalMutation } from "./_generated/server";
import { bumpPlatformStat } from "./helpers";

/**
 * Add real user accounts.
 * Run with: npx convex run addUsers:run
 */
export const run = internalMutation({
  args: {},
  handler: async (ctx) => {
    // Check if Jake's real account already exists
    const existingJake = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", "jake@austinchristianu.org"))
      .first();

    if (existingJake) {
      console.log("⚠️  Real user accounts already exist. Skipping.");
      return;
    }

    // Jake Oswald — superadmin
    const jakeId = await ctx.db.insert("users", {
      email: "jake@austinchristianu.org",
      fullName: "Jake Oswald",
      bio: "Platform founder. Building the future of youth entrepreneurship at the intersection of faith and innovation.",
      schoolName: "Austin Christian University",
      state: "TX",
      role: "superadmin",
      skills: ["Product Design", "Full-Stack Dev", "AI/ML"],
      lookingForCofounders: false,
      bqType: "Builder",
      referralCode: "jake-ref",
      points: 0,
      totalEarnings: 0,
      networkCount: 0,
    });
    console.log("✅ Created Jake Oswald (superadmin):", jakeId);

    // Connor Dore — member
    const connorId = await ctx.db.insert("users", {
      email: "connordore36@gmail.com",
      fullName: "Connor Dore",
      role: "member",
      skills: [],
      lookingForCofounders: false,
      points: 0,
      totalEarnings: 0,
      networkCount: 0,
    });
    await bumpPlatformStat(ctx, "totalMembers", 1);
    console.log("✅ Created Connor Dore (member):", connorId);

    // Braden Peays — member
    const bradenId = await ctx.db.insert("users", {
      email: "bradenpeays@gmail.com",
      fullName: "Braden Peays",
      role: "member",
      skills: [],
      lookingForCofounders: false,
      points: 0,
      totalEarnings: 0,
      networkCount: 0,
    });
    await bumpPlatformStat(ctx, "totalMembers", 1);
    console.log("✅ Created Braden Peays (member):", bradenId);

    console.log("\n🎉 All real user accounts created.");
  },
});
