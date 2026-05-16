import { query, mutation } from "./_generated/server";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { v } from "convex/values";
import { getAuthUser } from "./helpers";

/**
 * Per-purpose MIME allow-lists and size caps. Enforced inside
 * registerUpload — files that fail validation are deleted from storage
 * and the call throws, so the upload can't be attached anywhere.
 */
const UPLOAD_RULES = {
  avatar: {
    mimeTypes: ["image/png", "image/jpeg", "image/webp", "image/gif"] as const,
    maxBytes: 5 * 1024 * 1024,
  },
  submission_video: {
    mimeTypes: ["video/mp4", "video/quicktime", "video/webm"] as const,
    maxBytes: 100 * 1024 * 1024,
  },
} as const;

export type UploadPurpose = keyof typeof UPLOAD_RULES;

const uploadPurposeValidator = v.union(
  v.literal("avatar"),
  v.literal("submission_video")
);

/**
 * Generate a presigned upload URL. Authenticated only — anonymous
 * users can't trigger uploads and consume storage quota.
 */
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await getAuthUser(ctx);
    return await ctx.storage.generateUploadUrl();
  },
});

/**
 * Record an uploaded file's ownership and metadata. Must be called
 * after the client POSTs to the presigned URL and before the storage
 * ID is attached to any user / submission row, so that downstream
 * mutations can verify the caller owns the upload they're attaching.
 *
 * On size/MIME validation failure the storage object is deleted and
 * the mutation returns `{ ok: false, error }` rather than throwing.
 * That distinction is load-bearing: Convex mutations roll back their
 * writes on throw, and storage operations are documented ambiguously
 * w.r.t. transactional rollback. Returning normally guarantees the
 * ctx.storage.delete commits regardless of which interpretation is
 * correct — orphan blobs can't linger because the validation rejected
 * them. Throws are reserved for genuinely unrecoverable cases (auth,
 * conflicting prior registration).
 *
 * Idempotent: re-calling with the same (storageId, caller, purpose)
 * short-circuits with `alreadyRegistered: true`.
 */
export const registerUpload = mutation({
  args: {
    storageId: v.id("_storage"),
    purpose: uploadPurposeValidator,
  },
  handler: async (
    ctx,
    args
  ): Promise<
    | { ok: true; alreadyRegistered: boolean }
    | { ok: false; error: string }
  > => {
    const user = await getAuthUser(ctx);

    const existing = await ctx.db
      .query("fileUploads")
      .withIndex("by_storageId", (q) => q.eq("storageId", args.storageId))
      .unique();
    if (existing) {
      if (existing.uploaderUserId !== user._id) {
        throw new Error("Storage ID is already claimed by another user");
      }
      if (existing.purpose !== args.purpose) {
        throw new Error(
          `Storage ID is already registered as ${existing.purpose}, not ${args.purpose}`
        );
      }
      return { ok: true, alreadyRegistered: true };
    }

    const metadata = await ctx.db.system.get(args.storageId);
    if (!metadata) {
      // Storage object doesn't exist — nothing to clean up, and the
      // client almost certainly has a bug (race or wrong ID). Throw
      // so the caller fixes it.
      throw new Error("Storage object not found — was the upload completed?");
    }

    const rule = UPLOAD_RULES[args.purpose];
    const contentType = metadata.contentType ?? "";

    if (metadata.size > rule.maxBytes) {
      await ctx.storage.delete(args.storageId);
      return {
        ok: false,
        error: `File too large: ${metadata.size} bytes exceeds ${rule.maxBytes} for ${args.purpose}`,
      };
    }
    if (!(rule.mimeTypes as readonly string[]).includes(contentType)) {
      await ctx.storage.delete(args.storageId);
      return {
        ok: false,
        error: `Content type ${contentType || "(missing)"} not allowed for ${args.purpose}`,
      };
    }

    await ctx.db.insert("fileUploads", {
      storageId: args.storageId,
      uploaderUserId: user._id,
      purpose: args.purpose,
      contentType,
      size: metadata.size,
    });

    return { ok: true, alreadyRegistered: false };
  },
});

/**
 * Look up an upload row and assert that `userId` owns it and that it
 * was registered for `expectedPurpose`. Throws on any mismatch.
 * Call this from any mutation that attaches a storage ID to a row
 * (avatar, submission video, etc.) so a user can't link to a file
 * uploaded by someone else.
 */
export async function requireOwnedUpload(
  ctx: MutationCtx | QueryCtx,
  storageId: Id<"_storage">,
  userId: Id<"users">,
  expectedPurpose: UploadPurpose
): Promise<void> {
  const upload = await ctx.db
    .query("fileUploads")
    .withIndex("by_storageId", (q) => q.eq("storageId", storageId))
    .unique();
  if (!upload) {
    throw new Error(
      "Upload not registered — call storage.registerUpload before attaching the storage ID"
    );
  }
  if (upload.uploaderUserId !== userId) {
    throw new Error("Cannot attach another user's upload");
  }
  if (upload.purpose !== expectedPurpose) {
    throw new Error(
      `Upload was registered for ${upload.purpose}, not ${expectedPurpose}`
    );
  }
}

/**
 * Resolve a storage ID to a serving URL. Authenticated only — storage
 * IDs are opaque but should not be enumerable by unauth callers, and
 * the platform routes that need this query are all auth-gated already.
 */
export const getUrl = query({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    await getAuthUser(ctx);
    return await ctx.storage.getUrl(args.storageId);
  },
});
