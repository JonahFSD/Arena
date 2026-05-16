import { action, internalAction } from "./_generated/server";
import { v } from "convex/values";
import Stripe from "stripe";
import { internal } from "./_generated/api";
import { getAuthUserId } from "@convex-dev/auth/server";
import type { Id } from "./_generated/dataModel";

function getStripe() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) throw new Error("STRIPE_SECRET_KEY not configured");
  return new Stripe(secretKey);
}

// ============================================
// BOUNTY CHECKOUT — Create a Checkout Session
// ============================================

/**
 * Creates a Stripe Checkout Session for a bounty payment.
 * The bounty metadata is stored in the session and used by the
 * webhook to create the bounty record after payment succeeds.
 */
export const createBountyCheckoutSession = action({
  args: {
    title: v.string(),
    description: v.string(),
    founderName: v.string(),
    founderCompany: v.string(),
    bountyAmount: v.number(),
    dueDate: v.number(),
    requirements: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    if (args.bountyAmount < 100) {
      throw new Error("Minimum bounty amount is $100");
    }
    const stripe = getStripe();

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "usd",
            unit_amount: args.bountyAmount * 100, // cents
            product_data: {
              name: `Bounty: ${args.title}`,
              description: `Bounty funding for "${args.title}"`,
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        type: "bounty",
        title: args.title,
        description: args.description,
        founderName: args.founderName,
        founderCompany: args.founderCompany,
        bountyAmount: String(args.bountyAmount),
        dueDate: String(args.dueDate),
        requirements: JSON.stringify(args.requirements),
        creatorUserId: userId,
      },
      success_url: `${siteUrl}/bounties?created=true`,
      cancel_url: `${siteUrl}/bounties`,
    });

    return { url: session.url };
  },
});

// ============================================
// BOUNTY REFUND — Refund a rejected bounty
// ============================================

/**
 * Refund a bounty payment via Stripe. Called when admin rejects a bounty.
 */
export const refundBounty = internalAction({
  args: { stripePaymentIntentId: v.string() },
  handler: async (_ctx, args) => {
    const stripe = getStripe();
    await stripe.refunds.create({
      payment_intent: args.stripePaymentIntentId,
    });
  },
});

// ============================================
// STRIPE WEBHOOK HANDLER — process bounty payments
// ============================================

/**
 * Process a Stripe webhook event for bounty checkout completion.
 * Called from convex/http.ts.
 */
export const handleStripeWebhook = internalAction({
  args: { signature: v.string(), body: v.string() },
  handler: async (ctx, args) => {
    const stripe = getStripe();
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) throw new Error("STRIPE_WEBHOOK_SECRET not configured");

    const event = stripe.webhooks.constructEvent(
      args.body,
      args.signature,
      webhookSecret
    );

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const meta = session.metadata;

      if (meta?.type === "bounty") {
        await ctx.runMutation(internal.bounties.createFromWebhook, {
          stripeEventId: event.id,
          stripeEventType: event.type,
          title: meta.title!,
          description: meta.description!,
          founderName: meta.founderName!,
          founderCompany: meta.founderCompany!,
          bountyAmount: Number(meta.bountyAmount),
          dueDate: Number(meta.dueDate),
          requirements: JSON.parse(meta.requirements!),
          creatorUserId: meta.creatorUserId! as Id<"users">,
          stripeCheckoutSessionId: session.id,
          stripePaymentIntentId:
            typeof session.payment_intent === "string"
              ? session.payment_intent
              : session.payment_intent?.id ?? "",
        });
      }
    }
  },
});

/**
 * Get the projected prize pool for the next month based on
 * current month's Stripe subscription revenue.
 *
 * Prize pool = 90% of total membership revenue for the current month.
 *
 * Returns { revenue, prizePool } in cents converted to dollars,
 * or null if Stripe is not configured.
 */
export const getProjectedPrizePool = action({
  args: {},
  handler: async (): Promise<{
    revenue: number;
    prizePool: number;
    activeSubscriptions: number;
  } | null> => {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      console.warn("STRIPE_SECRET_KEY not configured — returning null");
      return null;
    }

    const stripe = new Stripe(secretKey);

    // Get the start and end of the current calendar month (UTC)
    const now = new Date();
    const monthStart = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)
    );
    const monthEnd = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1)
    );

    // Fetch successful charges in the current month
    const charges: Stripe.Charge[] = [];
    let hasMore = true;
    let startingAfter: string | undefined;

    while (hasMore) {
      const batch = await stripe.charges.list({
        created: {
          gte: Math.floor(monthStart.getTime() / 1000),
          lt: Math.floor(monthEnd.getTime() / 1000),
        },
        limit: 100,
        ...(startingAfter ? { starting_after: startingAfter } : {}),
      });

      charges.push(
        ...batch.data.filter((c) => c.status === "succeeded" && !c.refunded)
      );
      hasMore = batch.has_more;
      if (batch.data.length > 0) {
        startingAfter = batch.data[batch.data.length - 1].id;
      }
    }

    // Sum revenue in cents, convert to dollars
    const revenueCents = charges.reduce((sum, c) => sum + c.amount, 0);
    const revenueDollars = revenueCents / 100;
    const prizePool = Math.round(revenueDollars * 0.9);

    return {
      revenue: revenueDollars,
      prizePool,
      activeSubscriptions: charges.length,
    };
  },
});
