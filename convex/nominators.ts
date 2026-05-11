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

/**
 * Public: a nominator (identified by their email) nominates a student.
 * Throws NOMINATOR_NOT_FOUND if the email is not in the approved nominators
 * list — the frontend matches that string to show a "request access" CTA.
 */
export const nominateStudent = mutation({
  args: {
    nominatorEmail: v.string(),
    nomineeFirstName: v.string(),
    nomineeLastName: v.string(),
    nomineeEmail: v.string(),
    nomineePhone: v.optional(v.string()),
    nomineeLinks: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const nominatorEmail = args.nominatorEmail.trim().toLowerCase();
    const nomineeEmail = args.nomineeEmail.trim().toLowerCase();
    if (!nominatorEmail.includes("@")) throw new Error("A valid nominator email is required");
    if (!nomineeEmail.includes("@")) throw new Error("A valid nominee email is required");

    const nominator = await ctx.db
      .query("nominators")
      .withIndex("by_email", (q) => q.eq("email", nominatorEmail))
      .first();
    if (!nominator || nominator.status !== "approved") {
      throw new Error("NOMINATOR_NOT_FOUND");
    }

    const token = generateToken();

    const nominationId = await ctx.db.insert("nominations", {
      nominatorId: nominator._id,
      nominatorEmailAtTime: nominator.email,
      nomineeFirstName: args.nomineeFirstName.trim(),
      nomineeLastName: args.nomineeLastName.trim(),
      nomineeEmail,
      nomineePhone: args.nomineePhone?.trim() || undefined,
      nomineeLinks: args.nomineeLinks,
      token,
      status: "sent",
    });

    const fullName = `${args.nomineeFirstName.trim()} ${args.nomineeLastName.trim()}`.trim();
    await ctx.scheduler.runAfter(0, internal.email.sendNotification, {
      to: nomineeEmail,
      recipientName: args.nomineeFirstName.trim() || "there",
      subject: "You've been nominated to 021",
      heading: "You've been nominated to 021",
      body: `${escapeHtml(nominator.fullName)} has nominated you to apply to 021 — the teenage venture studio. Tap below to start your application.`,
      ctaLabel: "Start application",
      ctaUrl: `/apply?n=${token}`,
    }).catch(() => {});

    void fullName;
    return nominationId;
  },
});

/**
 * Admin: directly add an approved nominator.
 */
export const addNominator = mutation({
  args: {
    email: v.string(),
    fullName: v.string(),
    phone: v.optional(v.string()),
    linkedinUrl: v.optional(v.string()),
    companyWebsite: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    const email = args.email.trim().toLowerCase();
    const existing = await ctx.db
      .query("nominators")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();
    if (existing) throw new Error("A nominator with this email already exists");
    return await ctx.db.insert("nominators", {
      email,
      fullName: args.fullName.trim(),
      phone: args.phone?.trim() || undefined,
      linkedinUrl: args.linkedinUrl?.trim() || undefined,
      companyWebsite: args.companyWebsite?.trim() || undefined,
      status: "approved",
      source: "admin_added",
      approvedById: admin._id,
      approvedAt: Date.now(),
    });
  },
});

/**
 * Admin: promote a nominator request into an approved nominator.
 */
export const promoteFromRequest = mutation({
  args: { requestId: v.id("nominatorRequests") },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    const req = await ctx.db.get(args.requestId);
    if (!req) throw new Error("Request not found");
    const email = req.email.trim().toLowerCase();
    const existing = await ctx.db
      .query("nominators")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();
    if (existing) throw new Error("A nominator with this email already exists");
    const nominatorId = await ctx.db.insert("nominators", {
      email,
      fullName: req.fullName,
      phone: req.phone,
      linkedinUrl: req.linkedinUrl,
      status: "approved",
      source: "self_request",
      fromRequestId: req._id,
      approvedById: admin._id,
      approvedAt: Date.now(),
    });
    await ctx.db.patch(args.requestId, {
      status: "approved",
      reviewerId: admin._id,
      reviewedAt: Date.now(),
    });
    return nominatorId;
  },
});

/**
 * Admin: revoke a nominator.
 */
export const revokeNominator = mutation({
  args: { nominatorId: v.id("nominators") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    await ctx.db.patch(args.nominatorId, { status: "revoked" });
  },
});

/**
 * Admin: list nominators (optional status filter).
 */
export const listNominators = query({
  args: {
    status: v.optional(
      v.union(
        v.literal("approved"),
        v.literal("paused"),
        v.literal("revoked")
      )
    ),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const q = ctx.db.query("nominators");
    const filtered = args.status
      ? q.withIndex("by_status", (i) => i.eq("status", args.status!))
      : q;
    return await filtered.order("desc").collect();
  },
});

/* -------------------- helpers -------------------- */

function generateToken(): string {
  const c = (globalThis as { crypto?: { randomUUID?: () => string } }).crypto;
  if (c?.randomUUID) return c.randomUUID();
  return (
    Math.random().toString(36).slice(2) +
    Math.random().toString(36).slice(2)
  );
}


function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
