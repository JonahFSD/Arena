/** Gross monthly pool; 10% to company is withheld — users compete for 90%. */
export function competitorPoolAmount(grossPool: number): number {
  return Math.round(grossPool * 0.9);
}

export type CompetitorPrizeSplit = {
  displayPool: number;
  first: number;
  second: number;
  third: number;
  mostPoints: number;
};

/** Split the displayed (90%) pool: 50% / 30% / 10% / 10%; sums exactly to competitor pool. */
export function splitCompetitorPrizePool(grossPool: number): CompetitorPrizeSplit {
  const displayPool = competitorPoolAmount(grossPool);
  const first = Math.floor(displayPool * 0.5);
  const second = Math.floor(displayPool * 0.3);
  const third = Math.floor(displayPool * 0.1);
  const mostPoints = displayPool - first - second - third;
  return { displayPool, first, second, third, mostPoints };
}

/** Leaderboard bonus points shown under 1st–3rd trophies (matches leaderboard rules). */
export const PLACEMENT_LEADERBOARD_POINTS: Record<1 | 2 | 3, number> = {
  1: 1000,
  2: 750,
  3: 500,
};
