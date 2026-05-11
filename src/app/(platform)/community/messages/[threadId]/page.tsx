import { redirect } from "next/navigation";

export default function ThreadPage() {
  redirect("/community/messages");
}
