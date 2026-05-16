/**
 * Canonical prize-pool model — single source of truth shared by the
 * Convex cron that creates new pools (votingActions.ts), the seed
 * historical pools (seed.ts), and the frontend Hall of Fame display.
 *
 * Lives in convex/ because Convex's tsconfig is scoped to convex/**
 * — the frontend can reach in via relative path, but convex/ can't
 * import from src/.
 *
 * Model: 10% operational fee, 90% goes to the competitor pool,
 * split 50% / 30% / 20% across 1st / 2nd / 3rd place winners.
 */
export const PRIZE_SPLIT = {
  operationalFeePct: 10,
  firstPlacePct: 50,
  secondPlacePct: 30,
  thirdPlacePct: 20,
} as const;

/**
 * Leaderboard bonus points awarded by closeAndFinalize for placing
 * 1st / 2nd / 3rd. Independent of the dollar prize.
 */
export const PLACE_LEADERBOARD_POINTS: Record<1 | 2 | 3, number> = {
  1: 1000,
  2: 750,
  3: 500,
};

/**
 * Dollar amount of the displayed competitor pool — the slice
 * users compete for, after the operational fee is withheld.
 */
export function competitorPoolAmount(grossPool: number): number {
  return Math.round(grossPool * (1 - PRIZE_SPLIT.operationalFeePct / 100));
}

export type CompetitorPrizeSplit = {
  displayPool: number;
  first: number;
  second: number;
  third: number;
};

/**
 * Split the displayed competitor pool by PRIZE_SPLIT. Sums exactly
 * to displayPool — third absorbs any rounding remainder so a user
 * never sees a missing penny.
 */
export function splitCompetitorPrizePool(
  grossPool: number
): CompetitorPrizeSplit {
  const displayPool = competitorPoolAmount(grossPool);
  const first = Math.floor(displayPool * (PRIZE_SPLIT.firstPlacePct / 100));
  const second = Math.floor(displayPool * (PRIZE_SPLIT.secondPlacePct / 100));
  const third = displayPool - first - second;
  return { displayPool, first, second, third };
}
