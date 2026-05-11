"use client";

import { useMemo, useEffect, Suspense } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CircleDollarSign, Clock, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  platformPaneBleedClass,
  platformPaneCellPaddingClass,
  platformPaneGridCellFillClass,
  platformPaneGridHangingCellBottomClass,
  platformPaneGridPartialHairlineClass,
  platformPaneGridPartialRowTailFillClass,
  platformPaneGridRowFullClass,
  platformPaneGridRowPartialClass,
  platformPaneGridRowsStackClass,
  platformPaneTileClass,
} from "@/lib/platform-pane-grid";
import {
  parseBountiesSearchFromSearch,
  parseBountiesFilterFromSearch,
  filterBountiesBySearch,
  filterActiveBountiesByStatus,
  sortPastBounties,
  type BountiesActiveFilter,
  type BountiesPastFilter,
} from "@/lib/bounties-list-filters";
import {
  BOUNTIES_GRID_BREAKPOINTS,
  chunkIntoRows,
  isLastRowCell,
  paneGridCellFractionStyle,
  useResponsiveGridColumnCount,
} from "@/lib/responsive-grid-columns";

function daysUntilDue(epochMs: number) {
  const now = Date.now();
  return Math.ceil((epochMs - now) / (1000 * 60 * 60 * 24));
}

function BountiesListInner({ mode }: { mode: "active" | "past" }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchQuery = parseBountiesSearchFromSearch(searchParams);
  const bountyFilter = parseBountiesFilterFromSearch(pathname, searchParams);

  const rawBounties = useQuery(api.bounties.list, {}) ?? [];
  const markBountiesViewed = useMutation(api.sidebarBadges.markBountiesViewed);

  useEffect(() => {
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

  const gridCols = useResponsiveGridColumnCount(BOUNTIES_GRID_BREAKPOINTS);
  const rows = useMemo(
    () => chunkIntoRows(filtered, gridCols),
    [filtered, gridCols]
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

  return (
    <div className="animate-fade-in w-full">
      <div
        className={cn("overflow-hidden rounded-none", platformPaneBleedClass)}
      >
        {filtered.length === 0 ? (
          <div
            className={cn(
              platformPaneCellPaddingClass,
              platformPaneGridCellFillClass,
              "py-12 text-center"
            )}
          >
            <CircleDollarSign className="h-10 w-10 text-text-muted mx-auto mb-3" />
            <p className="text-sm text-text-secondary">
              {afterModeAndFilter.length > 0 && searchQuery.trim()
                ? "No bounties match your search. Try a different keyword."
                : mode === "active"
                  ? "No open bounties right now. Check back soon!"
                  : "No closed bounties yet."}
            </p>
          </div>
        ) : (
          <div className={platformPaneGridRowsStackClass}>
            {rows.map((row, rowIndex) => {
              const isPartial = row.length < gridCols;
              const rowKey = `${rowIndex}-${row[0]!._id}`;

              const cells = row.map((bounty, i) => {
                const index = rowIndex * gridCols + i;
                const days = daysUntilDue(bounty.dueDate);
                const showDaysLeft =
                  mode === "active" && bounty.status === "active";

                return (
                  <div
                    key={bounty._id}
                    className={cn(
                      "min-w-0 flex flex-col",
                      platformPaneGridCellFillClass,
                      isLastRowCell(index, filtered.length, gridCols) &&
                        platformPaneGridHangingCellBottomClass
                    )}
                    style={isPartial ? paneGridCellFractionStyle(gridCols) : undefined}
                  >
                    <Link href={`/bounties/${bounty._id}`} className="block h-full">
                      <Card
                        hover
                        padding="none"
                        className={cn(
                          platformPaneTileClass,
                          "flex h-full min-h-0 flex-1 flex-col overflow-hidden p-[30px]"
                        )}
                      >
                        <div className="flex flex-col gap-4">
                          <div className="flex items-start justify-between gap-3">
                            <span className="min-w-0 text-3xl font-bold tabular-nums text-brand-500 tracking-tight">
                              ${bounty.bountyAmount.toLocaleString()}
                            </span>
                            {bounty.status === "completed" && (
                              <Badge
                                variant="success"
                                className="shrink-0 text-[10px]"
                              >
                                Completed
                              </Badge>
                            )}
                          </div>

                          <div className="flex flex-col gap-2">
                            <h3 className="text-base font-semibold text-text-primary leading-snug line-clamp-4">
                              {bounty.title}
                            </h3>

                            <div className="flex flex-col gap-1.5 text-[11px] text-text-muted">
                              {showDaysLeft && (
                                <span
                                  className={`flex items-center gap-1.5 ${
                                    days <= 7
                                      ? "text-warning"
                                      : days <= 0
                                        ? "text-error"
                                        : ""
                                  }`}
                                >
                                  <Clock className="h-3 w-3 flex-shrink-0 text-brand-500" />
                                  {days > 0 ? `${days} days left` : "Overdue"}
                                </span>
                              )}
                              <span className="flex items-center gap-1.5">
                                <Send className="h-3 w-3 flex-shrink-0 text-brand-500" />
                                {bounty.submissionsCount} submission
                                {bounty.submissionsCount !== 1 ? "s" : ""}
                              </span>
                            </div>
                          </div>
                        </div>
                      </Card>
                    </Link>
                  </div>
                );
              });

              if (isPartial) {
                return (
                  <div key={rowKey} className={platformPaneGridRowPartialClass}>
                    {cells.flatMap((node, i) =>
                      i === 0
                        ? [node]
                        : [
                            <div
                              key={`${rowKey}-v-${i}`}
                              className={platformPaneGridPartialHairlineClass}
                              aria-hidden
                            />,
                            node,
                          ]
                    )}
                    <div
                      key={`${rowKey}-v-end`}
                      className={platformPaneGridPartialHairlineClass}
                      aria-hidden
                    />
                    <div
                      className={platformPaneGridPartialRowTailFillClass}
                      aria-hidden
                    />
                  </div>
                );
              }

              return (
                <div
                  key={rowKey}
                  className={platformPaneGridRowFullClass}
                  style={{
                    gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))`,
                  }}
                >
                  {cells}
                </div>
              );
            })}
          </div>
        )}
      </div>
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
