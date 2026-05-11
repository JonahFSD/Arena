import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// 1st of each month at midnight UTC: open a new voting round
crons.monthly(
  "open voting round",
  { day: 1, hourUTC: 0, minuteUTC: 0 },
  internal.votingActions.openNewRound
);

// 8th of each month at midnight UTC: close voting and finalize results
crons.monthly(
  "close and finalize voting",
  { day: 8, hourUTC: 0, minuteUTC: 0 },
  internal.votingActions.closeAndFinalize
);

export default crons;
