"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { type Id } from "../../../../../convex/_generated/dataModel";
import {
  CircleDollarSign,
  Calendar,
  CheckCircle,
  Trophy,
  Star,
  ExternalLink,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

export default function BountyReviewPage() {
  const params = useParams();
  const token = typeof params.token === "string" ? params.token : "";

  const bounty = useQuery(
    api.bounties.getByReviewToken,
    token ? { reviewToken: token } : "skip"
  );
  const pickWinner = useMutation(api.bounties.pickPreferredWinner);

  const [pickingId, setPickingId] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  // Loading
  if (bounty === undefined) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-surface-primary">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  // Not found / invalid token
  if (!bounty) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-surface-primary px-4">
        <div className="text-center max-w-sm">
          <CircleDollarSign className="h-12 w-12 text-text-muted mx-auto mb-4" />
          <h1 className="text-lg font-semibold text-text-primary mb-2">
            Review link not found
          </h1>
          <p className="text-sm text-text-secondary">
            This link may be invalid or expired. Please contact the admin for a
            new review link.
          </p>
        </div>
      </div>
    );
  }

  const currentPick = bounty.submissions.find((s) => s.entrepreneurPick);
  const isCompleted = bounty.status === "completed";

  async function handlePick(submissionId: Id<"bountySubmissions">) {
    setPickingId(submissionId);
    try {
      await pickWinner({
        reviewToken: token,
        bountySubmissionId: submissionId,
      });
      setConfirmed(true);
      setTimeout(() => setConfirmed(false), 3000);
    } finally {
      setPickingId(null);
    }
  }

  return (
    <div className="min-h-dvh bg-surface-primary">
      {/* Header */}
      <header className="border-b border-border-subtle bg-surface-chrome">
        <div className="max-w-3xl mx-auto px-4 py-4 sm:px-6">
          <p className="text-xs font-medium text-brand-500 tracking-wider uppercase">
            ACU Youth Venture
          </p>
          <h1 className="text-xl font-medium text-text-primary mt-1">
            Bounty Review
          </h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 sm:px-6 space-y-8">
        {/* Bounty Info */}
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-medium text-text-primary">
                {bounty.title}
              </h2>
              <p className="text-sm text-text-secondary mt-1">
                {bounty.founderName} · {bounty.founderCompany}
              </p>
            </div>
            <span className="text-2xl font-medium tabular-nums text-brand-500 shrink-0">
              ${bounty.bountyAmount.toLocaleString()}
            </span>
          </div>

          <p className="text-sm text-text-secondary leading-relaxed">
            {bounty.description}
          </p>

          <div className="flex items-center gap-4 text-xs text-text-muted">
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              Due {formatDate(bounty.dueDate)}
            </span>
            <span>{bounty.submissionsCount} submissions</span>
          </div>

          {bounty.requirements.length > 0 && (
            <div className="p-4 rounded-xl bg-surface-elevated border border-border-default">
              <p className="text-xs font-medium text-text-primary mb-2">
                Requirements
              </p>
              <ul className="space-y-1.5">
                {bounty.requirements.map((req, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-xs text-text-secondary"
                  >
                    <CheckCircle className="h-3.5 w-3.5 text-brand-500 flex-shrink-0 mt-0.5" />
                    {req}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="p-4 rounded-xl bg-brand-500/5 border border-brand-500/20">
          <p className="text-sm text-text-primary">
            {isCompleted
              ? "This bounty has been completed and a winner has been selected."
              : "Review the submissions below and select your preferred winner. The platform admin will confirm your choice."}
          </p>
        </div>

        {/* Success message */}
        {confirmed && (
          <div className="p-3 rounded-xl bg-success/10 border border-success/20 text-center">
            <p className="text-sm font-medium text-success">
              Your selection has been recorded. The admin will confirm the winner.
            </p>
          </div>
        )}

        {/* Submissions */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-text-primary">
            Submissions ({bounty.submissions.length})
          </h3>

          {bounty.submissions.length === 0 ? (
            <div className="p-8 rounded-xl bg-surface-elevated text-center">
              <p className="text-sm text-text-secondary">
                No submissions yet.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {bounty.submissions.map((sub) => {
                const isPicked = sub.entrepreneurPick === true;
                const isWinner = sub.isWinner;

                return (
                  <div
                    key={sub._id}
                    className={`p-4 rounded-xl border transition-colors ${
                      isWinner
                        ? "bg-success/5 border-success/30"
                        : isPicked
                          ? "bg-brand-500/5 border-brand-500/30"
                          : "bg-surface-elevated border-border-default"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-text-primary">
                            {sub.user?.fullName ?? "Unknown"}
                          </p>
                          {isWinner && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-success/20 text-success">
                              <Trophy className="h-3 w-3" />
                              Winner
                            </span>
                          )}
                          {isPicked && !isWinner && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-brand-500/20 text-brand-500">
                              <Star className="h-3 w-3" />
                              Your Pick
                            </span>
                          )}
                        </div>
                        {sub.user?.schoolName && (
                          <p className="text-xs text-text-muted mt-0.5">
                            {sub.user.schoolName}
                          </p>
                        )}
                        {sub.notes && (
                          <p className="text-xs text-text-secondary mt-2">
                            {sub.notes}
                          </p>
                        )}
                        <a
                          href={sub.submissionUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-brand-500 hover:text-brand-400 mt-2 transition-colors"
                        >
                          <ExternalLink className="h-3 w-3" />
                          View submission
                        </a>
                      </div>

                      {!isCompleted && (
                        <button
                          type="button"
                          disabled={pickingId !== null}
                          onClick={() =>
                            handlePick(sub._id as Id<"bountySubmissions">)
                          }
                          className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                            isPicked
                              ? "bg-brand-500 text-white"
                              : "bg-surface-overlay border border-border-default text-text-secondary hover:border-brand-500 hover:text-brand-500"
                          } disabled:opacity-50`}
                        >
                          {pickingId === sub._id
                            ? "Selecting..."
                            : isPicked
                              ? "Selected"
                              : "Select as Winner"}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
