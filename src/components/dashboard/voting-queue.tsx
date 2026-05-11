"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface VotingQueueItem {
  /** Pitch id used to build the route. */
  id: string;
  title: string;
  /** Team / author display. */
  team: string;
  /** Optional 2-letter initials for the avatar bubble. */
  initials?: string;
}

interface VotingQueueProps {
  items: VotingQueueItem[];
  /** Route for the full voting flow. */
  href?: string;
  className?: string;
}

export function VotingQueue({
  items,
  href = "/pitches/voting",
  className,
}: VotingQueueProps) {
  return (
    <section
      className={cn("flex h-full flex-col bg-surface-primary", className)}
    >
      <header className="flex items-center justify-between px-6 pt-6 md:px-8 md:pt-8">
        <div>
          <h3 className="text-lg font-medium text-text-primary">
            Waiting on Your Vote
          </h3>
          <p className="mt-1 text-xs text-text-tertiary">
            {items.length} pitches in your queue
          </p>
        </div>
        <Link
          href={href}
          className="inline-flex items-center gap-1.5 bg-brand-500 px-3 py-1.5 text-xs font-medium uppercase tracking-wide text-black transition-colors hover:bg-brand-400"
        >
          Vote now
        </Link>
      </header>

      <div className="mt-4 flex flex-1 flex-col gap-px bg-border-default">
        {items.map((item) => (
          <Link
            key={item.id}
            href={`${href}?pitch=${item.id}`}
            className="group flex items-center gap-4 bg-surface-primary px-6 py-3 transition-colors hover:bg-surface-card-hover md:px-8"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center border border-border-default bg-surface-elevated font-tron text-[11px] font-medium uppercase text-text-secondary">
              {item.initials ?? item.team.slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-text-primary">
                {item.title}
              </p>
              <p className="truncate text-xs text-text-tertiary">{item.team}</p>
            </div>
            <ArrowRight className="h-4 w-4 shrink-0 text-text-tertiary transition-colors group-hover:text-text-primary" />
          </Link>
        ))}
      </div>
    </section>
  );
}
