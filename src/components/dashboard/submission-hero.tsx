"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

type SubmissionPhase =
  | "no_submission"
  | "submitted"
  | "ai_scoring"
  | "voting"
  | "winner"
  | "results";

interface SubmissionHeroProps {
  /** Phase the user's submission is in, drives copy + iconography. */
  phase: SubmissionPhase;
  /** Title of the submission, if any. */
  pitchTitle?: string;
  /** Optional team name. */
  teamName?: string;
  /** AI score (0-100), shown once phase === "ai_scoring" complete or later. */
  aiScore?: number;
  /** Community votes (post AI scoring). */
  voteCount?: number;
  /** Final placement (1, 2, 3...) once phase === "winner". */
  placement?: number;
  /** Pitch detail route (for "view" CTAs). */
  pitchHref?: string;
  /** Submit-new route (used when phase === "no_submission"). */
  submitHref?: string;
  className?: string;
}

const phaseConfig: Record<
  SubmissionPhase,
  {
    label: string;
    statusCopy: string;
  }
> = {
  no_submission: {
    label: "Open for Submission",
    statusCopy: "The window is open. Ship your pitch.",
  },
  submitted: {
    label: "Submitted",
    statusCopy: "Locked in. Awaiting the next phase.",
  },
  ai_scoring: {
    label: "AI Scoring",
    statusCopy: "Our judges are reviewing your pitch.",
  },
  voting: {
    label: "Community Voting",
    statusCopy: "The community decides. Rally your network.",
  },
  winner: {
    label: "Winner",
    statusCopy: "You took the cycle.",
  },
  results: {
    label: "Results In",
    statusCopy: "Cycle wrapped. Review your judge feedback.",
  },
};

export function SubmissionHero({
  phase,
  pitchTitle,
  teamName,
  aiScore,
  voteCount,
  placement,
  pitchHref = "/pitches",
  submitHref = "/pitches/new",
  className,
}: SubmissionHeroProps) {
  const cfg = phaseConfig[phase];

  // CTA varies by state
  const cta =
    phase === "no_submission"
      ? { label: "Submit Your Pitch", href: submitHref }
      : { label: "View Submission", href: pitchHref };

  return (
    <section
      className={cn(
        "relative flex h-full flex-col justify-between bg-surface-primary p-6 md:p-8",
        className
      )}
    >
      <div>
        <div className="flex items-center">
          <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-text-tertiary">
            {cfg.label}
          </span>
        </div>

        {phase === "no_submission" ? (
          <>
            <h2 className="mt-4 text-2xl font-bold tracking-tight text-text-primary md:text-3xl">
              Your move.
            </h2>
            <p className="mt-2 max-w-xl text-sm text-text-secondary md:text-base">
              {cfg.statusCopy}
            </p>
          </>
        ) : (
          <>
            <h2 className="mt-4 text-2xl font-bold tracking-tight text-text-primary md:text-3xl">
              {pitchTitle ?? "Untitled Pitch"}
            </h2>
            {teamName && (
              <p className="mt-1 text-sm text-text-secondary">
                Team {teamName}
              </p>
            )}
            <p className="mt-3 max-w-xl text-sm text-text-secondary">
              {cfg.statusCopy}
            </p>
          </>
        )}
      </div>

      {/* Metric strip — only shown when there's a metric worth showing */}
      {(aiScore !== undefined || voteCount !== undefined || placement) && (
        <div className="mt-6 grid grid-cols-2 gap-px bg-border-default md:grid-cols-3">
          {placement && (
            <div className="bg-surface-primary px-4 py-3">
              <p className="text-[11px] font-medium uppercase tracking-wider text-text-tertiary">
                Placement
              </p>
              <p className="mt-1 font-tron text-2xl font-bold text-text-primary">
                #{placement}
              </p>
            </div>
          )}
          {aiScore !== undefined && (
            <div className="bg-surface-primary px-4 py-3">
              <p className="text-[11px] font-medium uppercase tracking-wider text-text-tertiary">
                AI Score
              </p>
              <p className="mt-1 font-tron text-2xl font-bold text-text-primary">
                {aiScore}
                <span className="text-base text-text-tertiary">/100</span>
              </p>
            </div>
          )}
          {voteCount !== undefined && (
            <div className="bg-surface-primary px-4 py-3">
              <p className="text-[11px] font-medium uppercase tracking-wider text-text-tertiary">
                Community Votes
              </p>
              <p className="mt-1 font-tron text-2xl font-bold text-text-primary">
                {voteCount.toLocaleString()}
              </p>
            </div>
          )}
        </div>
      )}

      <div className="mt-6">
        <Link
          href={cta.href}
          className="inline-flex items-center gap-2 border border-border-default bg-surface-elevated px-5 py-2.5 text-sm font-medium text-text-primary transition-colors hover:bg-surface-overlay"
        >
          {cta.label}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}
