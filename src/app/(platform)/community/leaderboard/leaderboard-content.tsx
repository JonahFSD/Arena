"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import Link from "next/link";
import { InfoCallout } from "@/components/ui/info-callout";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";
import type { LucideIcon } from "lucide-react";
import {
  Crown,
  Info,
  Vote,
  Video,
  Star,
  Medal,
  Network,
  UserPlus,
  Target,
  CircleDollarSign,
  Sparkles,
} from "lucide-react";

/** Fixed point values; least → most. Bounty and AI score use formulas (see rows). */
const pointsBreakdown: Array<{
  action: string;
  icon: LucideIcon;
  points?: number;
  formula?: string;
}> = [
  { action: "Add an existing user to your network", points: 50, icon: Network },
  { action: "Vote in a monthly round", points: 100, icon: Vote },
  { action: "Submit a pitch as an individual or team member", points: 200, icon: Video },
  { action: "Submit a pitch as a team leader", points: 300, icon: Video },
  {
    action: "Make the top 10 submissions for a month",
    points: 400,
    icon: Target,
  },
  { action: "Invite a new user with your unique link", points: 500, icon: UserPlus },
  { action: "Win 3rd place", points: 500, icon: Medal },
  { action: "Win 2nd place", points: 750, icon: Medal },
  { action: "Win 1st place", points: 1000, icon: Crown },
  {
    action: "Win a bounty (points = 2× bounty $ amount)",
    icon: CircleDollarSign,
    formula: "= 2 × BOUNTY $",
  },
  {
    action: "Bonus points when AI score exceeds 70 out of 100",
    icon: Sparkles,
    formula: "= (YOUR AI SCORE-70) × 1000/30",
  },
];

const formatAvgScore = (n: number) =>
  (Math.round(n * 10) / 10).toFixed(1);

const LEADERBOARD_EDGE_PL = "pl-4 md:pl-6 lg:pl-8";
/** Matches main + top bar horizontal padding so Points aligns with Leaderboard range tabs. */
const LEADERBOARD_EDGE_PR = "pr-4 md:pr-6 lg:pr-8";

const LEADERBOARD_TBODY_DIVIDE_CLASS = "divide-y divide-border-default/60";

const RANK_STAR_CLASS: Record<1 | 2 | 3, string> = {
  1: "text-yellow-400",
  2: "text-gray-300",
  3: "text-amber-600",
};

const rankIcon = (rank: number) => {
  const number = (
    <span className="text-sm font-mono font-bold text-text-muted tabular-nums inline-block w-5 text-right">
      {rank}
    </span>
  );
  return (
    <div className="flex items-center gap-1">
      <span
        className="inline-flex h-4 w-4 flex-shrink-0 items-center justify-center"
        aria-hidden
      >
        {rank <= 3 && (
          <Star className={`h-4 w-4 ${RANK_STAR_CLASS[rank as 1 | 2 | 3]}`} />
        )}
      </span>
      {number}
    </div>
  );
};

export type LeaderboardRangeMode = "thisMonth" | "allTime";

export function LeaderboardContent({ range }: { range: LeaderboardRangeMode }) {
  const convexRange = range === "thisMonth" ? "thisMonth" : "allTime";
  const rawLeaders = useQuery(api.users.getLeaderboard, { range: convexRange });

  const rows =
    rawLeaders?.map((l) => ({
      id: l._id,
      name: l.fullName,
      school: l.schoolName ?? "",
      graduationYear: l.graduationYear ?? 0,
      wins: 0,
      avgScore: 0,
      totalEarnings: l.totalEarnings ?? 0,
      bountiesWon: 0,
      points: l.leaderboardPoints,
      rank: l.rank,
      avatarUrl: l.avatarUrl ?? null,
    })) ?? [];

  if (rawLeaders === undefined) {
    return (
      <div className="animate-fade-in">
        <div
          className={cn(
            "-mx-4 flex items-center justify-center py-16 text-text-muted md:-mx-6 lg:-mx-8"
          )}
        >
          Loading leaderboard...
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-[calc(1.5rem+25px)] animate-fade-in">
      <div
        className={cn(
          "min-w-0 max-w-none overflow-hidden rounded-none",
          "-mx-4 md:-mx-6 lg:-mx-8"
        )}
      >
        <div className="min-w-0 w-full overflow-x-auto lg:overflow-x-visible">
          <table className="w-full min-w-full border-collapse">
            <thead>
              <tr className="border-b border-border-default">
                <th
                  className={cn(
                    "min-w-[72px] py-3 pr-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted",
                    LEADERBOARD_EDGE_PL
                  )}
                >
                  Rank
                </th>
                <th className="whitespace-nowrap px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">
                  Member
                </th>
                <th className="w-[88px] whitespace-nowrap px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">
                  Grad year
                </th>
                <th className="hidden px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted sm:table-cell">
                  School
                </th>
                <th className="w-[100px] px-3 py-3 text-center text-xs font-medium uppercase tracking-wider text-text-muted">
                  Avg Score
                </th>
                <th className="w-[60px] px-3 py-3 text-center text-xs font-medium uppercase tracking-wider text-text-muted">
                  Wins
                </th>
                <th className="w-[80px] px-3 py-3 text-center text-xs font-medium uppercase tracking-wider text-text-muted">
                  Bounties
                </th>
                <th className="hidden w-[90px] px-3 py-3 text-right text-xs font-medium uppercase tracking-wider text-text-muted sm:table-cell">
                  Earnings
                </th>
                <th
                  className={cn(
                    "w-[90px] py-3 pl-3 text-right text-xs font-medium uppercase tracking-wider text-text-muted",
                    LEADERBOARD_EDGE_PR
                  )}
                >
                  Points
                </th>
              </tr>
            </thead>
            <tbody className={LEADERBOARD_TBODY_DIVIDE_CLASS}>
              {rows.map((leader) => (
                <tr
                  key={leader.id}
                  className="transition-colors hover:bg-surface-card-hover"
                >
                  <td className={cn("py-4 pr-3", LEADERBOARD_EDGE_PL)}>
                    <div className="flex items-center">
                      {rankIcon(leader.rank)}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-3 py-4">
                    <Link href={`/community/${leader.id}`}>
                      <div className="flex items-center gap-3">
                        <Avatar src={leader.avatarUrl} name={leader.name} size="sm" />
                        <span className="text-sm font-medium text-text-primary hover:text-brand-500 transition-colors">
                          {leader.name}
                        </span>
                      </div>
                    </Link>
                  </td>
                  <td className="whitespace-nowrap px-3 py-4">
                    <span className="text-sm font-mono text-text-secondary tabular-nums">
                      {leader.graduationYear}
                    </span>
                  </td>
                  <td className="hidden truncate px-3 py-4 text-sm text-text-secondary sm:table-cell">
                    {leader.school}
                  </td>
                  <td className="px-3 py-4 text-center">
                    <span className="text-sm font-mono text-text-primary tabular-nums">
                      {formatAvgScore(leader.avgScore)}
                    </span>
                  </td>
                  <td className="px-3 py-4 text-center">
                    <span className="text-sm text-text-primary">
                      {leader.wins}
                    </span>
                  </td>
                  <td className="px-3 py-4 text-center">
                    <span className="text-sm text-text-primary">
                      {leader.bountiesWon}
                    </span>
                  </td>
                  <td className="hidden px-3 py-4 text-right text-sm font-medium text-text-primary sm:table-cell">
                    {leader.totalEarnings > 0
                      ? `$${leader.totalEarnings.toLocaleString()}`
                      : "-"}
                  </td>
                  <td
                    className={cn(
                      "py-4 pl-3 text-right align-middle tabular-nums",
                      LEADERBOARD_EDGE_PR
                    )}
                  >
                    <span className="text-sm font-mono font-bold text-brand-500">
                      {leader.points.toLocaleString()}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <InfoCallout>
        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-xl bg-brand-500/10 p-2">
            <Info className="h-5 w-5 text-brand-500" />
          </div>
          <h2 className="text-lg font-semibold text-text-primary">
            How Points Are Calculated
          </h2>
        </div>
        <div className="space-y-1">
          {pointsBreakdown.map((item) => (
            <div
              key={item.action}
              className="flex items-center gap-2.5 rounded-lg border border-border-default bg-surface-elevated py-1.5 px-2.5"
            >
              <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md bg-brand-500/10">
                <item.icon className="h-3.5 w-3.5 text-brand-500" />
              </div>
              <span className="min-w-0 flex-1 text-sm leading-tight text-text-secondary">
                {item.action}
              </span>
              <span className="max-w-[min(100%,12rem)] shrink-0 text-right text-sm font-mono font-bold leading-tight text-brand-500 sm:max-w-none">
                {item.formula ?? `+${item.points!.toLocaleString()}`}
              </span>
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs text-text-muted">
          Members automatically lose membership on July 1st after their senior year.
          Archived members retain their historical points but are hidden from the active leaderboard.
        </p>
      </InfoCallout>
    </div>
  );
}
