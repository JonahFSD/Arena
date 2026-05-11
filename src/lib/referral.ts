/**
 * Referral links for member invites (Leaderboard: +500 pts when someone applies via your link).
 *
 * **URL shape:** `/apply?ref=<referralCode>`
 *
 * **Why `ref` is an opaque code (not username or raw user id):**
 * - Usernames can change → old shared links would break or attribute wrong.
 * - Full UUIDs are long and ugly in messages.
 * - Production should store a short, immutable `referral_code` per user (e.g. 8–12 URL-safe
 *   chars) generated at signup; the server resolves `ref` → `user_id` on application submit.
 *
 * Until auth is wired, the settings page uses a mock code.
 */
export const MOCK_REFERRAL_CODE = "jake-demo-ref";

export function buildInvitePath(referralCode: string): string {
  return `/apply?ref=${encodeURIComponent(referralCode)}`;
}
