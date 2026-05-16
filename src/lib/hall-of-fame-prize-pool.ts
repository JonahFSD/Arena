// Re-exported from convex/prizeSplit so the schema validator, the cron
// that creates new pools, and the Hall of Fame display all share a
// single source of truth.
export {
  PRIZE_SPLIT,
  PLACE_LEADERBOARD_POINTS,
  competitorPoolAmount,
  splitCompetitorPrizePool,
  type CompetitorPrizeSplit,
} from "../../convex/prizeSplit";
