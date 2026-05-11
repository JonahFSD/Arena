"use client";

import { useState, useRef, useCallback } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Id } from "../../../../../convex/_generated/dataModel";
import { InfoCallout } from "@/components/ui/info-callout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import {
  Clock,
  Play,
  GripVertical,
  Send,
  Pencil,
  Lock,
  Info,
  Vote,
} from "lucide-react";

type VotingState = "idle" | "submitted" | "editing";

type SubmissionItem = {
  id: string;
  title: string;
  description: string;
  user: { name: string; school: string };
  score: number;
};

export default function VotingPage() {
  const roundData = useQuery(api.voting.getCurrentRound);
  const castVotes = useMutation(api.voting.castVotes);

  const [submissions, setSubmissions] = useState<SubmissionItem[]>([]);
  const [initialized, setInitialized] = useState(false);
  const [votingState, setVotingState] = useState<VotingState>("idle");
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null);

  // Touch drag state
  const touchStartY = useRef(0);
  const touchDragIndex = useRef<number | null>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Initialize submissions from query data once loaded
  if (roundData && roundData.submissions && !initialized) {
    const mapped = roundData.submissions.map((sub) => ({
      id: sub._id,
      title: sub.title,
      description: sub.description ?? "",
      user: {
        name: sub.user?.fullName ?? "Unknown",
        school: sub.user?.schoolName ?? "",
      },
      score: sub.aiScore?.overallScore ?? 0,
    }));
    setSubmissions(mapped);
    setInitialized(true);
  }

  const isLocked = votingState === "submitted";
  const canDrag = votingState !== "submitted";

  // ── Drag and Drop (Desktop) ──

  const handleDragStart = useCallback(
    (e: React.DragEvent, index: number) => {
      if (!canDrag) return;
      setDraggedIndex(index);
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", String(index));
      if (e.currentTarget instanceof HTMLElement) {
        requestAnimationFrame(() => {
          (e.currentTarget as HTMLElement).style.opacity = "0.4";
        });
      }
    },
    [canDrag]
  );

  const handleDragEnd = useCallback((e: React.DragEvent) => {
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = "1";
    }
    setDraggedIndex(null);
    setDropTargetIndex(null);
  }, []);

  const handleDragOver = useCallback(
    (e: React.DragEvent, index: number) => {
      if (!canDrag) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      setDropTargetIndex(index);
    },
    [canDrag]
  );

  const handleDrop = useCallback((e: React.DragEvent, toIndex: number) => {
    e.preventDefault();
    const fromIndex = Number(e.dataTransfer.getData("text/plain"));
    if (fromIndex === toIndex) {
      setDropTargetIndex(null);
      return;
    }
    setSubmissions((prev) => {
      const updated = [...prev];
      const [moved] = updated.splice(fromIndex, 1);
      updated.splice(toIndex, 0, moved);
      return updated;
    });
    setDropTargetIndex(null);
    setDraggedIndex(null);
  }, []);

  // ── Touch Drag (Mobile) ──

  const handleTouchStart = useCallback(
    (index: number, y: number) => {
      if (!canDrag) return;
      touchStartY.current = y;
      touchDragIndex.current = index;
      setDraggedIndex(index);
    },
    [canDrag]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (touchDragIndex.current === null || !canDrag) return;
      const touchY = e.touches[0].clientY;

      for (let i = 0; i < cardRefs.current.length; i++) {
        const card = cardRefs.current[i];
        if (!card) continue;
        const rect = card.getBoundingClientRect();
        if (touchY >= rect.top && touchY <= rect.bottom) {
          setDropTargetIndex(i);
          break;
        }
      }
    },
    [canDrag]
  );

  const handleTouchEnd = useCallback(() => {
    if (
      touchDragIndex.current !== null &&
      dropTargetIndex !== null &&
      touchDragIndex.current !== dropTargetIndex
    ) {
      setSubmissions((prev) => {
        const updated = [...prev];
        const [moved] = updated.splice(touchDragIndex.current!, 1);
        updated.splice(dropTargetIndex, 0, moved);
        return updated;
      });
    }
    touchDragIndex.current = null;
    setDraggedIndex(null);
    setDropTargetIndex(null);
  }, [dropTargetIndex]);

  // ── Actions ──

  const handleSubmitVote = async () => {
    if (!roundData) return;
    try {
      await castVotes({
        roundId: roundData._id,
        submissionIds: submissions.map(
          (s) => s.id as Id<"submissions">
        ),
      });
      setVotingState("submitted");
    } catch (err) {
      window.alert(
        err instanceof Error ? err.message : "Failed to submit vote"
      );
    }
  };

  const handleEditVote = () => {
    setVotingState("editing");
  };

  // ── Loading state ──
  if (roundData === undefined) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-circle border-2 border-brand-500 border-t-transparent" />
          <p className="text-sm text-text-secondary">Loading voting round...</p>
        </div>
      </div>
    );
  }

  // ── No active round ──
  if (roundData === null) {
    return (
      <Card>
        <div className="py-12 text-center">
          <Vote className="h-10 w-10 text-text-muted mx-auto mb-3" />
          <p className="text-sm font-medium text-text-primary mb-1">
            No active voting round
          </p>
          <p className="text-xs text-text-secondary">
            The next voting round will open at the start of the month. Check back soon.
          </p>
        </div>
      </Card>
    );
  }

  // Calculate remaining days
  const now = Date.now();
  const msRemaining = roundData.closesAt - now;
  const daysRemaining = Math.max(0, Math.ceil(msRemaining / (1000 * 60 * 60 * 24)));

  // Format month for display
  const [yearStr, monthStr] = roundData.monthYear.split("-");
  const roundDate = new Date(Number(yearStr), Number(monthStr) - 1, 1);
  const roundLabel = roundDate.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const prizePoolAmount = roundData.prizePool?.totalCollected;

  return (
    <div className="space-y-6">
      {/* Voting Round Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-brand-500/5 to-transparent border border-solid border-border-default">
        <div>
          <h2 className="text-lg font-bold text-text-primary">
            {roundLabel} Voting Round
          </h2>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            <Badge variant="brand">
              <Clock className="h-3 w-3 mr-1" />
              {daysRemaining} {daysRemaining === 1 ? "day" : "days"} remaining
            </Badge>
            {prizePoolAmount != null && (
              <span className="text-sm text-text-secondary">
                ${prizePoolAmount.toLocaleString()} pool
              </span>
            )}
          </div>
        </div>

        {/* Submit / Edit Button */}
        {isLocked ? (
          <Button
            variant="secondary"
            size="lg"
            onClick={handleEditVote}
            leftIcon={<Pencil className="h-4 w-4" />}
          >
            Edit Vote
          </Button>
        ) : (
          <Button
            variant="brand"
            size="lg"
            onClick={handleSubmitVote}
            leftIcon={<Send className="h-4 w-4" />}
          >
            Submit Vote
          </Button>
        )}
      </div>

      {/* Instruction */}
      <InfoCallout padding="none" className="flex items-center gap-2 px-4 py-2.5">
        <Info className="h-4 w-4 text-brand-500 flex-shrink-0" />
        <p className="text-sm text-text-secondary">
          {isLocked ? (
            <>
              Your vote has been submitted.{" "}
              <span className="text-text-primary font-medium">
                Click &quot;Edit Vote&quot; to change your ranking.
              </span>
            </>
          ) : (
            <>
              Drag and reorder the cards to rank your favorites.{" "}
              <span className="text-text-primary font-medium">
                #1 is your top pick.
              </span>
            </>
          )}
        </p>
      </InfoCallout>

      {/* Empty submissions */}
      {submissions.length === 0 && (
        <Card>
          <div className="py-12 text-center">
            <p className="text-sm text-text-secondary">
              No eligible submissions for this voting round yet.
            </p>
          </div>
        </Card>
      )}

      {/* Ranked Cards */}
      {submissions.length > 0 && (
        <div className="space-y-3" onTouchMove={handleTouchMove}>
          {submissions.map((sub, index) => {
            const isDragging = draggedIndex === index;
            const isDropTarget =
              dropTargetIndex === index && draggedIndex !== index;

            return (
              <div
                key={sub.id}
                ref={(el) => {
                  cardRefs.current[index] = el;
                }}
                draggable={canDrag}
                onDragStart={(e) => handleDragStart(e, index)}
                onDragEnd={handleDragEnd}
                onDragOver={(e) => handleDragOver(e, index)}
                onDrop={(e) => handleDrop(e, index)}
                onTouchStart={(e) =>
                  handleTouchStart(index, e.touches[0].clientY)
                }
                onTouchEnd={handleTouchEnd}
                className={`flex items-center gap-4 transition-all duration-200 ${
                  isDragging ? "opacity-40" : ""
                } ${isDropTarget ? "translate-y-1" : ""}`}
              >
                {/* Rank Number */}
                <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-surface-elevated border border-border-default flex items-center justify-center">
                  <span
                    className={`text-lg font-bold ${
                      index === 0
                        ? "text-yellow-400"
                        : index === 1
                          ? "text-gray-300"
                          : index === 2
                            ? "text-amber-600"
                            : "text-text-muted"
                    }`}
                  >
                    {index + 1}
                  </span>
                </div>

                {/* Card */}
                <div
                  className={`flex-1 flex items-stretch rounded-xl border overflow-hidden transition-all duration-200 ${
                    isLocked
                      ? "border-border-default bg-surface-card"
                      : isDropTarget
                        ? "border-brand-500 bg-surface-card shadow-glow"
                        : "border-border-default bg-surface-card hover:border-border-strong hover:bg-surface-card-hover"
                  } ${canDrag ? "cursor-grab active:cursor-grabbing" : ""}`}
                >
                  {/* Drag Handle */}
                  <div
                    className={`flex items-center px-3 border-r border-border-default ${
                      isLocked
                        ? "text-text-muted"
                        : "text-text-tertiary hover:text-text-secondary"
                    }`}
                  >
                    {isLocked ? (
                      <Lock className="h-4 w-4" />
                    ) : (
                      <GripVertical className="h-5 w-5" />
                    )}
                  </div>

                  {/* Video Thumbnail */}
                  <div className="relative w-80 sm:w-[500px] flex-shrink-0 bg-surface-elevated group cursor-pointer">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/20" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="p-3 rounded-full bg-white/20 backdrop-blur-sm group-hover:bg-white/30 transition-colors">
                        <Play className="h-6 w-6 text-white fill-white" />
                      </div>
                    </div>
                    {/* Aspect ratio placeholder */}
                    <div className="aspect-[16/10]" />
                  </div>

                  {/* Details */}
                  <div className="flex-1 p-5 min-w-0 overflow-hidden">
                    <Badge
                      variant="brand"
                      className="text-xs bg-brand-500/80 text-black font-bold mb-2"
                    >
                      AI Score: {sub.score}
                    </Badge>
                    <h3 className="text-base font-semibold text-text-primary truncate">
                      {sub.title}
                    </h3>
                    <p className="text-sm text-text-secondary line-clamp-2 mt-1">
                      {sub.description}
                    </p>
                    <div className="flex items-center gap-2 mt-3">
                      <Avatar name={sub.user.name} size="sm" />
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-text-primary truncate">
                          {sub.user.name}
                        </p>
                        <p className="text-[10px] text-text-muted truncate">
                          {sub.user.school}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Submitted confirmation */}
      {isLocked && (
        <div className="p-4 rounded-xl bg-success/5 border border-success/20 text-center animate-fade-in">
          <p className="text-sm text-success font-medium">
            Your rank-choice vote has been submitted!
          </p>
          <p className="text-xs text-text-secondary mt-1">
            You can edit your ranking until voting closes.
          </p>
        </div>
      )}
    </div>
  );
}
