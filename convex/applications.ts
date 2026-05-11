import { query, mutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { requireAdmin } from "./helpers";

/**
 * Submit a new application. No auth required (public form).
 */
export const submitApplication = mutation({
  args: {
    userEmail: v.string(),
    fullName: v.string(),
    birthdate: v.string(),
    school: v.string(),
    graduationYear: v.number(),
    faithStatement: v.string(),
    parentFirstName: v.string(),
    parentLastName: v.string(),
    parentRelation: v.string(),
    parentEmail: v.string(),
    parentPhone: v.string(),
    referralCode: v.optional(v.string()),
    /** v1: an opaque string passed via /apply?n=TOKEN. Stored for audit only. */
    nominationToken: v.optional(v.string()),
    // Profile fields
    phone: v.optional(v.string()),
    city: v.optional(v.string()),
    state: v.optional(v.string()),
    skills: v.optional(v.array(v.string())),
    tools: v.optional(v.array(v.string())),
    linkedinUrl: v.optional(v.string()),
    portfolioUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if a user account already exists with this email
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.userEmail))
      .first();
    if (existingUser) {
      throw new Error("An account with this email already exists. Please sign in instead.");
    }

    // Check if this email already has a pending or approved application
    const existingApp = await ctx.db
      .query("applications")
      .withIndex("by_email", (q) => q.eq("userEmail", args.userEmail))
      .first();
    if (existingApp && (existingApp.status === "pending" || existingApp.status === "approved")) {
      throw new Error(
        existingApp.status === "pending"
          ? "An application for this email is already pending review."
          : "An application for this email has already been approved. Please sign in."
      );
    }

    return await ctx.db.insert("applications", {
      ...args,
      status: "pending",
    });
  },
});

/**
 * List pending applications (admin only).
 */
export const listPending = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return await ctx.db
      .query("applications")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .order("desc")
      .collect();
  },
});

/**
 * List all applications by status (admin only).
 */
export const listByStatus = query({
  args: { status: v.string() },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    return await ctx.db
      .query("applications")
      .withIndex("by_status", (q) => q.eq("status", args.status as any))
      .order("desc")
      .collect();
  },
});

/**
 * Review an application — approve, reject, or request more info (admin only).
 */
export const reviewApplication = mutation({
  args: {
    applicationId: v.id("applications"),
    decision: v.union(
      v.literal("approved"),
      v.literal("rejected"),
      v.literal("more_info")
    ),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);

    const application = await ctx.db.get(args.applicationId);
    if (!application) throw new Error("Application not found");

    await ctx.db.patch(args.applicationId, {
      status: args.decision,
      reviewerId: admin._id,
      reviewerNotes: args.notes,
      reviewedAt: Date.now(),
    });

    // If approved, create a user account (if one doesn't exist)
    if (args.decision === "approved") {
      const existingUser = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", application.userEmail))
        .first();

      // Look up referrer first so we can set referredBy on the new user
      let referrer = null;
      if (application.referralCode) {
        referrer = await ctx.db
          .query("users")
          .withIndex("by_referralCode", (q) =>
            q.eq("referralCode", application.referralCode)
          )
          .first();
      }

      if (!existingUser) {
        // Calculate age from birthdate if available
        const age = application.birthdate
          ? Math.floor((Date.now() - new Date(application.birthdate).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
          : application.age ?? 0;
        await ctx.db.insert("users", {
          email: application.userEmail,
          fullName: application.fullName,
          schoolName: application.school,
          graduationYear: application.graduationYear,
          age,
          role: "member",
          skills: application.skills ?? [],
          tools: application.tools,
          lookingForCofounders: false,
          points: 0,
          totalEarnings: 0,
          networkCount: 0,
          city: application.city,
          state: application.state,
          phone: application.phone,
          ...(referrer ? { referredBy: referrer._id } : {}),
        });
      }

      // Award referrer 500 points (all-time + monthly)
      if (referrer) {
        await ctx.db.patch(referrer._id, {
          points: (referrer.points ?? 0) + 500,
          pointsThisMonth: (referrer.pointsThisMonth ?? 0) + 500,
        });
      }
    }

    // Send email notification for approval/rejection
    if (args.decision === "approved") {
      await ctx.scheduler.runAfter(0, internal.email.sendNotification, {
        to: application.userEmail,
        recipientName: application.fullName.split(" ")[0],
        subject: "Welcome to ACU Youth Venture!",
        heading: "Your application has been approved!",
        body: "Congratulations! You've been accepted into the ACU Youth Venture community. Sign in to get started with your first pitch submission.",
        ctaLabel: "Sign In",
        ctaUrl: "/login",
      });
    } else if (args.decision === "rejected") {
      await ctx.scheduler.runAfter(0, internal.email.sendNotification, {
        to: application.userEmail,
        recipientName: application.fullName.split(" ")[0],
        subject: "ACU Youth Venture Application Update",
        heading: "Application update",
        body: "Thank you for your interest in ACU Youth Venture. Unfortunately, we are unable to offer you a spot at this time. We encourage you to apply again in the future.",
      });
    }

    // Log the action
    await ctx.db.insert("auditLog", {
      adminUserId: admin._id,
      action: `application.${args.decision}`,
      targetType: "application",
      targetId: args.applicationId,
      metadata: {
        applicantEmail: application.userEmail,
        notes: args.notes,
      },
    });
  },
});
