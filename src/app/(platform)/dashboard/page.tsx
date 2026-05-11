"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { Badge } from "@/components/ui/badge";
import {
  type LucideIcon,
  Trophy,
  ArrowRight,
  Clock,
  Calendar,
  Sparkles,
  Target,
  Handshake,
  CircleDollarSign,
  Network,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  platformPaneBleedClass,
  platformPaneCellPaddingClass,
  platformPaneGridCellFillClass,
  platformPaneGridGapClass,
  platformPaneStackGapClass,
  platformPaneTileClass,
} from "@/lib/platform-pane-grid";
import { getDashboardStatMomPercent } from "@/lib/dashboard-trends-data";

const DashboardTrendsChart = dynamic(
  () =>
    import("@/components/dashboard/dashboard-trends-chart").then(
      (m) => m.DashboardTrendsChart
    ),
  {
    ssr: false,
    loading: () => (
      <div className="h-72 rounded-none border-0 bg-transparent ring-1 ring-inset ring-border-default/20 animate-pulse" />
    ),
  }
);

/** Row layout inside hairline stacks (gap-px); faces use bg-surface-primary on each row. */
const dashboardRowLayoutClass =
  "flex min-h-0 items-center gap-3 p-3 rounded-none lg:flex-1";

export default function DashboardPage() {
  const stats = useQuery(api.users.getMyStats);
  const pendingInvites = useQuery(api.collaborators.listMyInvitations);

  const todoItems: {
    href: string;
    label: string;
    icon: LucideIcon;
    meta?: string;
  }[] = useMemo(
    () => [
      {
        href: "/pitches",
        label: "Team Invitations",
        icon: Handshake,
        meta:
          pendingInvites === undefined
            ? undefined
            : pendingInvites.length > 0
              ? `${pendingInvites.length} pending`
              : undefined,
      },
      {
        href: "/pitches/voting",
        label: "Vote Now",
        icon: Target,
        meta: "10 new",
      },
      {
        href: "/bounties",
        label: "Review Bounties",
        icon: CircleDollarSign,
        meta: "3 new",
      },
      {
        href: "/community/members",
        label: "Grow Network",
        icon: Network,
        meta: "5 new members",
      },
    ],
    [pendingInvites]
  );
  const momPoints = getDashboardStatMomPercent("points");
  const momRank = getDashboardStatMomPercent("rank");
  const momNetwork = getDashboardStatMomPercent("network");
  const momEarnings = getDashboardStatMomPercent("earnings");

  return (
    <div className="animate-fade-in w-full">
      <div className={cn("rounded-none overflow-hidden", platformPaneBleedClass)}>
        {/* To Do + cycle — gap-px only draws lines between columns/rows, not pane edges */}
        <div
          className={cn(
            "grid grid-cols-1 lg:grid-cols-3 lg:items-stretch",
            platformPaneGridGapClass
          )}
        >
          <div
            className={cn(
              "min-w-0 flex min-h-0 h-full flex-col",
              platformPaneGridCellFillClass,
              platformPaneCellPaddingClass
            )}
          >
            <Card
              className={cn(
                platformPaneTileClass,
                "flex flex-1 min-h-0 flex-col"
              )}
            >
              <CardHeader>
                <CardTitle>To Do</CardTitle>
              </CardHeader>

              <div className={cn("min-h-0 flex-1", platformPaneStackGapClass)}>
                {todoItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      dashboardRowLayoutClass,
                      platformPaneGridCellFillClass,
                      "hover:bg-surface-elevated/90 transition-colors group"
                    )}
                  >
                    <div className="p-2 rounded-none text-brand-500 shrink-0 flex items-center justify-center">
                      <item.icon className="h-5 w-5 shrink-0" />
                    </div>
                    <div className="flex-1 min-w-0 flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-text-primary group-hover:text-brand-500 transition-colors">
                        {item.label}
                      </p>
                      <div className="flex items-center gap-2 shrink-0">
                        {item.meta && (
                          <span className="text-xs text-text-muted">{item.meta}</span>
                        )}
                        <ArrowRight className="h-4 w-4 text-text-tertiary group-hover:text-brand-500 transition-colors" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </Card>
          </div>

          <div
            className={cn(
              "min-w-0 flex min-h-0 h-full flex-col lg:col-span-2",
              platformPaneGridCellFillClass,
              platformPaneCellPaddingClass
            )}
          >
            <Card
              className={cn(
                platformPaneTileClass,
                "flex flex-1 min-h-0 flex-col"
              )}
            >
              <CardHeader>
                <CardTitle>March 2026 Cycle</CardTitle>
              </CardHeader>

              <div className={cn("min-h-0 flex-1", platformPaneStackGapClass)}>
                {[
                  {
                    icon: Calendar,
                    label: "Submission Window",
                    dates: "Mar 1 - Mar 20",
                    active: true,
                    done: false,
                  },
                  {
                    icon: Sparkles,
                    label: "AI Scoring",
                    dates: "Mar 21 - Mar 23",
                    active: false,
                    done: false,
                  },
                  {
                    icon: Target,
                    label: "Community Voting",
                    dates: "Mar 24 - Mar 28",
                    active: false,
                    done: false,
                  },
                  {
                    icon: Trophy,
                    label: "Winner Announced",
                    dates: "Mar 29 - Mar 30",
                    active: false,
                    done: false,
                  },
                ].map((phase, i) => (
                  <div
                    key={i}
                    className={cn(
                      dashboardRowLayoutClass,
                      platformPaneGridCellFillClass,
                      "transition-all duration-200",
                      phase.active
                        ? "rounded-xl text-brand-500 shadow-sm bg-[color-mix(in_oklab,var(--color-brand-500)_10%,var(--color-surface-chrome))]"
                        : "hover:bg-surface-elevated/90"
                    )}
                  >
                    <div
                      className={cn(
                        "p-2 rounded-none shrink-0 flex items-center justify-center",
                        phase.active
                          ? "text-brand-500"
                          : phase.done
                            ? "text-success"
                            : "text-text-tertiary"
                      )}
                    >
                      <phase.icon className="h-5 w-5 shrink-0" />
                    </div>
                    <div className="flex-1">
                      <p
                        className={cn(
                          "text-sm font-medium",
                          phase.active ? "text-brand-500" : "text-text-primary"
                        )}
                      >
                        {phase.label}
                      </p>
                      <p
                        className={cn(
                          "text-xs",
                          phase.active
                            ? "text-brand-500/70"
                            : "text-text-secondary"
                        )}
                      >
                        {phase.dates}
                      </p>
                    </div>
                    {phase.active && (
                      <Badge
                        variant="brand"
                        className="normal-case tracking-normal shadow-sm"
                      >
                        <Clock className="h-3 w-3 mr-1" />
                        In Progress
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>

        {/* Stat tiles — gap-px only between cells */}
        <div
          className={cn(
            "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border-t border-solid border-border-default",
            platformPaneGridGapClass
          )}
        >
          <div
            className={cn(
              "min-w-0",
              platformPaneGridCellFillClass,
              platformPaneCellPaddingClass
            )}
          >
            <StatCard
              plain
              className={platformPaneTileClass}
              label="Points"
              labelTrailing={momPoints.text}
              labelTrailingTone={momPoints.tone}
              value={
                stats === undefined
                  ? "—"
                  : `+${stats.points.toLocaleString()}`
              }
            />
          </div>
          <div
            className={cn(
              "min-w-0",
              platformPaneGridCellFillClass,
              platformPaneCellPaddingClass
            )}
          >
            <StatCard
              plain
              className={platformPaneTileClass}
              label="Rank"
              labelTrailing={momRank.text}
              labelTrailingTone={momRank.tone}
              value={stats?.rank ? `#${stats.rank}` : "—"}
            />
          </div>
          <div
            className={cn(
              "min-w-0",
              platformPaneGridCellFillClass,
              platformPaneCellPaddingClass
            )}
          >
            <StatCard
              plain
              className={platformPaneTileClass}
              label="Network"
              labelTrailing={momNetwork.text}
              labelTrailingTone={momNetwork.tone}
              value={
                stats === undefined
                  ? "—"
                  : `+${stats.networkCount.toLocaleString()}`
              }
            />
          </div>
          <div
            className={cn(
              "min-w-0",
              platformPaneGridCellFillClass,
              platformPaneCellPaddingClass
            )}
          >
            <StatCard
              plain
              className={platformPaneTileClass}
              label="Earnings"
              labelTrailing={momEarnings.text}
              labelTrailingTone={momEarnings.tone}
              value={
                stats === undefined
                  ? "—"
                  : `$${stats.totalEarnings.toLocaleString()}`
              }
            />
          </div>
        </div>

        <div
          className={cn(
            "border-t border-solid border-border-default",
            platformPaneGridCellFillClass,
            platformPaneCellPaddingClass
          )}
        >
          <DashboardTrendsChart className={platformPaneTileClass} />
        </div>
      </div>
    </div>
  );
}
