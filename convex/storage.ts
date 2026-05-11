import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUser } from "./helpers";

/**
 * Generate a presigned upload URL for file storage.
 * Client uploads the file directly to this URL.
 */
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await getAuthUser(ctx); // Require auth
    return await ctx.storage.generateUploadUrl();
  },
});

/**
 * Get a serving URL for a stored file.
 */
export const getUrl = query({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.storageId);
  },
});
