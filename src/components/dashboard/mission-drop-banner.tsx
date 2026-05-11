"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface MissionDropBannerProps {
  /** Title of this week's challenge. */
  title: string;
  /** One-line teaser. */
  teaser: string;
  /** Prize amount as display string (e.g. "$500"). */
  prize: string;
  /** Countdown label (e.g. "Closes in 3d 14h"). Pre-computed by parent. */
  countdown: string;
  /** Where Accept CTA routes. */
  ctaHref: string;
  className?: string;
}

/**
 * Full-bleed Mission Drop banner. Landing-styled: dashed brand pill, gold
 * gradient text on the headline, restrained surfaces. Sits at the top of the
 * dashboard above the hairline pane grid.
 */
export function MissionDropBanner({
  title,
  teaser,
  prize,
  countdown,
  ctaHref,
  className,
}: MissionDropBannerProps) {
  return (
    <section
      className={cn(
        "relative overflow-hidden border border-border-default bg-surface-primary",
        className
      )}
    >
      {/* Faint cream wash — ambient warmth without gold accent */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 -right-24 h-80 w-80 rounded-circle bg-text-primary/[0.02] blur-[100px]"
      />

      <div className="relative grid grid-cols-1 gap-6 p-6 md:grid-cols-[1fr_auto] md:items-center md:gap-8 md:p-8">
        <div className="min-w-0">
          <div className="inline-flex items-center border border-dashed border-border-default px-3 py-1">
            <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-text-secondary">
              Mission Drop
            </span>
          </div>

          <h2 className="mt-4 text-2xl font-medium tracking-tight text-text-primary md:text-3xl">
            {title}
          </h2>

          <p className="mt-2 max-w-2xl text-sm text-text-secondary md:text-base">
            {teaser}
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-text-tertiary">
            <span>{countdown}</span>
            <span className="inline-flex items-center gap-1.5">
              <span className="font-medium text-text-primary">{prize}</span>
              <span>prize pool</span>
            </span>
          </div>
        </div>

        <div className="flex md:justify-end">
          <Link
            href={ctaHref}
            className="inline-flex items-center gap-2 border border-text-secondary bg-transparent px-6 py-3 text-sm font-medium text-text-primary transition-all hover:bg-surface-elevated hover:border-text-primary active:scale-[0.97]"
          >
            Accept Mission
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
