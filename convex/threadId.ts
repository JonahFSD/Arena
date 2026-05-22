/**
 * Compute a deterministic thread ID from two user IDs.
 *
 * Single source of truth for the messaging thread-key convention. Imported by
 * convex/messages.ts (server) and the client messages page so both sides
 * agree on the same thread identifier without re-implementing the rule.
 */
export function computeThreadId(userId1: string, userId2: string): string {
  return [userId1, userId2].sort().join("_");
}
