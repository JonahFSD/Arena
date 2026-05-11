import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUser, requireAdmin } from "./helpers";
import { internal } from "./_generated/api";

/**
 * List all leadership positions, grouped by type.
 */
export const list = query({
  args: {},
  handler: async (ctx) => {
    const positions = await ctx.db.query("leadershipPositions").collect();

    // Resolve avatar URLs for linked users
    const withAvatars = await Promise.all(
      positions.map(async (pos) => {
        let avatarUrl: string | null = null;
        if (pos.userId) {
          const user = await ctx.db.get(pos.userId);
          if (user?.avatarStorageId) {
            avatarUrl = await ctx.storage.getUrl(user.avatarStorageId);
          }
        }
        return { ...pos, avatarUrl };
      })
    );

    const executives = withAvatars
      .filter((p) => p.type === "executive")
      .sort((a, b) => a.sortOrder - b.sortOrder);
    const regionalDirectors = withAvatars
      .filter((p) => p.type === "regional_director")
      .sort((a, b) => a.sortOrder - b.sortOrder);
    const ambassadors = withAvatars
      .filter((p) => p.type === "ambassador")
      .sort((a, b) => (a.state ?? "").localeCompare(b.state ?? ""));

    return { executives, regionalDirectors, ambassadors };
  },
});

/**
 * Create a leadership position (admin only).
 */
export const create = mutation({
  args: {
    type: v.union(
      v.literal("executive"),
      v.literal("regional_director"),
      v.literal("ambassador")
    ),
    name: v.string(),
    userId: v.optional(v.id("users")),
    role: v.string(),
    region: v.optional(v.string()),
    state: v.optional(v.string()),
    school: v.optional(v.string()),
    graduation: v.optional(v.number()),
    company: v.optional(v.string()),
    jobTitle: v.optional(v.string()),
    sortOrder: v.number(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    return await ctx.db.insert("leadershipPositions", args);
  },
});

/**
 * Update a leadership position (admin only).
 */
export const update = mutation({
  args: {
    positionId: v.id("leadershipPositions"),
    name: v.optional(v.string()),
    userId: v.optional(v.id("users")),
    clearUserId: v.optional(v.boolean()),
    role: v.optional(v.string()),
    region: v.optional(v.string()),
    state: v.optional(v.string()),
    school: v.optional(v.string()),
    graduation: v.optional(v.number()),
    company: v.optional(v.string()),
    jobTitle: v.optional(v.string()),
    sortOrder: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const { positionId, clearUserId, ...updates } = args;
    const filtered: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) filtered[key] = value;
    }
    if (clearUserId) {
      filtered.userId = undefined;
    }
    if (Object.keys(filtered).length > 0) {
      await ctx.db.patch(positionId, filtered);
    }
  },
});

/**
 * Remove a leadership position (admin only).
 */
export const remove = mutation({
  args: { positionId: v.id("leadershipPositions") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    await ctx.db.delete(args.positionId);
  },
});

/**
 * Submit an ambassador application (authenticated members).
 */
export const submitAmbassadorApplication = mutation({
  args: {
    state: v.string(),
    whyStatement: v.string(),
    leadershipExperience: v.string(),
    city: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getAuthUser(ctx);

    // Check for existing pending application
    const existing = await ctx.db
      .query("ambassadorApplications")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .collect();
    const hasPending = existing.some((a) => a.status === "pending");
    if (hasPending) {
      throw new Error("You already have a pending ambassador application.");
    }

    const appId = await ctx.db.insert("ambassadorApplications", {
      userId: user._id,
      state: args.state,
      whyStatement: args.whyStatement,
      leadershipExperience: args.leadershipExperience,
      city: args.city,
      status: "pending",
    });

    // Notify all admins
    const admins = await ctx.db
      .query("users")
      .withIndex("by_role", (q) => q.eq("role", "admin"))
      .collect();
    const superadmins = await ctx.db
      .query("users")
      .withIndex("by_role", (q) => q.eq("role", "superadmin"))
      .collect();

    for (const admin of [...admins, ...superadmins]) {
      await ctx.scheduler.runAfter(0, internal.notifications.create, {
        userId: admin._id,
        type: "ambassador_application",
        title: "New Ambassador Application",
        body: `${user.fullName} applied for ${args.state} Ambassador.`,
        actionUrl: "/admin/applications",
      });
    }

    return appId;
  },
});
