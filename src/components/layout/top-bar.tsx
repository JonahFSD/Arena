"use client";

import { Suspense, useEffect, useMemo } from "react";
import { usePathname } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { cn } from "@/lib/utils";
import { SubTabNav } from "@/components/layout/sub-tab-nav";
import type { SubTab } from "@/components/layout/sub-tab-nav";
import {
  COMMUNITY_SUB_TABS,
  getHeaderSubTabs,
  getDetailBackLink,
  isBountiesDetailRoute,
} from "@/lib/header-subtabs";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { PitchesMyHeaderActions } from "@/components/pitches/pitches-my-header-actions";
import { BountiesHeaderActions } from "@/components/bounties/bounties-header-actions";
import { AdminBountiesHeaderActions } from "@/components/admin/admin-bounties-header-actions";
import { MembersHeaderActions } from "@/components/community/members-header-actions";
import { MessagesHeaderActions } from "@/components/community/messages-header-actions";
import { LeaderboardRangeSubTabs } from "@/components/community/leaderboard-range-sub-tabs";

export function TopBar() {
  const pathname = usePathname();
  const onBountiesList =
    pathname.startsWith("/bounties") && !isBountiesDetailRoute(pathname);

  const subTabBadges = useQuery(api.sidebarBadges.getSubTabBadges);

  const subTabs = useMemo(() => {
    let tabs: SubTab[] | null;
    if (onBountiesList) {
      tabs = [
        { href: "/bounties", label: "Open" },
        { href: "/bounties/past", label: "Closed" },
      ];
    } else {
      tabs = getHeaderSubTabs(pathname);
    }

    // Attach badge counts to community subtabs
    if (tabs && subTabBadges && pathname.startsWith("/community")) {
      tabs = tabs.map((tab) => {
        if (tab.href === "/community/messages") {
          return { ...tab, badge: subTabBadges.communityChat };
        }
        return tab;
      });
    }

    return tabs;
  }, [pathname, onBountiesList, subTabBadges]);

  // Track last visited subtab path per section for dynamic back navigation
  useEffect(() => {
    if (subTabs && pathname.startsWith("/community")) {
      const matched = subTabs.find((t) => pathname === t.href || pathname.startsWith(t.href + "/"));
      if (matched) {
        try { sessionStorage.setItem("lastCommunitySubTab", matched.href); } catch {}
      }
    }
    if (subTabs && pathname.startsWith("/pitches")) {
      const matched = subTabs.find((t) => pathname === t.href || pathname.startsWith(t.href + "/"));
      if (matched) {
        try { sessionStorage.setItem("lastPitchesSubTab", matched.href); } catch {}
      }
    }
  }, [pathname, subTabs]);

  const backLink = useMemo(() => {
    const link = getDetailBackLink(pathname);
    if (!link) return null;
    // Override community back link with last visited subtab
    if (link.href === "/community/members") {
      try {
        const last = sessionStorage.getItem("lastCommunitySubTab");
        if (last && last !== "/community/members") {
          const tab = COMMUNITY_SUB_TABS.find((t) => t.href === last);
          if (tab) return { href: last, label: `Back to ${tab.label}` };
        }
      } catch {}
    }
    return link;
  }, [pathname]);

  const showPitchesMyActions = pathname === "/pitches";
  const showBountiesHeaderActions =
    pathname === "/bounties" || pathname === "/bounties/past";
  const showAdminBountiesHeaderActions = pathname === "/admin/bounties";
  const showCommunityMembersActions = pathname === "/community/members";
  const showMessagesHeaderActions = pathname === "/community/messages";
  const showLeaderboardRangeTabs =
    pathname === "/community/leaderboard" ||
    pathname === "/community/leaderboard/all-time";

  return (
    <header
      className={cn(
        "sticky top-0 z-30 border-b border-border-subtle",
        "bg-surface-chrome font-sans",
        subTabs
          ? "flex min-h-0 flex-col sm:h-16 sm:shrink-0"
          : "flex h-16 flex-col justify-end"
      )}
    >
      {subTabs ? (
        <div
          className={cn(
            "flex w-full flex-col gap-3 px-4 pt-2 pb-1.5 md:px-6 lg:px-8",
            "sm:h-full sm:flex-row sm:items-stretch sm:justify-between sm:gap-4 sm:py-0"
          )}
        >
          <div className="flex min-h-0 min-w-0 flex-1 flex-col justify-end overflow-x-auto sm:h-full">
            <SubTabNav tabs={subTabs} />
          </div>
          {showPitchesMyActions ? (
            <Suspense
              fallback={
                <div
                  className="flex shrink-0 items-center gap-2 sm:h-full"
                  aria-hidden
                >
                  <div className="h-8 w-[4.5rem] rounded-md bg-surface-elevated animate-pulse" />
                  <div className="h-8 w-[5.5rem] rounded-md bg-brand-500/20 animate-pulse" />
                </div>
              }
            >
              <PitchesMyHeaderActions />
            </Suspense>
          ) : showBountiesHeaderActions ? (
            <Suspense
              fallback={
                <div
                  className="flex shrink-0 items-center gap-2 sm:h-full"
                  aria-hidden
                >
                  <div className="h-8 w-28 rounded-md bg-surface-elevated animate-pulse" />
                  <div className="h-8 w-[4.5rem] rounded-md bg-surface-elevated animate-pulse" />
                </div>
              }
            >
              <BountiesHeaderActions />
            </Suspense>
          ) : showMessagesHeaderActions ? (
            <Suspense
              fallback={
                <div
                  className="flex shrink-0 items-center gap-2 sm:h-full"
                  aria-hidden
                >
                  <div className="h-8 w-28 rounded-md bg-surface-elevated animate-pulse" />
                  <div className="h-8 w-[4.5rem] rounded-md bg-surface-elevated animate-pulse" />
                </div>
              }
            >
              <MessagesHeaderActions />
            </Suspense>
          ) : showAdminBountiesHeaderActions ? (
            <Suspense
              fallback={
                <div
                  className="flex shrink-0 items-center gap-2 sm:h-full"
                  aria-hidden
                >
                  <div className="h-8 w-[6.5rem] rounded-md bg-brand-500/20 animate-pulse" />
                </div>
              }
            >
              <AdminBountiesHeaderActions />
            </Suspense>
          ) : showCommunityMembersActions ? (
            <MembersHeaderActions />
          ) : showLeaderboardRangeTabs ? (
            <div className="flex min-h-0 w-full min-w-0 shrink-0 flex-col justify-end overflow-x-auto sm:ml-auto sm:h-full sm:w-auto">
              <LeaderboardRangeSubTabs />
            </div>
          ) : null}
        </div>
      ) : backLink ? (
        <div className="flex h-full items-end px-4 pb-[5px] sm:pb-[4.5px] md:px-6 lg:px-8">
          <Link
            href={backLink.href}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-500 hover:text-brand-400 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            {backLink.label}
          </Link>
        </div>
      ) : null}
    </header>
  );
}
