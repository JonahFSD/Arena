/**
 * Points from AI score when the score is above 70 (out of 100).
 * UI formula: (YOUR AI SCORE−70)*1000/30 — algebraically (score−70)*1000/30, rounded.
 * Below 70 → 0; 100+ → 1000 (cap / edge case).
 */
export function pointsFromAiScore(score: number): number {
  if (score <= 70) return 0;
  if (score >= 100) return 1000;
  return Math.round((score - 70) * (1000 / 30));
}
