import type { MutationCtx } from "./_generated/server";
import type { SeededUsers } from "./seedUsers";

export async function seedGovernance(
  ctx: MutationCtx,
  users: SeededUsers,
): Promise<void> {
  await insertVentureStudioFlags(ctx, users);
  await insertAuditLog(ctx, users);
  await insertLeadershipPositions(ctx, users);
}

async function insertVentureStudioFlags(
  ctx: MutationCtx,
  users: SeededUsers,
): Promise<void> {
  await ctx.db.insert("ventureStudioFlags", {
    userId: users.isaiah,
    flaggedByAdminId: users.jake,
    notes: "Missed two consecutive submission deadlines. Follow up to check if student needs support or is disengaging.",
  });

  console.log("   ✅ Created admin flags");
}

async function insertAuditLog(
  ctx: MutationCtx,
  users: SeededUsers,
): Promise<void> {
  await ctx.db.insert("auditLog", {
    adminUserId: users.jake,
    action: "application.approved",
    targetType: "application",
    targetId: "sarah-chen-app",
    metadata: { applicantEmail: "sarah.chen@example.com" },
  });

  await ctx.db.insert("auditLog", {
    adminUserId: users.jake,
    action: "application.rejected",
    targetType: "application",
    targetId: "test-applicant",
    metadata: { applicantEmail: "rejected.applicant@example.com", reason: "Lacks depth" },
  });

  await ctx.db.insert("auditLog", {
    adminUserId: users.jake,
    action: "user.flagged",
    targetType: "user",
    targetId: users.isaiah,
    metadata: { reason: "Missed deadlines" },
  });

  console.log("   ✅ Created audit log entries");
}

async function insertLeadershipPositions(
  ctx: MutationCtx,
  users: SeededUsers,
): Promise<void> {
  await ctx.db.insert("leadershipPositions", {
    type: "executive", name: "Connor Dore", userId: users.connor, role: "President",
    sortOrder: 1,
  });
  await ctx.db.insert("leadershipPositions", {
    type: "executive", name: "David Park", userId: users.david, role: "VP Marketing",
    school: "Covenant Prep", graduation: 2027, sortOrder: 2,
  });
  await ctx.db.insert("leadershipPositions", {
    type: "executive", name: "Maria Garcia", userId: users.maria, role: "VP Technology",
    school: "Hope Academy", graduation: 2028, sortOrder: 3,
  });
  await ctx.db.insert("leadershipPositions", {
    type: "executive", name: "Elijah Thompson", userId: users.elijah, role: "VP Recruitment",
    school: "Liberty Christian", graduation: 2028, sortOrder: 4,
  });
  await ctx.db.insert("leadershipPositions", {
    type: "executive", name: "Grace Kim", userId: users.grace, role: "VP Operations",
    school: "Faith Lutheran", graduation: 2029, sortOrder: 5,
  });
  await ctx.db.insert("leadershipPositions", {
    type: "executive", name: "Jake Oswald", userId: users.jake, role: "Advisor",
    company: "Austin Christian U", jobTitle: "Accelerator Director", sortOrder: 7,
  });

  // Regional Directors
  await ctx.db.insert("leadershipPositions", {
    type: "regional_director", name: "Ava Martinez", userId: users.ava, role: "Regional Director",
    region: "New England", school: "Cornerstone Academy", graduation: 2028, sortOrder: 1,
  });
  await ctx.db.insert("leadershipPositions", {
    type: "regional_director", name: "Noah Williams", userId: users.noah, role: "Regional Director",
    region: "Mid-Atlantic", school: "Heritage Christian", graduation: 2028, sortOrder: 2,
  });
  await ctx.db.insert("leadershipPositions", {
    type: "regional_director", name: "Sophia Lee", userId: users.sophia, role: "Regional Director",
    region: "Southeast", school: "Trinity Christian", graduation: 2029, sortOrder: 3,
  });
  await ctx.db.insert("leadershipPositions", {
    type: "regional_director", name: "Caleb Johnson", userId: users.caleb, role: "Regional Director",
    region: "Midwest", school: "Redeemer Prep", graduation: 2028, sortOrder: 4,
  });
  await ctx.db.insert("leadershipPositions", {
    type: "regional_director", name: "Isaiah Brown", userId: users.isaiah, role: "Regional Director",
    region: "South Central", school: "Victory Christian", graduation: 2028, sortOrder: 5,
  });

  // State Ambassadors
  await ctx.db.insert("leadershipPositions", {
    type: "ambassador", name: "Maria Garcia", userId: users.maria, role: "Ambassador",
    state: "California", school: "Hope Academy", graduation: 2028, sortOrder: 1,
  });
  await ctx.db.insert("leadershipPositions", {
    type: "ambassador", name: "Elijah Thompson", userId: users.elijah, role: "Ambassador",
    state: "Florida", school: "Liberty Christian", graduation: 2028, sortOrder: 2,
  });
  await ctx.db.insert("leadershipPositions", {
    type: "ambassador", name: "Grace Kim", userId: users.grace, role: "Ambassador",
    state: "New York", school: "Faith Lutheran", graduation: 2029, sortOrder: 3,
  });
  await ctx.db.insert("leadershipPositions", {
    type: "ambassador", name: "Noah Williams", userId: users.noah, role: "Ambassador",
    state: "Texas", school: "Heritage Christian", graduation: 2028, sortOrder: 4,
  });

  console.log("   ✅ Created leadership positions");
}
