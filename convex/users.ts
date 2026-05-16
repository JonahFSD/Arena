import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { getAuthUser, toPublicUser } from "./helpers";
import type { Doc } from "./_generated/dataModel";
import { bqTypeValidator } from "./bqType";
import { requireOwnedUpload } from "./storage";

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
    await getAuthUser(ctx);
    const user = await ctx.db.get(args.userId);
    if (!user) return null;
    const avatarUrl = user.avatarStorageId
      ? await ctx.storage.getUrl(user.avatarStorageId)
      : null;
    return { ...toPublicUser(user), avatarUrl };
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
    const viewer = await getAuthUser(ctx);
    const isAdmin = viewer.role === "admin" || viewer.role === "superadmin";
    const allUsers = await ctx.db.query("users").collect();

    let members = allUsers.filter(
      (u) => u.role === "member" || u.role === "admin" || u.role === "superadmin"
    );

    // Email is searchable for admins (contact lookup) and remains
    // searchable for non-admins for backward compatibility — the result
    // strips email below, so it's only ever an internal predicate.
    if (args.search && args.search.trim() !== "") {
      const searchLower = args.search.toLowerCase();
      members = members.filter(
        (u) =>
          u.fullName.toLowerCase().includes(searchLower) ||
          (u.email && u.email.toLowerCase().includes(searchLower)) ||
          (u.schoolName && u.schoolName.toLowerCase().includes(searchLower))
      );
    }

    return await Promise.all(
      members.map(async (member) => {
        const avatarUrl = member.avatarStorageId
          ? await ctx.storage.getUrl(member.avatarStorageId)
          : null;
        return {
          ...toPublicUser(member),
          avatarUrl,
          // Admin tooling (e.g. admin/leadership) needs contact info to
          // attach members to leadership positions, send outreach, etc.
          ...(isAdmin && { email: member.email, phone: member.phone }),
        };
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
    await requireOwnedUpload(ctx, args.storageId, user._id, "avatar");
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
    bqType: v.optional(bqTypeValidator),
    bqResultsUrl: v.optional(v.string()),
    linkedinUrl: v.optional(v.string()),
    avatarStorageId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    const user = await getAuthUser(ctx);

    // Explicit allow-list — never patch fields from `args` by iteration.
    // Adding a new editable field requires touching this block deliberately.
    const updates: Partial<Doc<"users">> = {};
    if (args.fullName !== undefined) updates.fullName = args.fullName;
    if (args.bio !== undefined) updates.bio = args.bio;
    if (args.schoolName !== undefined) updates.schoolName = args.schoolName;
    if (args.graduationYear !== undefined) updates.graduationYear = args.graduationYear;
    if (args.age !== undefined) updates.age = args.age;
    if (args.city !== undefined) updates.city = args.city;
    if (args.state !== undefined) updates.state = args.state;
    if (args.skills !== undefined) updates.skills = args.skills;
    if (args.lookingForCofounders !== undefined) updates.lookingForCofounders = args.lookingForCofounders;
    if (args.bqType !== undefined) updates.bqType = args.bqType;
    if (args.bqResultsUrl !== undefined) updates.bqResultsUrl = args.bqResultsUrl;
    if (args.linkedinUrl !== undefined) updates.linkedinUrl = args.linkedinUrl;
    if (args.avatarStorageId !== undefined) {
      await requireOwnedUpload(ctx, args.avatarStorageId, user._id, "avatar");
      updates.avatarStorageId = args.avatarStorageId;
    }

    if (Object.keys(updates).length > 0) {
      await ctx.db.patch(user._id, updates);
    }

    return user._id;
  },
});
