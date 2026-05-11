import type { SubTab } from "@/components/layout/sub-tab-nav";

export const COMMUNITY_SUB_TABS: SubTab[] = [
  { href: "/community/leadership", label: "Leadership" },
  { href: "/community/leaderboard", label: "Leaderboard" },
  { href: "/community/members", label: "Members" },
  { href: "/community/messages", label: "Chat" },
];

export const ADMIN_SUB_TABS: SubTab[] = [
  { href: "/admin/applications", label: "Applications" },
  { href: "/admin/leadership", label: "Leadership" },
  { href: "/admin/payouts", label: "Payouts" },
  { href: "/admin/analytics", label: "Analytics" },
  { href: "/admin/bounties", label: "Bounties" },
];

export function isCommunityDetailRoute(pathname: string): boolean {
  if (/^\/community\/messages\/.+$/.test(pathname)) return true;
  const segments = pathname.split("/").filter(Boolean);
  if (
    segments.length === 2 &&
    segments[0] === "community" &&
    !["messages", "leadership", "leaderboard", "members"].includes(segments[1])
  ) {
    return true;
  }
  return false;
}

export const PITCHES_SUB_TABS: SubTab[] = [
  { href: "/pitches", label: "My Pitches" },
  { href: "/pitches/voting", label: "Voting" },
  { href: "/pitches/results", label: "Results" },
  { href: "/pitches/explore", label: "Explore" },
];

const pitchesDetailPatterns = ["/pitches/new"];

export function isPitchesDetailRoute(pathname: string): boolean {
  if (pitchesDetailPatterns.some((p) => pathname === p)) return true;
  const segments = pathname.split("/").filter(Boolean);
  if (
    segments.length === 2 &&
    segments[0] === "pitches" &&
    !["voting", "results", "explore", "new", "invitations"].includes(segments[1])
  ) {
    return true;
  }
  return false;
}

/** `/bounties/[id]` or `/bounties/new` detail — not the list / past routes. */
export function isBountiesDetailRoute(pathname: string): boolean {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 2 && segments[0] === "bounties") {
    if (segments[1] === "past") return false;
    return true;
  }
  return false;
}

/** True when on an admin detail route (e.g. `/admin/bounties/new`) that should
 *  show a back-link instead of subtabs. */
export function isAdminDetailRoute(pathname: string): boolean {
  if (pathname === "/admin/bounties/new") return true;
  return false;
}

/** Back-link info for detail routes (shown in the header bar when subtabs are hidden). */
export function getDetailBackLink(
  pathname: string
): { href: string; label: string } | null {
  if (isCommunityDetailRoute(pathname)) {
    return { href: "/community/members", label: "Back to Community" };
  }
  if (isPitchesDetailRoute(pathname)) {
    return { href: "/pitches", label: "Back to Pitches" };
  }
  if (isBountiesDetailRoute(pathname)) {
    return { href: "/bounties", label: "Back to Bounties" };
  }
  if (isAdminDetailRoute(pathname)) {
    return { href: "/admin/bounties", label: "Back to Bounties" };
  }
  return null;
}

/** Subtabs rendered in the platform header for these sections (not on detail routes). */
export function getHeaderSubTabs(pathname: string): SubTab[] | null {
  if (pathname.startsWith("/community") && !isCommunityDetailRoute(pathname)) {
    return COMMUNITY_SUB_TABS;
  }
  if (pathname.startsWith("/pitches") && !isPitchesDetailRoute(pathname)) {
    return PITCHES_SUB_TABS;
  }
  if (pathname.startsWith("/admin") && !isAdminDetailRoute(pathname)) {
    return ADMIN_SUB_TABS;
  }
  return null;
}
