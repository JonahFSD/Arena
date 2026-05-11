"use client";

import Link from "next/link";
import { ArrowRight, ArrowUp, ArrowDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

export interface LeaderboardRow {
  rank: number;
  name: string;
  /** Total points or score this cycle. */
  score: number;
  /** Rank change vs last cycle (positive = moved up). */
  delta: number;
  /** True for the current user's row (highlights). */
  isMe?: boolean;
}

interface LeaderboardWidgetProps {
  rows: LeaderboardRow[];
  /** Where the "see full" CTA routes. */
  href?: string;
  className?: string;
}

function DeltaIndicator({ delta }: { delta: number }) {
  if (delta > 0) {
    return (
      <span className="inline-flex items-center gap-0.5 text-xs tabular-nums text-success">
        <ArrowUp className="h-3 w-3" />
        {delta}
      </span>
    );
  }
  if (delta < 0) {
    return (
      <span className="inline-flex items-center gap-0.5 text-xs tabular-nums text-error">
        <ArrowDown className="h-3 w-3" />
        {Math.abs(delta)}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-0.5 text-xs tabular-nums text-text-muted">
      <Minus className="h-3 w-3" />0
    </span>
  );
}

export function LeaderboardWidget({
  rows,
  href = "/leaderboard",
  className,
}: LeaderboardWidgetProps) {
  return (
    <section
      className={cn("flex h-full flex-col bg-surface-primary", className)}
    >
      <header className="flex items-center justify-between px-6 pt-6 md:px-8 md:pt-8">
        <h3 className="text-lg font-medium text-text-primary">Leaderboard</h3>
        <Link
          href={href}
          className="inline-flex items-center gap-1 text-xs font-medium text-text-secondary transition-colors hover:text-text-primary"
        >
          See all
          <ArrowRight className="h-3 w-3" />
        </Link>
      </header>

      <div className="mt-4 flex flex-1 flex-col gap-px bg-border-default">
        {rows.map((row) => (
          <div
            key={`${row.rank}-${row.name}`}
            className={cn(
              "flex items-center justify-between gap-4 px-6 py-3 md:px-8",
              row.isMe ? "bg-brand-500/[0.06]" : "bg-surface-primary"
            )}
          >
            <div className="flex min-w-0 items-center gap-4">
              <span
                className={cn(
                  "font-tron w-6 text-sm font-medium tabular-nums",
                  row.isMe ? "text-text-primary" : "text-text-tertiary"
                )}
              >
                {row.rank.toString().padStart(2, "0")}
              </span>
              <span
                className={cn(
                  "truncate text-sm",
                  row.isMe
                    ? "font-medium text-text-primary"
                    : "text-text-primary"
                )}
              >
                {row.name}
                {row.isMe && (
                  <span className="ml-2 text-[10px] uppercase tracking-wider text-brand-500">
                    You
                  </span>
                )}
              </span>
            </div>

            <div className="flex shrink-0 items-center gap-4">
              <DeltaIndicator delta={row.delta} />
              <span className="font-tron text-sm font-medium tabular-nums text-text-primary">
                {row.score.toLocaleString()}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
