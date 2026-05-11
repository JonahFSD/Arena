import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { auth } from "./auth";

const http = httpRouter();

auth.addHttpRoutes(http);

// ============================================
// STRIPE WEBHOOK
// ============================================
http.route({
  path: "/stripe/webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const signature = request.headers.get("stripe-signature");
    if (!signature) {
      return new Response("Missing stripe-signature header", { status: 400 });
    }
    const body = await request.text();
    try {
      await ctx.runAction(internal.stripe.handleStripeWebhook, {
        signature,
        body,
      });
      return new Response("OK", { status: 200 });
    } catch (err) {
      console.error("Stripe webhook error:", err);
      return new Response("Webhook error", { status: 400 });
    }
  }),
});

export default http;
