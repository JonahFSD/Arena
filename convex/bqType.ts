import { v } from "convex/values";

/**
 * Canonical 16 Business Quotient (BQ) archetypes, arranged on a 4×4 grid:
 *   Rows (vertical axis):    Analytical / Interpersonal × Exploratory / Decisive
 *   Columns (horizontal):    Insight / Validation       × Market / Process
 *
 * Stored without the "The" prefix — UI prepends "The " when rendering as a
 * branded name (e.g. "The Pathfinder"). This keeps stored values clean to
 * compare, filter, and serialize.
 *
 * Single source of truth for both the Convex schema validator and frontend
 * code. Lives in its own file — and deliberately not in convex/schema.ts —
 * because schema.ts pulls in `@convex-dev/auth/server`, which is server-only
 * and would risk pulling server code into the client bundle.
 */
export const BQ_TYPES = [
  // Analytical & Exploratory
  "Pathfinder",
  "Theorist",
  "Cartographer",
  "Prospector",
  // Analytical & Decisive
  "Strategist",
  "Catalyst",
  "Optimizer",
  "Sentinel",
  // Interpersonal & Exploratory
  "Luminary",
  "Weaver",
  "Navigator",
  "Steward",
  // Interpersonal & Decisive
  "Torchbearer",
  "Alchemist",
  "Builder",
  "Anchor",
] as const;

export type BqType = (typeof BQ_TYPES)[number];

export const bqTypeValidator = v.union(
  v.literal("Pathfinder"),
  v.literal("Theorist"),
  v.literal("Cartographer"),
  v.literal("Prospector"),
  v.literal("Strategist"),
  v.literal("Catalyst"),
  v.literal("Optimizer"),
  v.literal("Sentinel"),
  v.literal("Luminary"),
  v.literal("Weaver"),
  v.literal("Navigator"),
  v.literal("Steward"),
  v.literal("Torchbearer"),
  v.literal("Alchemist"),
  v.literal("Builder"),
  v.literal("Anchor")
);
