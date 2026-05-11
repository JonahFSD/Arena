import { redirect } from "next/navigation";

/** Team invitations now live on My Pitches; keep this route for old links and notifications. */
export default function PitchesInvitationsRedirectPage() {
  redirect("/pitches");
}
