import { internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";

/**
 * Delete rateLimits rows whose window has long since closed.
 *
 * The largest window in use today is 24h; we keep rows for 48h after the
 * window opened so a re-entry into an active window still hits the
 * existing counter. Anything older is dead weight.
 *
 * Self-reschedules in 500-row batches so a long-running cleanup never
 * exceeds Convex's 16k-write per-transaction limit. Runs every 6h via
 * the cron in convex/crons.ts.
 */
const BATCH = 500;
const STALE_AFTER_MS = 48 * 60 * 60 * 1000;

export const purgeStale = internalMutation({
  args: {},
  handler: async (ctx) => {
    const cutoff = Date.now() - STALE_AFTER_MS;

    const stale = await ctx.db
      .query("rateLimits")
      .withIndex("by_windowStart", (q) => q.lt("windowStart", cutoff))
      .take(BATCH);

    for (const row of stale) {
      await ctx.db.delete(row._id);
    }

    if (stale.length === BATCH) {
      // More to clean; schedule the next batch in its own transaction.
      await ctx.scheduler.runAfter(0, internal.rateLimit.purgeStale);
    } else if (stale.length > 0) {
      console.log(`rateLimit.purgeStale: removed ${stale.length} stale rows`);
    }
  },
});
