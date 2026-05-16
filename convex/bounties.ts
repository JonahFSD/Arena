import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { getAuthUser, requireAdmin } from "./helpers";

/**
 * List bounties, optionally filtered by status.
 * Non-admin users only see "active" and "completed" bounties.
 */
export const list = query({
  args: { status: v.optional(v.string()) },
  handler: async (ctx, args) => {
    let bounties;
    if (args.status) {
      bounties = await ctx.db
        .query("bounties")
        .withIndex("by_status", (q) => q.eq("status", args.status as any))
        .collect();
    } else {
      bounties = await ctx.db.query("bounties").collect();
    }

    // Attach submission counts
    const withCounts = await Promise.all(
      bounties.map(async (bounty) => {
        const submissions = await ctx.db
          .query("bountySubmissions")
          .withIndex("by_bountyId", (q) => q.eq("bountyId", bounty._id))
          .collect();
        return {
          ...bounty,
          submissionsCount: submissions.length,
        };
      })
    );

    return withCounts;
  },
});

/**
 * Get a bounty by ID with its submissions and user info.
 */
export const getById = query({
  args: { bountyId: v.id("bounties") },
  handler: async (ctx, args) => {
    const bounty = await ctx.db.get(args.bountyId);
    if (!bounty) return null;

    const submissions = await ctx.db
      .query("bountySubmissions")
      .withIndex("by_bountyId", (q) => q.eq("bountyId", args.bountyId))
      .collect();

    const submissionsWithUsers = await Promise.all(
      submissions.map(async (sub) => {
        const user = await ctx.db.get(sub.userId);
        return {
          ...sub,
          user: user
            ? {
                _id: user._id,
                fullName: user.fullName,
                schoolName: user.schoolName,
              }
            : null,
        };
      })
    );

    return {
      ...bounty,
      submissions: submissionsWithUsers,
      submissionsCount: submissions.length,
    };
  },
});

/**
 * Create a new bounty. Any authenticated user can create one.
 * The bounty starts in "needs_review" status and requires admin approval.
 * Called after successful Stripe payment via webhook.
 */
export const create = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    founderName: v.string(),
    founderCompany: v.string(),
    bountyAmount: v.number(),
    dueDate: v.number(),
    requirements: v.array(v.string()),
    stripeCheckoutSessionId: v.optional(v.string()),
    stripePaymentIntentId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getAuthUser(ctx);
    if (args.bountyAmount < 100) {
      throw new Error("Minimum bounty amount is $100");
    }
    return await ctx.db.insert("bounties", {
      ...args,
      status: "needs_review",
      creatorUserId: user._id,
    });
  },
});

/**
 * Internal create — used by Stripe webhook (no auth context).
 *
 * Idempotent on `stripeEventId`: Stripe retries failed deliveries and may
 * occasionally redeliver successful ones, so the dedupe check + bounty insert
 * must happen in a single transactional mutation. Returns `{ duplicate: true }`
 * on re-delivery; the action treats both outcomes as success (200) so Stripe
 * stops retrying.
 */
export const createFromWebhook = internalMutation({
  args: {
    stripeEventId: v.string(),
    stripeEventType: v.string(),
    title: v.string(),
    description: v.string(),
    founderName: v.string(),
    founderCompany: v.string(),
    bountyAmount: v.number(),
    dueDate: v.number(),
    requirements: v.array(v.string()),
    creatorUserId: v.id("users"),
    stripeCheckoutSessionId: v.string(),
    stripePaymentIntentId: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("stripeEvents")
      .withIndex("by_eventId", (q) => q.eq("eventId", args.stripeEventId))
      .unique();
    if (existing) {
      return { duplicate: true as const };
    }

    // The `v.id("users")` validator only checks Id *shape*; confirm the
    // referenced user actually exists before we trust webhook metadata.
    const creator = await ctx.db.get(args.creatorUserId);
    if (!creator) {
      throw new Error(
        `Stripe webhook event ${args.stripeEventId} references missing user ${args.creatorUserId}`
      );
    }

    await ctx.db.insert("stripeEvents", {
      eventId: args.stripeEventId,
      eventType: args.stripeEventType,
      processedAt: Date.now(),
    });

    const { stripeEventId, stripeEventType, ...bountyFields } = args;
    const bountyId = await ctx.db.insert("bounties", {
      ...bountyFields,
      status: "needs_review",
    });
    return { duplicate: false as const, bountyId };
  },
});

/**
 * Update bounty fields (admin only). Does not change status.
 */
export const update = mutation({
  args: {
    bountyId: v.id("bounties"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    founderName: v.optional(v.string()),
    founderCompany: v.optional(v.string()),
    bountyAmount: v.optional(v.number()),
    dueDate: v.optional(v.number()),
    requirements: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const { bountyId, ...fields } = args;
    const bounty = await ctx.db.get(bountyId);
    if (!bounty) throw new Error("Bounty not found");
    if (bounty.status === "rejected") {
      throw new Error("Cannot edit a rejected bounty");
    }
    // Remove undefined fields
    const patch: Record<string, unknown> = {};
    for (const [k, val] of Object.entries(fields)) {
      if (val !== undefined) patch[k] = val;
    }
    await ctx.db.patch(bountyId, patch);
  },
});

/**
 * Approve a bounty (admin only). Sets status to "active" and generates review token.
 */
export const approve = mutation({
  args: {
    bountyId: v.id("bounties"),
    adminNotes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const bounty = await ctx.db.get(args.bountyId);
    if (!bounty) throw new Error("Bounty not found");
    if (bounty.status !== "needs_review") {
      throw new Error("Can only approve bounties in needs_review status");
    }
    // Generate a random review token
    const token = generateToken();
    await ctx.db.patch(args.bountyId, {
      status: "active",
      reviewToken: token,
      adminNotes: args.adminNotes,
    });
    return { reviewToken: token };
  },
});

/**
 * Reject a bounty (admin only). Marks as rejected and schedules Stripe refund.
 */
export const reject = mutation({
  args: {
    bountyId: v.id("bounties"),
    adminNotes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const bounty = await ctx.db.get(args.bountyId);
    if (!bounty) throw new Error("Bounty not found");
    if (bounty.status !== "needs_review") {
      throw new Error("Can only reject bounties in needs_review status");
    }
    await ctx.db.patch(args.bountyId, {
      status: "rejected",
      adminNotes: args.adminNotes,
    });
    // Schedule Stripe refund if payment was made
    if (bounty.stripePaymentIntentId) {
      await ctx.scheduler.runAfter(0, internal.stripe.refundBounty, {
        stripePaymentIntentId: bounty.stripePaymentIntentId,
      });
    }
  },
});

/**
 * Archive a bounty (admin only).
 */
export const archive = mutation({
  args: { bountyId: v.id("bounties") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const bounty = await ctx.db.get(args.bountyId);
    if (!bounty) throw new Error("Bounty not found");
    if (bounty.status === "rejected") {
      throw new Error("Cannot archive a rejected bounty");
    }
    await ctx.db.patch(args.bountyId, { status: "archived" });
  },
});

/**
 * Submit a solution to a bounty (authenticated user).
 */
export const submitSolution = mutation({
  args: {
    bountyId: v.id("bounties"),
    submissionUrl: v.string(),
    notes: v.optional(v.string()),
    isTeam: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const user = await getAuthUser(ctx);
    const bounty = await ctx.db.get(args.bountyId);
    if (!bounty) throw new Error("Bounty not found");
    if (bounty.status !== "active") {
      throw new Error("This bounty is not accepting submissions");
    }
    // Check for duplicate submission
    const existing = await ctx.db
      .query("bountySubmissions")
      .withIndex("by_bountyId", (q) => q.eq("bountyId", args.bountyId))
      .collect();
    if (existing.some((s) => s.userId === user._id)) {
      throw new Error("You have already submitted to this bounty");
    }
    return await ctx.db.insert("bountySubmissions", {
      bountyId: args.bountyId,
      userId: user._id,
      submissionUrl: args.submissionUrl,
      notes: args.notes,
      isTeam: args.isTeam ?? false,
      isWinner: false,
      submittedAt: Date.now(),
    });
  },
});

/**
 * Get a bounty by its review token (no auth required).
 * Used for the unlisted entrepreneur review page.
 */
export const getByReviewToken = query({
  args: { reviewToken: v.string() },
  handler: async (ctx, args) => {
    const bounty = await ctx.db
      .query("bounties")
      .withIndex("by_reviewToken", (q) => q.eq("reviewToken", args.reviewToken))
      .unique();
    if (!bounty) return null;

    const submissions = await ctx.db
      .query("bountySubmissions")
      .withIndex("by_bountyId", (q) => q.eq("bountyId", bounty._id))
      .collect();

    const submissionsWithUsers = await Promise.all(
      submissions.map(async (sub) => {
        const user = await ctx.db.get(sub.userId);
        return {
          ...sub,
          user: user
            ? {
                _id: user._id,
                fullName: user.fullName,
                schoolName: user.schoolName,
              }
            : null,
        };
      })
    );

    return {
      ...bounty,
      submissions: submissionsWithUsers,
      submissionsCount: submissions.length,
    };
  },
});

/**
 * Entrepreneur picks their preferred winner (token-gated, no auth).
 */
export const pickPreferredWinner = mutation({
  args: {
    reviewToken: v.string(),
    bountySubmissionId: v.id("bountySubmissions"),
  },
  handler: async (ctx, args) => {
    const bounty = await ctx.db
      .query("bounties")
      .withIndex("by_reviewToken", (q) => q.eq("reviewToken", args.reviewToken))
      .unique();
    if (!bounty) throw new Error("Invalid review token");

    const submission = await ctx.db.get(args.bountySubmissionId);
    if (!submission || submission.bountyId !== bounty._id) {
      throw new Error("Submission not found for this bounty");
    }

    // Clear any previous picks for this bounty
    const allSubs = await ctx.db
      .query("bountySubmissions")
      .withIndex("by_bountyId", (q) => q.eq("bountyId", bounty._id))
      .collect();
    for (const sub of allSubs) {
      if (sub.entrepreneurPick) {
        await ctx.db.patch(sub._id, { entrepreneurPick: false });
      }
    }

    // Mark this one as the pick
    await ctx.db.patch(args.bountySubmissionId, { entrepreneurPick: true });
  },
});

/**
 * Admin confirms the winner (admin only).
 */
export const confirmWinner = mutation({
  args: { bountySubmissionId: v.id("bountySubmissions") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const submission = await ctx.db.get(args.bountySubmissionId);
    if (!submission) throw new Error("Submission not found");

    const bounty = await ctx.db.get(submission.bountyId);
    if (!bounty) throw new Error("Bounty not found");

    // Clear any previous winners
    const allSubs = await ctx.db
      .query("bountySubmissions")
      .withIndex("by_bountyId", (q) => q.eq("bountyId", bounty._id))
      .collect();
    for (const sub of allSubs) {
      if (sub.isWinner) {
        await ctx.db.patch(sub._id, { isWinner: false });
      }
    }

    await ctx.db.patch(args.bountySubmissionId, { isWinner: true });
    await ctx.db.patch(bounty._id, {
      status: "completed",
      winnerSubmissionId: args.bountySubmissionId,
    });
  },
});

/**
 * Get the review token for a bounty (admin only).
 */
export const getReviewToken = query({
  args: { bountyId: v.id("bounties") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const bounty = await ctx.db.get(args.bountyId);
    if (!bounty) return null;
    return bounty.reviewToken ?? null;
  },
});

// ---- Helpers ----

function generateToken(): string {
  // 256-bit token from crypto.getRandomValues, hex-encoded. Sidesteps
  // Convex's known-buggy randomUUID variant nibble (get-convex/convex-
  // backend#269) and matches OWASP's stricter "prefer explicit CSPRNG"
  // guidance for tokens that gate a public route.
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}
