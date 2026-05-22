"use client";

import { useState, useId, Fragment } from "react";
import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import {
  PLACE_LEADERBOARD_POINTS,
  PRIZE_SPLIT,
  splitCompetitorPrizePool,
  type CompetitorPrizeSplit,
} from "@/lib/hall-of-fame-prize-pool";
import { formatMonthYear } from "@/lib/utils";
import {
  Calendar,
  DollarSign,
  Users,
  Trophy,
  ChevronDown,
} from "lucide-react";

type PitchPlacement = {
  place: 1 | 2 | 3;
  projectId: string;
  title: string;
  score: number;
  team: { id: string; name: string }[];
};

type MonthRound = {
  month: string;
  grossPool: number;
  placements: PitchPlacement[];
};

const placeColors = {
  1: { trophy: "text-yellow-400", prize: "text-text-primary" },
  2: { trophy: "text-gray-300", prize: "text-text-primary" },
  3: { trophy: "text-amber-600", prize: "text-text-primary" },
} as const;

const placeOrdinalUnderTrophy: Record<1 | 2 | 3, string> = { 1: "1st", 2: "2nd", 3: "3rd" };
const poolSharePercent: Record<1 | 2 | 3, string> = {
  1: `${PRIZE_SPLIT.firstPlacePct}%`,
  2: `${PRIZE_SPLIT.secondPlacePct}%`,
  3: `${PRIZE_SPLIT.thirdPlacePct}%`,
};
const placeLabelColor: Record<1 | 2 | 3, string> = { 1: "text-yellow-400", 2: "text-gray-300", 3: "text-amber-600" };

type WinnerRowsProps = {
  split: CompetitorPrizeSplit;
  placements: PitchPlacement[];
};

function WinnerRows({ split, placements }: WinnerRowsProps) {
  const prizeForPlace = (place: 1 | 2 | 3) =>
    place === 1 ? split.first : place === 2 ? split.second : split.third;

  return (
    <div className="divide-y divide-border-subtle">
      {placements.map((p) => {
        const colors = placeColors[p.place];
        const submissionHref = `/pitches/${p.projectId}`;
        const prize = prizeForPlace(p.place);
        const bonusPts = PLACE_LEADERBOARD_POINTS[p.place];
        return (
          <div
            key={p.place}
            className="px-3 py-3 sm:px-4 hover:bg-white/[0.03] transition-colors"
          >
            <div className="flex gap-4 items-start">
              <div className="flex flex-col items-center gap-1 shrink-0 w-14">
                <Link href={submissionHref} className={`${colors.trophy}`} aria-label={`View submission: ${p.title}`}>
                  <Trophy className="h-5 w-5" />
                </Link>
                <span className={`text-[10px] font-mono tabular-nums text-center leading-tight ${placeLabelColor[p.place]}`}>
                  {placeOrdinalUnderTrophy[p.place]}
                </span>
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex gap-4 items-start justify-between">
                  <Link href={submissionHref} className="min-w-0 flex-1 block">
                    <p className="text-sm font-medium text-text-primary truncate">{p.title}</p>
                    <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                      <span className="text-xs text-text-muted">Score: {p.score}</span>
                      <span className="text-xs text-text-muted flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {p.team.length} {p.team.length === 1 ? "member" : "members"}
                      </span>
                    </div>
                  </Link>

                  <Link href={submissionHref} className="text-right shrink-0 min-w-[5.5rem]">
                    <p className={`text-lg sm:text-xl font-medium tabular-nums leading-tight ${colors.prize}`}>
                      ${prize.toLocaleString()}
                    </p>
                    <p className="mt-0.5 text-sm font-mono text-text-secondary tabular-nums">
                      +{bonusPts.toLocaleString()} pts · {poolSharePercent[p.place]}
                    </p>
                  </Link>
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {p.team.map((member) => (
                    <Link
                      key={member.id}
                      href={`/community/${member.id}`}
                      className="inline-flex items-center gap-1.5 py-1 pl-0 pr-2 rounded-lg bg-surface-card hover:bg-surface-overlay transition-colors text-xs text-text-secondary hover:text-text-primary"
                    >
                      <Avatar name={member.name} size="xs" />
                      {member.name}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

const DEMO_ROUNDS = [
  {
    _id: "r1",
    monthYear: "2026-02",
    totalCollected: 1250,
    winningSubmissions: [
      { place: 1, submissionId: "sub_w1", title: "Sola: Christian Apologetics for Gen Z", score: 92 },
      { place: 2, submissionId: "sub_w2", title: "Dermi: At-Home Skin Diagnostics", score: 89 },
      { place: 3, submissionId: "sub_w3", title: "Safelock: Locker Security", score: 84 },
    ],
    firstPlaceUser: { _id: "u3", fullName: "Jonah Elliot" },
    secondPlaceUser: { _id: "u1", fullName: "Alex Mi" },
    thirdPlaceUser: { _id: "u2", fullName: "Yichi Zhang" },
  },
  {
    _id: "r2",
    monthYear: "2026-01",
    totalCollected: 980,
    winningSubmissions: [
      { place: 1, submissionId: "sub_w4", title: "Milestone: Teen Driver Coach", score: 88 },
      { place: 2, submissionId: "sub_w5", title: "Lexx AI", score: 81 },
    ],
    firstPlaceUser: { _id: "u5", fullName: "Seowoong Park" },
    secondPlaceUser: { _id: "u10", fullName: "Lars Ostervold" },
    thirdPlaceUser: null,
  },
];

export default function ResultsPage() {
  const liveRounds = useQuery(
    api.prizes.getPastRounds,
    DEMO_MODE ? "skip" : {}
  );
  const rawRounds = DEMO_MODE
    ? (DEMO_ROUNDS as unknown as NonNullable<typeof liveRounds>)
    : liveRounds;

  const pastRounds: MonthRound[] = (rawRounds ?? []).map((pool) => {
    const placements: PitchPlacement[] = [];
    const winSubs = pool.winningSubmissions ?? [];
    const placeUsers = [pool.firstPlaceUser, pool.secondPlaceUser, pool.thirdPlaceUser];

    for (let i = 0; i < 3; i++) {
      const user = placeUsers[i];
      const sub = winSubs.find((s) => s.place === i + 1);
      if (user) {
        placements.push({
          place: (i + 1) as 1 | 2 | 3,
          projectId: sub?.submissionId ?? pool._id,
          title: sub?.title ?? user.fullName,
          score: sub?.score ?? 0,
          team: [{ id: user._id, name: user.fullName }],
        });
      }
    }

    return {
      month: formatMonthYear(pool.monthYear),
      grossPool: pool.totalCollected,
      placements,
    };
  });

  const [expandedMonth, setExpandedMonth] = useState<string | null>(null);
  const baseId = useId();

  const firstMonth = pastRounds[0]?.month ?? null;
  const effectiveExpanded = expandedMonth ?? firstMonth;

  const toggleMonth = (month: string) => {
    setExpandedMonth((m) => (m === month ? null : month));
  };

  if (rawRounds === undefined) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-circle border-2 border-brand-500 border-t-transparent" />
          <p className="text-sm text-text-secondary">Loading results...</p>
        </div>
      </div>
    );
  }

  if (pastRounds.length === 0) {
    return (
      <Card>
        <div className="py-12 text-center">
          <Trophy className="h-10 w-10 text-text-muted mx-auto mb-3" />
          <p className="text-sm text-text-secondary">
            No completed rounds yet. Check back after the first voting round finalizes.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card padding="none">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border-default">
              <th className="text-left text-xs font-medium text-text-muted uppercase tracking-wider px-4 py-3">Month</th>
              <th className="text-right text-xs font-medium text-text-muted uppercase tracking-wider px-4 py-3 whitespace-nowrap">Prize pool</th>
              <th className="w-12 px-2 py-3" aria-hidden />
            </tr>
          </thead>
          <tbody>
            {pastRounds.map((round) => {
              const open = effectiveExpanded === round.month;
              const panelId = `${baseId}-panel-${round.month.replace(/\s+/g, "-")}`;
              const prizeSplit = splitCompetitorPrizePool(round.grossPool);
              return (
                <Fragment key={round.month}>
                  <tr
                    className="border-b border-border-subtle hover:bg-surface-card-hover transition-colors cursor-pointer"
                    onClick={() => toggleMonth(round.month)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggleMonth(round.month); }
                    }}
                    tabIndex={0}
                    role="button"
                    aria-expanded={open}
                    aria-controls={open ? panelId : undefined}
                  >
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2 min-w-0">
                        <Calendar className="h-4 w-4 text-text-muted flex-shrink-0" />
                        <span className="text-sm font-medium text-text-primary truncate">{round.month}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-right whitespace-nowrap">
                      <Badge variant="brand" className="tabular-nums">
                        <DollarSign className="h-3 w-3 mr-1" />{prizeSplit.displayPool.toLocaleString()}
                      </Badge>
                    </td>
                    <td className="px-2 py-4 text-center">
                      <ChevronDown className={`h-4 w-4 text-text-muted mx-auto transition-transform duration-200 ${open ? "rotate-180" : ""}`} aria-hidden />
                    </td>
                  </tr>
                  {open && (
                    <tr className="border-b border-border-subtle bg-surface-secondary/50">
                      <td colSpan={3} className="px-4 py-4" id={panelId}>
                        <WinnerRows split={prizeSplit} placements={round.placements} />
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
