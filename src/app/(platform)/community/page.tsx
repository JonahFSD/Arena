import { redirect } from "next/navigation";

/** Default Community landing: Leadership (members list lives at `/community/members`). */
export default function CommunityIndexPage() {
  redirect("/community/leadership");
}
