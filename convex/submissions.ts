import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUser, toPublicUser } from "./helpers";
import { requireOwnedUpload } from "./storage";

/**
 * List the current user's submissions with AI scores.
 */
export const listMine = query({
  args: {},
  handler: async (ctx) => {
    const user = await getAuthUser(ctx);
    const submissions = await ctx.db
      .query("submissions")
      .withIndex("by_userId_monthYear", (q) => q.eq("userId", user._id))
      .order("desc")
      .collect();

    const withScores = await Promise.all(
      submissions.map(async (sub) => {
        const score = await ctx.db
          .query("aiScores")
          .withIndex("by_submissionId", (q) => q.eq("submissionId", sub._id))
          .first();
        const collabs = await ctx.db
          .query("submissionCollaborators")
          .withIndex("by_submissionId", (q) => q.eq("submissionId", sub._id))
          .collect();
        return {
          ...sub,
          aiScore: score ?? undefined,
          teamMemberCount: 1 + collabs.length,
        };
      })
    );

    return withScores;
  },
});

/**
 * Get a submission by ID with full details (user, AI score, collaborators).
 */
export const getById = query({
  args: { submissionId: v.id("submissions") },
  handler: async (ctx, args) => {
    const viewer = await getAuthUser(ctx);
    const submission = await ctx.db.get(args.submissionId);
    if (!submission) return null;

    const user = await ctx.db.get(submission.userId);

    const aiScore = await ctx.db
      .query("aiScores")
      .withIndex("by_submissionId", (q) => q.eq("submissionId", args.submissionId))
      .first();

    const collaborators = await ctx.db
      .query("submissionCollaborators")
      .withIndex("by_submissionId", (q) => q.eq("submissionId", args.submissionId))
      .collect();

    const collaboratorsWithUsers = await Promise.all(
      collaborators.map(async (c) => {
        const collabUser = await ctx.db.get(c.userId);
        return { ...c, user: collabUser ? toPublicUser(collabUser) : null };
      })
    );

    const allVotes = await ctx.db.query("votes").collect();
    const voteCount = allVotes.filter(
      (v) => v.submissionId === args.submissionId
    ).length;

    const viewerCollaborator = collaboratorsWithUsers.find(
      (c) => c.userId === viewer._id
    );

    const sumCollaboratorPct = collaboratorsWithUsers.reduce(
      (s, c) => s + c.revenueSplitPct,
      0
    );
    const leadPct = Math.max(0, 100 - sumCollaboratorPct);
    const revenueSplitBreakdown =
      submission.isTeamSubmission || collaboratorsWithUsers.length > 0
        ? {
            lead: {
              userId: submission.userId,
              name: user?.fullName ?? "Lead",
              pct: leadPct,
            },
            collaborators: collaboratorsWithUsers.map((c) => ({
              _id: c._id,
              userId: c.userId,
              name: c.user?.fullName ?? "Unknown",
              pct: c.revenueSplitPct,
              status: c.status,
              role: c.role,
            })),
          }
        : null;

    return {
      ...submission,
      user: user
        ? {
            _id: user._id,
            fullName: user.fullName,
            schoolName: user.schoolName,
            avatarStorageId: user.avatarStorageId,
            avatarUrl: user.avatarStorageId
              ? await ctx.storage.getUrl(user.avatarStorageId)
              : null,
          }
        : null,
      aiScore: aiScore ?? undefined,
      collaborators: collaboratorsWithUsers,
      voteCount,
      viewerCollaborator: viewerCollaborator
        ? {
            _id: viewerCollaborator._id,
            status: viewerCollaborator.status,
            revenueSplitPct: viewerCollaborator.revenueSplitPct,
            role: viewerCollaborator.role,
          }
        : undefined,
      revenueSplitBreakdown,
    };
  },
});

/**
 * List all submitted/scored submissions for a given month.
 */
export const listByMonth = query({
  args: { monthYear: v.string() },
  handler: async (ctx, args) => {
    const submissions = await ctx.db
      .query("submissions")
      .withIndex("by_monthYear_status", (q) => q.eq("monthYear", args.monthYear))
      .collect();

    // Filter to only submitted/scored, attach user + score
    const result = await Promise.all(
      submissions
        .filter((s) => s.status === "submitted" || s.status === "scored")
        .map(async (sub) => {
          const user = await ctx.db.get(sub.userId);
          const score = await ctx.db
            .query("aiScores")
            .withIndex("by_submissionId", (q) => q.eq("submissionId", sub._id))
            .first();
          return {
            ...sub,
            user: user ? {
              _id: user._id,
              fullName: user.fullName,
              schoolName: user.schoolName,
              avatarUrl: user.avatarStorageId ? await ctx.storage.getUrl(user.avatarStorageId) : null,
            } : null,
            aiScore: score ?? undefined,
          };
        })
    );

    return result;
  },
});

/**
 * List all submitted/scored submissions across all months, with optional search.
 * Used by the Explore page.
 */
export const listAll = query({
  args: { search: v.optional(v.string()) },
  handler: async (ctx, args) => {
    // Bounded read of the most recent submissions, then JS-filter to the
    // statuses Explore actually shows. 200 is enough headroom that the
    // final 50-item slice fills up under realistic seed/staging scale.
    // TODO: when status mix shifts past that ratio, add a by_status index
    // and union two indexed queries (submitted + scored).
    const submissions = await ctx.db
      .query("submissions")
      .order("desc")
      .take(200);

    let filtered = submissions.filter(
      (s) => s.status === "submitted" || s.status === "scored"
    );

    if (args.search && args.search.trim() !== "") {
      const q = args.search.toLowerCase();
      // Pre-fetch user names for filtering
      const userMap = new Map<string, string>();
      for (const sub of filtered) {
        if (!userMap.has(sub.userId as string)) {
          const user = await ctx.db.get(sub.userId);
          userMap.set(sub.userId as string, user?.fullName ?? "");
        }
      }
      filtered = filtered.filter((s) => {
        const userName = userMap.get(s.userId as string) ?? "";
        return (
          s.title.toLowerCase().includes(q) ||
          s.description.toLowerCase().includes(q) ||
          userName.toLowerCase().includes(q)
        );
      });
    }

    // Limit to 50 for performance
    const limited = filtered.slice(0, 50);

    const result = await Promise.all(
      limited.map(async (sub) => {
        const user = await ctx.db.get(sub.userId);
        const score = await ctx.db
          .query("aiScores")
          .withIndex("by_submissionId", (q) => q.eq("submissionId", sub._id))
          .first();
        return {
          ...sub,
          user: user
            ? {
                _id: user._id,
                fullName: user.fullName,
                schoolName: user.schoolName,
                avatarUrl: user.avatarStorageId
                  ? await ctx.storage.getUrl(user.avatarStorageId)
                  : null,
              }
            : null,
          aiScore: score ?? undefined,
        };
      })
    );

    return result;
  },
});

/**
 * Create a new draft submission.
 */
export const create = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    videoStorageId: v.optional(v.id("_storage")),
    videoUrl: v.optional(v.string()),
    githubUrl: v.optional(v.string()),
    websiteUrl: v.optional(v.string()),
    slideDeckUrl: v.optional(v.string()),
    additionalLinks: v.optional(v.any()),
    monthYear: v.string(),
    isTeamSubmission: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const user = await getAuthUser(ctx);

    // Resolve video URL from storage if a storageId was provided.
    // Ownership-check the storage ID first so a user can't attach a
    // video uploaded by someone else.
    let videoUrl = args.videoUrl;
    if (args.videoStorageId) {
      await requireOwnedUpload(
        ctx,
        args.videoStorageId,
        user._id,
        "submission_video"
      );
      videoUrl = (await ctx.storage.getUrl(args.videoStorageId)) ?? undefined;
    }

    return await ctx.db.insert("submissions", {
      userId: user._id,
      title: args.title,
      description: args.description,
      videoUrl,
      videoStorageId: args.videoStorageId,
      githubUrl: args.githubUrl,
      websiteUrl: args.websiteUrl,
      slideDeckUrl: args.slideDeckUrl,
      additionalLinks: args.additionalLinks,
      monthYear: args.monthYear,
      status: "draft",
      isTeamSubmission: args.isTeamSubmission ?? false,
    });
  },
});

/**
 * Update a draft submission.
 */
export const update = mutation({
  args: {
    submissionId: v.id("submissions"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    videoUrl: v.optional(v.string()),
    githubUrl: v.optional(v.string()),
    websiteUrl: v.optional(v.string()),
    slideDeckUrl: v.optional(v.string()),
    additionalLinks: v.optional(v.any()),
    isTeamSubmission: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const user = await getAuthUser(ctx);
    const submission = await ctx.db.get(args.submissionId);
    if (!submission || submission.userId !== user._id) {
      throw new Error("Submission not found");
    }
    if (submission.status !== "draft") {
      throw new Error("Can only edit draft submissions");
    }

    const { submissionId, ...updates } = args;
    const filtered: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) filtered[key] = value;
    }
    if (Object.keys(filtered).length > 0) {
      await ctx.db.patch(submissionId, filtered);
    }
  },
});

/**
 * Submit a draft submission (changes status to "submitted").
 */
export const submit = mutation({
  args: { submissionId: v.id("submissions") },
  handler: async (ctx, args) => {
    const user = await getAuthUser(ctx);
    const submission = await ctx.db.get(args.submissionId);
    if (!submission || submission.userId !== user._id) {
      throw new Error("Submission not found");
    }
    if (submission.status !== "draft") {
      throw new Error("Submission already submitted");
    }
    await ctx.db.patch(args.submissionId, { status: "submitted" });
  },
});
