import { redirect } from "next/navigation";

/** Old URL — leaderboard lives under Community. */
export default function LeaderboardRedirectPage() {
  redirect("/community/leaderboard");
}
