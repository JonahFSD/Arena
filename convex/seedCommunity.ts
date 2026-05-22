import type { MutationCtx } from "./_generated/server";
import type { SeededUsers } from "./seedUsers";
import type { SeededSubmissions } from "./seedPitches";

export async function seedCommunity(
  ctx: MutationCtx,
  users: SeededUsers,
  submissions: SeededSubmissions,
): Promise<void> {
  const threads = await insertMessages(ctx, users);
  await insertNotifications(ctx, users, submissions, threads);
}

type MessageThreads = {
  sarahJake: string;
  davidJake: string;
  elijahJake: string;
  graceJake: string;
};

async function insertMessages(
  ctx: MutationCtx,
  users: SeededUsers,
): Promise<MessageThreads> {
  const sarahJakeThread = [users.sarah as string, users.jake as string].sort().join("_");
  const davidJakeThread = [users.david as string, users.jake as string].sort().join("_");
  const elijahJakeThread = [users.elijah as string, users.jake as string].sort().join("_");
  const graceJakeThread = [users.grace as string, users.jake as string].sort().join("_");

  // Sarah <-> Jake conversation
  await ctx.db.insert("messages", {
    threadId: sarahJakeThread,
    senderUserId: users.sarah,
    recipientUserId: users.jake,
    body: "Hey Jake! I just submitted my EcoTrack pitch for this month. Would love your feedback on the demo video before the deadline!",
    readAt: Date.now() - 2 * 60 * 60 * 1000,
  });
  await ctx.db.insert("messages", {
    threadId: sarahJakeThread,
    senderUserId: users.jake,
    recipientUserId: users.sarah,
    body: "Just watched it — the IoT sensor integration demo was really compelling. One suggestion: spend 30 more seconds on the business model slide. Judges love seeing the path to revenue.",
    readAt: Date.now() - 1.5 * 60 * 60 * 1000,
  });
  await ctx.db.insert("messages", {
    threadId: sarahJakeThread,
    senderUserId: users.sarah,
    recipientUserId: users.jake,
    body: "Great call, I'll re-record that section tonight. Also — are you coming to the virtual meetup on Friday?",
  });

  // David <-> Jake conversation
  await ctx.db.insert("messages", {
    threadId: davidJakeThread,
    senderUserId: users.david,
    recipientUserId: users.jake,
    body: "Hey! Grace and I are looking for a third team member for FaithConnect. Know anyone with backend experience who might be interested?",
    readAt: Date.now() - 24 * 60 * 60 * 1000,
  });
  await ctx.db.insert("messages", {
    threadId: davidJakeThread,
    senderUserId: users.jake,
    recipientUserId: users.david,
    body: "Noah Williams might be a great fit — he's strong with Go and databases. I'll introduce you two!",
    readAt: Date.now() - 23 * 60 * 60 * 1000,
  });

  // Elijah <-> Jake
  await ctx.db.insert("messages", {
    threadId: elijahJakeThread,
    senderUserId: users.elijah,
    recipientUserId: users.jake,
    body: "Quick question — is there a minimum AI score needed to qualify for the voting round?",
    readAt: Date.now() - 3 * 24 * 60 * 60 * 1000,
  });
  await ctx.db.insert("messages", {
    threadId: elijahJakeThread,
    senderUserId: users.jake,
    recipientUserId: users.elijah,
    body: "Yes! Submissions need at least an 80 on the AI score to be eligible for community voting. Focus on the presentation and faith integration categories — those tend to make the biggest difference.",
    readAt: Date.now() - 3 * 24 * 60 * 60 * 1000,
  });

  // Grace <-> Jake (unread)
  await ctx.db.insert("messages", {
    threadId: graceJakeThread,
    senderUserId: users.grace,
    recipientUserId: users.jake,
    body: "I'm thinking about switching PrayerWall from a solo project to a team submission. David offered to help with the backend. What do you think?",
  });

  console.log("   ✅ Created message threads");

  return {
    sarahJake: sarahJakeThread,
    davidJake: davidJakeThread,
    elijahJake: elijahJakeThread,
    graceJake: graceJakeThread,
  };
}

async function insertNotifications(
  ctx: MutationCtx,
  users: SeededUsers,
  submissions: SeededSubmissions,
  threads: MessageThreads,
): Promise<void> {
  await ctx.db.insert("notifications", {
    userId: users.jake,
    type: "ai_score_ready",
    title: "AI Score Ready",
    body: "EcoTrack received a score of 92/100!",
    read: false,
    actionUrl: "/submissions/" + submissions.ecotrack,
  });

  await ctx.db.insert("notifications", {
    userId: users.jake,
    type: "voting_open",
    title: "Voting is Open!",
    body: "The March 2026 voting round is now open. Cast your votes before April 7th.",
    read: false,
    actionUrl: "/voting",
  });

  await ctx.db.insert("notifications", {
    userId: users.jake,
    type: "new_message",
    title: "New Message from Grace Kim",
    body: "I'm thinking about switching PrayerWall from a solo project...",
    read: false,
    actionUrl: "/messages/" + threads.graceJake,
  });

  await ctx.db.insert("notifications", {
    userId: users.jake,
    type: "winner_announced",
    title: "February Winners Announced!",
    body: "Congratulations to Sarah Chen (1st) and Maria Garcia (2nd) for the February round!",
    read: true,
    actionUrl: "/pitches/results",
  });

  await ctx.db.insert("notifications", {
    userId: users.jake,
    type: "application_approved",
    title: "New Member Joined",
    body: "Isaiah Brown's application has been approved and they've joined the community.",
    read: true,
    actionUrl: "/members/" + users.isaiah,
  });

  console.log("   ✅ Created notifications");
}
