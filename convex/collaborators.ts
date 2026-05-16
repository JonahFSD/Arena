import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUser, insertNotification, toPublicUser } from "./helpers";

/**
 * Invite a user to collaborate on a submission.
 * Only the submission's team lead can send invitations.
 */
export const invite = mutation({
  args: {
    submissionId: v.id("submissions"),
    userId: v.id("users"),
    role: v.string(),
    revenueSplitPct: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await getAuthUser(ctx);

    // Verify submission exists and caller is the team lead
    const submission = await ctx.db.get(args.submissionId);
    if (!submission) {
      throw new Error("Submission not found");
    }
    if (submission.userId !== user._id) {
      throw new Error("Only the team lead can invite collaborators");
    }
    if (submission.status !== "draft") {
      throw new Error("Can only invite collaborators to draft submissions");
    }

    // Check the user isn't already invited for this submission
    const existing = await ctx.db
      .query("submissionCollaborators")
      .withIndex("by_submissionId", (q) => q.eq("submissionId", args.submissionId))
      .collect();
    if (existing.some((c) => c.userId === args.userId)) {
      throw new Error("User is already invited to this submission");
    }

    // Insert collaborator record
    await ctx.db.insert("submissionCollaborators", {
      submissionId: args.submissionId,
      userId: args.userId,
      invitedBy: user._id,
      role: args.role === "lead" ? "lead" : "collaborator",
      revenueSplitPct: args.revenueSplitPct,
      status: "pending",
    });

    // Create notification for the invited user
    const invitedUser = await ctx.db.get(args.userId);
    if (invitedUser) {
      await insertNotification(ctx, {
        userId: args.userId,
        type: "team_invite",
        title: "Team Invitation",
        body: `${user.fullName} invited you to collaborate on "${submission.title}"`,
        actionUrl: `/pitches/${submission._id}`,
      });
    }
  },
});

/**
 * Respond to a team invitation (accept or decline).
 */
export const respond = mutation({
  args: {
    collaboratorId: v.id("submissionCollaborators"),
    accept: v.boolean(),
  },
  handler: async (ctx, args) => {
    const user = await getAuthUser(ctx);

    const collaborator = await ctx.db.get(args.collaboratorId);
    if (!collaborator) {
      throw new Error("Invitation not found");
    }
    if (collaborator.userId !== user._id) {
      throw new Error("This invitation is not for you");
    }
    if (collaborator.status !== "pending") {
      throw new Error("Invitation has already been responded to");
    }

    // Update status
    await ctx.db.patch(args.collaboratorId, {
      status: args.accept ? "accepted" : "declined",
      ...(args.accept ? { acceptedAt: Date.now() } : {}),
    });

    // Notify the team lead about the response
    const submission = await ctx.db.get(collaborator.submissionId);
    if (submission) {
      await insertNotification(ctx, {
        userId: submission.userId,
        type: "team_response",
        title: args.accept ? "Invitation Accepted" : "Invitation Declined",
        body: `${user.fullName} ${args.accept ? "accepted" : "declined"} your invitation to collaborate on "${submission.title}"`,
        actionUrl: `/pitches/${submission._id}`,
      });
    }
  },
});

/**
 * List pending invitations for the current user.
 */
export const listMyInvitations = query({
  args: {},
  handler: async (ctx) => {
    const user = await getAuthUser(ctx);

    const collaborators = await ctx.db
      .query("submissionCollaborators")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .collect();

    // Filter to pending only
    const pending = collaborators.filter((c) => c.status === "pending");

    const withDetails = await Promise.all(
      pending.map(async (collab) => {
        const submission = await ctx.db.get(collab.submissionId);
        if (!submission) return null;

        const leadUser = await ctx.db.get(submission.userId);

        const aiScore = await ctx.db
          .query("aiScores")
          .withIndex("by_submissionId", (q) => q.eq("submissionId", collab.submissionId))
          .first();

        const allCollaborators = await ctx.db
          .query("submissionCollaborators")
          .withIndex("by_submissionId", (q) => q.eq("submissionId", collab.submissionId))
          .collect();

        const teamWithUsers = await Promise.all(
          allCollaborators.map(async (tc) => {
            const tcUser = await ctx.db.get(tc.userId);
            return {
              _id: tc._id,
              name: tcUser?.fullName ?? "Unknown",
              role: tc.role,
              splitPct: tc.revenueSplitPct,
              status: tc.status,
            };
          })
        );

        return {
          ...collab,
          submission: {
            ...submission,
            aiScore: aiScore ?? undefined,
          },
          teamMemberCount: 1 + allCollaborators.length,
          lead: {
            name: leadUser?.fullName ?? "Unknown",
            school: leadUser?.schoolName ?? "Unknown",
          },
          team: teamWithUsers,
        };
      })
    );

    // Filter out nulls and sort newest first
    return withDetails
      .filter((item): item is NonNullable<typeof item> => item !== null)
      .sort((a, b) => b._creationTime - a._creationTime);
  },
});

/**
 * Get all collaborators for a submission with user info.
 */
export const getBySubmission = query({
  args: { submissionId: v.id("submissions") },
  handler: async (ctx, args) => {
    await getAuthUser(ctx);
    const collaborators = await ctx.db
      .query("submissionCollaborators")
      .withIndex("by_submissionId", (q) => q.eq("submissionId", args.submissionId))
      .collect();

    const withUsers = await Promise.all(
      collaborators.map(async (c) => {
        const user = await ctx.db.get(c.userId);
        return {
          ...c,
          user: user ? toPublicUser(user) : null,
        };
      })
    );

    return withUsers;
  },
});
