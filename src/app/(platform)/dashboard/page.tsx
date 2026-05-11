"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import {
  type LucideIcon,
  ArrowRight,
  Handshake,
  CircleDollarSign,
  Network,
  Target,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MissionDropBanner } from "@/components/dashboard/mission-drop-banner";
import { SubmissionHero } from "@/components/dashboard/submission-hero";
import { AIFeedbackCard } from "@/components/dashboard/ai-feedback-card";
import {
  LeaderboardWidget,
  type LeaderboardRow,
} from "@/components/dashboard/leaderboard-widget";
import {
  VotingQueue,
  type VotingQueueItem,
} from "@/components/dashboard/voting-queue";
import { getDashboardStatMomPercent } from "@/lib/dashboard-trends-data";

/** Demo mode bypass — see (platform)/layout.tsx + .env.local. */
const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

const DEMO_STATS = {
  points: 3780,
  rank: 4,
  networkCount: 87,
  totalEarnings: 1250,
};

const DEMO_PENDING_INVITES: { _id: string }[] = [
  { _id: "i1" },
  { _id: "i2" },
];

const DashboardTrendsChart = dynamic(
  () =>
    import("@/components/dashboard/dashboard-trends-chart").then(
      (m) => m.DashboardTrendsChart
    ),
  {
    ssr: false,
    loading: () => (
      <div className="h-72 animate-pulse bg-surface-card" />
    ),
  }
);

/* ------------------------------------------------------------------ */
/* Demo seed data — mid-cycle (AI Scoring active).                    */
/* Replace with Convex queries in next pass.                          */
/* ------------------------------------------------------------------ */

const DEMO_MISSION_DROP = {
  title: "Build Something That Sells in 7 Days",
  teaser:
    "This week's challenge: ship a working MVP and acquire your first paying customer. Best execution wins.",
  prize: "$500",
  countdown: "Closes in 3d 14h",
  ctaHref: "/pitches/new",
};

const DEMO_SUBMISSION = {
  phase: "ai_scoring" as const,
  pitchTitle: "Onion — Privacy-First Messaging for Students",
  teamName: "Layered",
  pitchHref: "/pitches",
};

const DEMO_AI_FEEDBACK = {
  dimensions: [
    { label: "Clarity", score: 8.4 },
    { label: "Feasibility", score: 7.2 },
    { label: "Impact", score: 9.1 },
  ],
  snippet:
    "Strong problem framing and a sharp wedge into a real audience. The execution plan needs concrete week-one milestones.",
};

const DEMO_LEADERBOARD: LeaderboardRow[] = [
  { rank: 1, name: "Alex Mi", score: 4280, delta: 1 },
  { rank: 2, name: "Yichi Zhang", score: 4110, delta: 2 },
  { rank: 3, name: "Jonah Elliot", score: 3905, delta: -1 },
  { rank: 4, name: "You", score: 3780, delta: 3, isMe: true },
  { rank: 5, name: "Seowoong Park", score: 3540, delta: 0 },
];

const DEMO_VOTING_QUEUE: VotingQueueItem[] = [
  { id: "p1", title: "Dermi — At-Home Skin Diagnostics", team: "Alex Mi" },
  { id: "p2", title: "Safelock — Locker Security for Schools", team: "Yichi" },
  { id: "p3", title: "Milestone — Teen Driver Coach", team: "Seowoong" },
];

/* ------------------------------------------------------------------ */

/** Compact row layout inside hairline stacks. */
const rowLayoutClass =
  "group flex items-center gap-3 bg-surface-primary px-6 py-3 transition-colors hover:bg-surface-card-hover md:px-8";

export default function DashboardPage() {
  const liveStats = useQuery(
    api.users.getMyStats,
    DEMO_MODE ? "skip" : {}
  );
  const livePendingInvites = useQuery(
    api.collaborators.listMyInvitations,
    DEMO_MODE ? "skip" : {}
  );
  const stats = DEMO_MODE ? DEMO_STATS : liveStats;
  const pendingInvites = DEMO_MODE
    ? DEMO_PENDING_INVITES
    : livePendingInvites;

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

  const statTiles: {
    label: string;
    value: string;
    delta: ReturnType<typeof getDashboardStatMomPercent>;
  }[] = [
    {
      label: "Points",
      value:
        stats === undefined
          ? "—"
          : `+${stats.points.toLocaleString()}`,
      delta: momPoints,
    },
    {
      label: "Rank",
      value: stats?.rank ? `#${stats.rank}` : "—",
      delta: momRank,
    },
    {
      label: "Network",
      value:
        stats === undefined
          ? "—"
          : `+${stats.networkCount.toLocaleString()}`,
      delta: momNetwork,
    },
    {
      label: "Earnings",
      value:
        stats === undefined
          ? "—"
          : `$${stats.totalEarnings.toLocaleString()}`,
      delta: momEarnings,
    },
  ];

  // Wrapper for each section: transparent parent + border on the section block
  // so the backdrop bleeds into the space between sections instead of being
  // hidden by a solid bg-border-default slab.
  return (
    <div className="animate-fade-in flex w-full flex-col gap-6">
      {/* 1. Mission Drop banner — bordered block */}
      <div className="border border-border-default">
        <MissionDropBanner
          title={DEMO_MISSION_DROP.title}
          teaser={DEMO_MISSION_DROP.teaser}
          prize={DEMO_MISSION_DROP.prize}
          countdown={DEMO_MISSION_DROP.countdown}
          ctaHref={DEMO_MISSION_DROP.ctaHref}
        />
      </div>

      {/* 2. Submission Hero (2/3) + AI Feedback (1/3) — internal hairline split */}
      <div className="grid grid-cols-1 border border-border-default lg:grid-cols-3 lg:divide-x lg:divide-border-default">
        <SubmissionHero
          className="lg:col-span-2"
          phase={DEMO_SUBMISSION.phase}
          pitchTitle={DEMO_SUBMISSION.pitchTitle}
          teamName={DEMO_SUBMISSION.teamName}
          pitchHref={DEMO_SUBMISSION.pitchHref}
        />
        <AIFeedbackCard
          pending
          dimensions={DEMO_AI_FEEDBACK.dimensions}
          snippet={DEMO_AI_FEEDBACK.snippet}
          href={DEMO_SUBMISSION.pitchHref}
        />
      </div>

      {/* 3. Stat tiles — grid with internal hairlines */}
      <div className="grid grid-cols-2 border border-border-default divide-x divide-border-default lg:grid-cols-4 [&>*:nth-child(n+3)]:border-t [&>*:nth-child(n+3)]:border-border-default lg:[&>*:nth-child(n+3)]:border-t-0">
        {statTiles.map((tile) => (
          <div key={tile.label} className="bg-surface-primary p-6 md:p-8">
            <div className="flex items-baseline justify-between gap-2">
              <p className="text-xs uppercase tracking-wider text-text-tertiary">
                {tile.label}
              </p>
              {tile.delta.text && (
                <p
                  className={cn(
                    "text-xs tabular-nums",
                    tile.delta.tone === "positive"
                      ? "text-success"
                      : tile.delta.tone === "negative"
                        ? "text-error"
                        : "text-text-muted"
                  )}
                >
                  {tile.delta.text}
                </p>
              )}
            </div>
            <p className="mt-3 font-tron text-3xl font-medium tracking-tight text-text-primary">
              {tile.value}
            </p>
          </div>
        ))}
      </div>

      {/* 4. Leaderboard + Voting Queue — split row with internal hairline */}
      <div className="grid grid-cols-1 border border-border-default lg:grid-cols-2 lg:divide-x lg:divide-border-default">
        <LeaderboardWidget rows={DEMO_LEADERBOARD} href="/leaderboard" />
        <VotingQueue items={DEMO_VOTING_QUEUE} href="/pitches/voting" />
      </div>

      {/* 5. Trends chart — bordered block */}
      <div className="border border-border-default bg-surface-primary p-6 md:p-8">
        <DashboardTrendsChart />
      </div>

      {/* 6. To Do — bordered block, internal row hairlines */}
      <section className="border border-border-default bg-surface-primary">
        <header className="px-6 pt-6 md:px-8 md:pt-8">
          <h3 className="text-lg font-medium text-text-primary">To Do</h3>
        </header>
        <div className="mt-4 flex flex-col divide-y divide-border-default">
          {todoItems.map((item) => (
            <Link key={item.href} href={item.href} className={rowLayoutClass}>
              <item.icon className="h-4 w-4 shrink-0 text-text-tertiary transition-colors group-hover:text-text-primary" />
              <p className="flex-1 truncate text-sm font-medium text-text-primary">
                {item.label}
              </p>
              {item.meta && (
                <span className="shrink-0 text-xs text-text-muted">
                  {item.meta}
                </span>
              )}
              <ArrowRight className="h-4 w-4 shrink-0 text-text-tertiary transition-colors group-hover:text-text-primary" />
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
