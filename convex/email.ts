import { internalAction } from "./_generated/server";
import { v } from "convex/values";

/**
 * Send an email via Resend.
 * Called by other Convex functions via ctx.scheduler.runAfter().
 *
 * Requires RESEND_API_KEY environment variable.
 * Falls back gracefully if not configured (logs warning, doesn't throw).
 */
export const send = internalAction({
  args: {
    to: v.string(),
    subject: v.string(),
    html: v.string(),
  },
  handler: async (_ctx, args) => {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.warn(
        `[email] RESEND_API_KEY not configured. Skipping email to ${args.to}: "${args.subject}"`
      );
      return { success: false, reason: "no_api_key" };
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "ACU Youth Venture <noreply@acuyouthventure.com>",
        to: args.to,
        subject: args.subject,
        html: args.html,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error(`[email] Resend API error (${res.status}): ${body}`);
      return { success: false, reason: "api_error", status: res.status };
    }

    const data = await res.json();
    console.log(`[email] Sent to ${args.to}: "${args.subject}" (id: ${data.id})`);
    return { success: true, id: data.id };
  },
});

/**
 * Send a templated notification email.
 * Wraps the content in the platform email template.
 */
export const sendNotification = internalAction({
  args: {
    to: v.string(),
    recipientName: v.string(),
    subject: v.string(),
    heading: v.string(),
    body: v.string(),
    ctaLabel: v.optional(v.string()),
    ctaUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://acuyouthventure.com";
    const ctaBlock = args.ctaLabel && args.ctaUrl
      ? `<p style="margin-top:24px"><a href="${siteUrl}${args.ctaUrl}" style="display:inline-block;padding:12px 24px;background:#f59e0b;color:#000;text-decoration:none;border-radius:6px;font-weight:600;font-size:14px">${args.ctaLabel}</a></p>`
      : "";

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#111;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
  <div style="max-width:560px;margin:0 auto;padding:40px 24px">
    <div style="margin-bottom:32px">
      <strong style="color:#f59e0b;font-size:16px">ACU Youth Venture</strong>
    </div>
    <div style="background:#1a1a1a;border:1px solid #333;border-radius:8px;padding:32px 24px">
      <p style="color:#ccc;font-size:14px;margin:0 0 8px">Hey ${args.recipientName},</p>
      <h2 style="color:#fff;font-size:20px;margin:0 0 16px">${args.heading}</h2>
      <p style="color:#999;font-size:14px;line-height:1.6;margin:0">${args.body}</p>
      ${ctaBlock}
    </div>
    <p style="color:#555;font-size:11px;margin-top:24px;text-align:center">
      ACU Youth Venture Platform &bull; <a href="${siteUrl}/settings/notifications" style="color:#555">Manage preferences</a>
    </p>
  </div>
</body>
</html>`.trim();

    await ctx.runAction(internal.email.send, {
      to: args.to,
      subject: args.subject,
      html,
    });
  },
});

// Need this import for internal references
import { internal } from "./_generated/api";
