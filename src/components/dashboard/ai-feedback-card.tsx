"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface AIFeedbackDimension {
  label: string;
  /** Score on 0-10 scale. */
  score: number;
}

interface AIFeedbackCardProps {
  /** When true, render a "pending" state instead of feedback content. */
  pending?: boolean;
  /** Dimensional scores (typically 3: Clarity, Feasibility, Impact). */
  dimensions?: AIFeedbackDimension[];
  /** Snippet of judge feedback, 1-2 sentences. */
  snippet?: string;
  /** Where to route for the full breakdown. */
  href?: string;
  className?: string;
}

export function AIFeedbackCard({
  pending = false,
  dimensions = [],
  snippet,
  href = "/pitches",
  className,
}: AIFeedbackCardProps) {
  return (
    <section
      className={cn(
        "relative flex h-full flex-col bg-surface-primary p-6 md:p-8",
        className
      )}
    >
      <div className="flex items-center">
        <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-text-tertiary">
          AI Judge
        </span>
      </div>

      {pending ? (
        <>
          <h3 className="mt-4 text-lg font-medium text-text-primary">
            Scoring in progress
          </h3>
          <p className="mt-2 text-sm text-text-secondary">
            Your pitch is queued with the AI judge. Feedback drops when scoring
            closes.
          </p>

          {/* Skeleton dimension rows */}
          <div className="mt-6 flex flex-col gap-px bg-border-default">
            {["Clarity", "Feasibility", "Impact"].map((label) => (
              <div
                key={label}
                className="flex items-center justify-between bg-surface-primary px-4 py-3"
              >
                <span className="text-xs uppercase tracking-wider text-text-tertiary">
                  {label}
                </span>
                <div className="h-2 w-24 animate-pulse bg-surface-elevated" />
              </div>
            ))}
          </div>
        </>
      ) : (
        <>
          <h3 className="mt-4 text-lg font-medium text-text-primary">
            Last cycle feedback
          </h3>

          {dimensions.length > 0 && (
            <div className="mt-4 flex flex-col gap-px bg-border-default">
              {dimensions.map((d) => (
                <div
                  key={d.label}
                  className="flex items-center justify-between gap-4 bg-surface-primary px-4 py-3"
                >
                  <span className="text-xs uppercase tracking-wider text-text-tertiary">
                    {d.label}
                  </span>
                  <div className="flex items-center gap-3">
                    <div className="h-1.5 w-24 bg-surface-elevated">
                      <div
                        className="h-full bg-text-primary"
                        style={{ width: `${(d.score / 10) * 100}%` }}
                      />
                    </div>
                    <span className="font-tron text-sm font-medium tabular-nums text-text-primary">
                      {d.score.toFixed(1)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {snippet && (
            <blockquote className="mt-5 border-l-2 border-border-default pl-4 text-sm italic text-text-secondary">
              {snippet}
            </blockquote>
          )}
        </>
      )}

      <div className="mt-auto pt-6">
        <Link
          href={href}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-text-secondary transition-colors hover:text-text-primary"
        >
          View full breakdown
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </section>
  );
}
