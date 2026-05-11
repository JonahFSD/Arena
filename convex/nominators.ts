import { query, mutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { requireAdmin } from "./helpers";

/**
 * Submit a "request to become a nominator" from the public landing page.
 * No auth required. Stores the request in Convex and fires off an email to
 * every admin/superadmin so triage can happen.
 *
 * v1 = no rate limiting, no dedup beyond admin manual review.
 */
export const requestToBecomeNominator = mutation({
  args: {
    fullName: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    linkedinUrl: v.optional(v.string()),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const fullName = args.fullName.trim();
    const email = args.email.trim().toLowerCase();
    if (!fullName) throw new Error("Name is required");
    if (!email || !email.includes("@")) throw new Error("A valid email is required");

    const requestId = await ctx.db.insert("nominatorRequests", {
      fullName,
      email,
      phone: args.phone?.trim() || undefined,
      linkedinUrl: args.linkedinUrl?.trim() || undefined,
      note: args.note?.trim() || undefined,
      status: "new",
    });

    // Notify every admin/superadmin. Falls back to no-op if no admins exist
    // or RESEND_API_KEY isn't configured (sendNotification soft-fails).
    const admins = await ctx.db
      .query("users")
      .withIndex("by_role", (q) => q.eq("role", "superadmin"))
      .collect();
    const moreAdmins = await ctx.db
      .query("users")
      .withIndex("by_role", (q) => q.eq("role", "admin"))
      .collect();
    const recipients = [...admins, ...moreAdmins];

    const lines: string[] = [
      `<strong>Name:</strong> ${escapeHtml(fullName)}`,
      `<strong>Email:</strong> ${escapeHtml(args.email)}`,
    ];
    if (args.phone) lines.push(`<strong>Phone:</strong> ${escapeHtml(args.phone)}`);
    if (args.linkedinUrl) lines.push(`<strong>LinkedIn:</strong> ${escapeHtml(args.linkedinUrl)}`);
    if (args.note) lines.push(`<strong>Note:</strong> ${escapeHtml(args.note)}`);
    const body = lines.join("<br>");

    for (const admin of recipients) {
      if (!admin.email) continue;
      await ctx.scheduler.runAfter(0, internal.email.sendNotification, {
        to: admin.email,
        recipientName: admin.fullName.split(" ")[0] ?? "Admin",
        subject: `New nominator request: ${fullName}`,
        heading: "New nominator request",
        body,
        ctaLabel: "Review in admin",
        ctaUrl: "/admin/nominator-requests",
      });
    }

    return requestId;
  },
});

/**
 * List nominator requests (admin only). For the future admin review page.
 */
export const listRequests = query({
  args: {
    status: v.optional(
      v.union(
        v.literal("new"),
        v.literal("approved"),
        v.literal("rejected"),
        v.literal("contacted")
      )
    ),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const q = ctx.db.query("nominatorRequests");
    const filtered = args.status
      ? q.withIndex("by_status", (i) => i.eq("status", args.status!))
      : q;
    return await filtered.order("desc").collect();
  },
});

/**
 * Triage a nominator request — mark approved / contacted / rejected.
 */
export const reviewRequest = mutation({
  args: {
    requestId: v.id("nominatorRequests"),
    decision: v.union(
      v.literal("approved"),
      v.literal("rejected"),
      v.literal("contacted")
    ),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    const req = await ctx.db.get(args.requestId);
    if (!req) throw new Error("Request not found");
    await ctx.db.patch(args.requestId, {
      status: args.decision,
      reviewerId: admin._id,
      reviewerNotes: args.notes,
      reviewedAt: Date.now(),
    });
  },
});

/* -------------------- helpers -------------------- */

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
