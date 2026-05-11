import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { getAuthUser } from "./helpers";

/**
 * Get the currently authenticated user document.
 * Returns null if not authenticated (doesn't throw — used by layout guard).
 */
export const getMe = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    return await ctx.db.get(userId);
  },
});

/**
 * Get a user's public profile by ID.
 */
export const getById = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return null;
    // Strip internal fields, resolve avatar URL
    const { authSubject, ...publicProfile } = user;
    const avatarUrl = user.avatarStorageId
      ? await ctx.storage.getUrl(user.avatarStorageId)
      : null;
    return { ...publicProfile, avatarUrl };
  },
});

/**
 * Get the current user's stats for the dashboard.
 */
export const getMyStats = query({
  args: {},
  handler: async (ctx) => {
    const user = await getAuthUser(ctx);

    // Calculate rank: count users with more points
    const allUsers = await ctx.db.query("users").collect();
    const userPoints = user.points ?? 0;
    const rank =
      allUsers.filter((u) => (u.points ?? 0) > userPoints).length + 1;

    return {
      points: user.points ?? 0,
      totalEarnings: user.totalEarnings ?? 0,
      networkCount: user.networkCount ?? 0,
      rank,
    };
  },
});

/**
 * List all members, optionally filtered by search string.
 */
export const listMembers = query({
  args: { search: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const allUsers = await ctx.db.query("users").collect();

    let members = allUsers.filter(
      (u) => u.role === "member" || u.role === "admin" || u.role === "superadmin"
    );

    if (args.search && args.search.trim() !== "") {
      const searchLower = args.search.toLowerCase();
      members = members.filter(
        (u) =>
          u.fullName.toLowerCase().includes(searchLower) ||
          (u.email && u.email.toLowerCase().includes(searchLower)) ||
          (u.schoolName && u.schoolName.toLowerCase().includes(searchLower))
      );
    }

    // Strip internal fields and resolve avatar URLs
    return await Promise.all(
      members.map(async ({ authSubject, ...rest }) => {
        const avatarUrl = rest.avatarStorageId
          ? await ctx.storage.getUrl(rest.avatarStorageId)
          : null;
        return { ...rest, avatarUrl };
      })
    );
  },
});

/**
 * Get top 10 leaderboard — by all-time points or this month’s points (excludes superadmin).
 */
export const getLeaderboard = query({
  args: {
    range: v.union(v.literal("allTime"), v.literal("thisMonth")),
  },
  handler: async (ctx, args) => {
    const allUsers = await ctx.db.query("users").collect();

    const score = (u: (typeof allUsers)[0]) =>
      args.range === "thisMonth"
        ? (u.pointsThisMonth ?? 0)
        : (u.points ?? 0);

    const top10 = allUsers
      .filter((u) => u.role !== "superadmin")
      .sort((a, b) => {
        const diff = score(b) - score(a);
        if (diff !== 0) return diff;
        return (b.points ?? 0) - (a.points ?? 0);
      })
      .slice(0, 10);

    const ranked = await Promise.all(
      top10.map(async (u, index) => {
        const { authSubject, ...rest } = u;
        const leaderboardPoints = score(u);
        const avatarUrl = u.avatarStorageId
          ? await ctx.storage.getUrl(u.avatarStorageId)
          : null;
        return {
          ...rest,
          rank: index + 1,
          leaderboardPoints,
          avatarUrl,
        };
      })
    );

    return ranked;
  },
});

/**
 * Get the current user's referral code (or null if not yet generated).
 */
export const getMyReferralCode = query({
  args: {},
  handler: async (ctx) => {
    const user = await getAuthUser(ctx);
    return user.referralCode ?? null;
  },
});

/**
 * Generate a unique referral code for the current user.
 * If one already exists, return it without creating a new one.
 */
export const generateReferralCode = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await getAuthUser(ctx);
    if (user.referralCode) return user.referralCode;

    const firstName = user.fullName.split(" ")[0].toUpperCase();
    const suffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    const code = `${firstName}-${suffix}`;

    await ctx.db.patch(user._id, { referralCode: code });
    return code;
  },
});

/**
 * Update the current user's avatar storage ID.
 */
export const updateAvatar = mutation({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    const user = await getAuthUser(ctx);
    await ctx.db.patch(user._id, { avatarStorageId: args.storageId });
  },
});

/**
 * Get the current user's notification preferences.
 */
export const getNotificationPreferences = query({
  args: {},
  handler: async (ctx) => {
    const user = await getAuthUser(ctx);
    return (
      user.notificationPreferences ?? {
        aiScoringEmail: true,
        aiScoringSms: true,
        votingRoundEmail: true,
        votingRoundSms: true,
        winnersEmail: true,
        winnersSms: true,
        monthlyRecapEmail: true,
        monthlyRecapSms: false,
        newMessagesEmail: true,
        newMessagesSms: true,
        communityUpdatesEmail: true,
        communityUpdatesSms: false,
      }
    );
  },
});

/**
 * Update the current user's notification preferences.
 */
export const updateNotificationPreferences = mutation({
  args: {
    preferences: v.object({
      aiScoringEmail: v.boolean(),
      aiScoringSms: v.boolean(),
      votingRoundEmail: v.boolean(),
      votingRoundSms: v.boolean(),
      winnersEmail: v.boolean(),
      winnersSms: v.boolean(),
      monthlyRecapEmail: v.boolean(),
      monthlyRecapSms: v.boolean(),
      newMessagesEmail: v.boolean(),
      newMessagesSms: v.boolean(),
      communityUpdatesEmail: v.boolean(),
      communityUpdatesSms: v.boolean(),
    }),
  },
  handler: async (ctx, args) => {
    const user = await getAuthUser(ctx);
    await ctx.db.patch(user._id, {
      notificationPreferences: args.preferences,
    });
  },
});

/**
 * Update the current user's profile.
 */
export const updateProfile = mutation({
  args: {
    fullName: v.optional(v.string()),
    bio: v.optional(v.string()),
    schoolName: v.optional(v.string()),
    graduationYear: v.optional(v.number()),
    age: v.optional(v.number()),
    city: v.optional(v.string()),
    state: v.optional(v.string()),
    skills: v.optional(v.array(v.string())),
    lookingForCofounders: v.optional(v.boolean()),
    bqType: v.optional(
      v.union(
        v.literal("Anchor"),
        v.literal("Visionary"),
        v.literal("Operator"),
        v.literal("Catalyst"),
        v.literal("Strategist"),
        v.literal("Builder")
      )
    ),
    bqResultsUrl: v.optional(v.string()),
    linkedinUrl: v.optional(v.string()),
    avatarStorageId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    const user = await getAuthUser(ctx);

    // Only patch fields that were provided
    const updates: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(args)) {
      if (value !== undefined) {
        updates[key] = value;
      }
    }

    if (Object.keys(updates).length > 0) {
      await ctx.db.patch(user._id, updates);
    }

    return user._id;
  },
});
