import { v } from "convex/values";

/**
 * Canonical list of Business Quotient (BQ) types.
 *
 * Single source of truth for both the Convex schema validator and any
 * frontend code (filter dropdowns, demo data). Lives in its own file
 * — and deliberately not in convex/schema.ts — because schema.ts pulls
 * in `@convex-dev/auth/server`, which is server-only and would be unsafe
 * to import from the client bundle.
 */
export const BQ_TYPES = [
  "Anchor",
  "Visionary",
  "Operator",
  "Catalyst",
  "Strategist",
  "Builder",
] as const;

export type BqType = (typeof BQ_TYPES)[number];

export const bqTypeValidator = v.union(
  v.literal("Anchor"),
  v.literal("Visionary"),
  v.literal("Operator"),
  v.literal("Catalyst"),
  v.literal("Strategist"),
  v.literal("Builder")
);
