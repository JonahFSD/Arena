"use client";

import { useMemo, useEffect, Suspense } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";

const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

const DEMO_BOUNTIES = [
  { _id: "b1", title: "Build a landing page for a roofing app", bountyAmount: 500, dueDate: Date.now() + 1000 * 60 * 60 * 24 * 6, status: "active", submissionsCount: 4 },
  { _id: "b2", title: "Design system audit for a fintech MVP", bountyAmount: 750, dueDate: Date.now() + 1000 * 60 * 60 * 24 * 12, status: "active", submissionsCount: 2 },
  { _id: "b3", title: "Write 5 landing-page hooks for an AI app", bountyAmount: 250, dueDate: Date.now() + 1000 * 60 * 60 * 24 * 3, status: "active", submissionsCount: 9 },
  { _id: "b4", title: "Integrate Stripe checkout in a Next.js app", bountyAmount: 600, dueDate: Date.now() + 1000 * 60 * 60 * 24 * 8, status: "active", submissionsCount: 1 },
  { _id: "b5", title: "Ship a Chrome extension that captures highlights", bountyAmount: 400, dueDate: Date.now() + 1000 * 60 * 60 * 24 * 14, status: "active", submissionsCount: 0 },
  { _id: "b6", title: "Old: Build the original waitlist site", bountyAmount: 300, dueDate: Date.now() - 1000 * 60 * 60 * 24 * 18, status: "completed", submissionsCount: 6 },
];
import { Badge } from "@/components/ui/badge";
import { CircleDollarSign, Send } from "lucide-react";
import { cn, formatDate, daysUntilDue } from "@/lib/utils";
import {
  parseBountiesSearchFromSearch,
  parseBountiesFilterFromSearch,
  filterBountiesBySearch,
  filterActiveBountiesByStatus,
  sortPastBounties,
  type BountiesActiveFilter,
  type BountiesPastFilter,
} from "@/lib/bounties-list-filters";

function BountiesListInner({ mode }: { mode: "active" | "past" }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchQuery = parseBountiesSearchFromSearch(searchParams);
  const bountyFilter = parseBountiesFilterFromSearch(pathname, searchParams);

  const liveBounties = useQuery(
    api.bounties.list,
    DEMO_MODE ? "skip" : {}
  );
  const rawBounties = (
    DEMO_MODE
      ? (DEMO_BOUNTIES as unknown as NonNullable<typeof liveBounties>)
      : liveBounties
  ) ?? [];
  const markBountiesViewed = useMutation(api.sidebarBadges.markBountiesViewed);

  useEffect(() => {
    if (DEMO_MODE) return;
    void markBountiesViewed();
  }, [markBountiesViewed]);

  const afterModeAndFilter = useMemo(() => {
    if (mode === "active") {
      const f = bountyFilter as BountiesActiveFilter;
      return filterActiveBountiesByStatus(rawBounties, f);
    }
    const f = bountyFilter as BountiesPastFilter;
    return sortPastBounties(rawBounties, f);
  }, [rawBounties, mode, bountyFilter]);

  const filtered = useMemo(
    () => filterBountiesBySearch(afterModeAndFilter, searchQuery),
    [afterModeAndFilter, searchQuery]
  );

  if (rawBounties === undefined) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-circle border-2 border-brand-500 border-t-transparent" />
        </div>
      </div>
    );
  }

  if (filtered.length === 0) {
    return (
      <div className="animate-fade-in py-12 text-center">
        <CircleDollarSign className="h-10 w-10 text-text-muted mx-auto mb-3" />
        <p className="text-sm text-text-secondary">
          {afterModeAndFilter.length > 0 && searchQuery.trim()
            ? "No bounties match your search. Try a different keyword."
            : mode === "active"
              ? "No open bounties right now. Check back soon!"
              : "No closed bounties yet."}
        </p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in w-full">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-border-default">
            <th className="px-4 py-3 text-[11px] font-medium text-text-muted uppercase tracking-wider">
              Bounty
            </th>
            <th className="px-4 py-3 text-[11px] font-medium text-text-muted uppercase tracking-wider text-right">
              Amount
            </th>
            <th className="px-4 py-3 text-[11px] font-medium text-text-muted uppercase tracking-wider hidden sm:table-cell">
              {mode === "active" ? "Due" : "Closed"}
            </th>
            <th className="px-4 py-3 text-[11px] font-medium text-text-muted uppercase tracking-wider text-right">
              Subs
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border-default">
          {filtered.map((bounty) => {
            const days = daysUntilDue(bounty.dueDate);
            const showDaysLeft =
              mode === "active" && bounty.status === "active";
            const isCompleted = bounty.status === "completed";

            return (
              <tr
                key={bounty._id}
                className="group transition-colors hover:bg-surface-card-hover"
              >
                <td className="px-4 py-4 align-middle">
                  <Link
                    href={`/bounties/${bounty._id}`}
                    className="block min-w-0"
                  >
                    <p className="text-sm font-medium text-text-primary line-clamp-1 group-hover:text-text-primary">
                      {bounty.title}
                    </p>
                    {isCompleted && (
                      <Badge
                        variant="success"
                        className="mt-1 text-[10px]"
                      >
                        Completed
                      </Badge>
                    )}
                  </Link>
                </td>
                <td className="px-4 py-4 align-middle text-right">
                  <span className="text-sm tabular-nums text-text-primary">
                    ${bounty.bountyAmount.toLocaleString()}
                  </span>
                </td>
                <td className="px-4 py-4 align-middle hidden sm:table-cell">
                  <p className="text-xs text-text-secondary">
                    {formatDate(bounty.dueDate)}
                  </p>
                  {showDaysLeft && (
                    <p
                      className={cn(
                        "text-[11px] mt-0.5",
                        days <= 0
                          ? "text-error"
                          : days <= 7
                            ? "text-warning"
                            : "text-text-muted"
                      )}
                    >
                      {days > 0 ? `${days} days left` : "Overdue"}
                    </p>
                  )}
                </td>
                <td className="px-4 py-4 align-middle text-right">
                  <span className="inline-flex items-center justify-end gap-1.5 text-xs text-text-secondary">
                    <Send className="h-3 w-3 text-text-muted" aria-hidden />
                    {bounty.submissionsCount}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function BountiesList({ mode }: { mode: "active" | "past" }) {
  return (
    <Suspense
      fallback={
        <div className="space-y-6 animate-fade-in">
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-circle border-2 border-brand-500 border-t-transparent" />
          </div>
        </div>
      }
    >
      <BountiesListInner mode={mode} />
    </Suspense>
  );
}
