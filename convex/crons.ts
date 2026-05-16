import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// 1st of each month at midnight UTC: open a new voting round
crons.cron(
  "open voting round",
  "0 0 1 * *",
  internal.votingActions.openNewRound
);

// 8th of each month at midnight UTC: close voting and finalize results
crons.cron(
  "close and finalize voting",
  "0 0 8 * *",
  internal.votingActions.closeAndFinalize
);

// Every 6 hours: clear expired rateLimits rows so the table doesn't grow
// unbounded. Self-reschedules in batches if there's more to clean.
crons.interval(
  "purge stale rate limits",
  { hours: 6 },
  internal.rateLimit.purgeStale
);

export default crons;
