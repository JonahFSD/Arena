"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Id } from "../../../../../convex/_generated/dataModel";
import { Card, CardTitle } from "@/components/ui/card";
import { InfoCallout } from "@/components/ui/info-callout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar } from "@/components/ui/avatar";
import {
  ArrowLeft,
  Video,
  Code,
  Globe,
  FileText,
  Calendar,
  Eye,
  Star,
  Brain,
  Lightbulb,
  Target,
  Users,
  Presentation,
  Heart,
  ChevronDown,
  ChevronUp,
  Handshake,
  Shield,
  CheckCircle,
  XCircle,
  Loader2,
} from "lucide-react";
import { useState } from "react";
import { formatMonthYear } from "@/lib/utils";


const statusVariant = (status: string) => {
  switch (status) {
    case "scored": return "success";
    case "submitted": return "warning";
    case "draft": return "default";
    default: return "default";
  }
};

export default function SubmissionDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const submission = useQuery(api.submissions.getById, {
    submissionId: id as Id<"submissions">,
  });
  const respondToInvite = useMutation(api.collaborators.respond);
  const [expandedCategory, setExpandedCategory] = useState<number | null>(null);
  const [inviteBusy, setInviteBusy] = useState<"accept" | "deny" | null>(null);

  if (submission === undefined) {
    return (
      <div className="max-w-4xl mx-auto flex items-center justify-center py-24">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-circle border-2 border-brand-500 border-t-transparent" />
          <p className="text-sm text-text-secondary">Loading submission...</p>
        </div>
      </div>
    );
  }

  if (submission === null) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
        <Card><p className="text-sm text-text-secondary">Submission not found.</p></Card>
      </div>
    );
  }

  const categoryIcons: Record<string, typeof Lightbulb> = {
    "Innovation & Originality": Lightbulb,
    "Market Understanding": Target,
    "Feasibility & Execution": Star,
    "Presentation Quality": Presentation,
    "Faith Alignment": Heart,
  };

  const rubricCategories = submission.aiScore?.categoryScores
    ? submission.aiScore.categoryScores.map((cat) => ({
        name: cat.category, score: cat.score, max: cat.maxScore,
        icon: categoryIcons[cat.category] ?? Lightbulb, feedback: cat.feedback,
      }))
    : [];

  const overallScore = submission.aiScore?.overallScore ?? 0;
  const maxScore = 100;

  const teamMembers: { id: string; name: string; role: string }[] = [];
  if (submission.user) {
    teamMembers.push({ id: submission.user._id, name: submission.user.fullName, role: "Lead" });
  }
  for (const collab of submission.collaborators) {
    teamMembers.push({ id: collab.userId, name: collab.user?.fullName ?? "Unknown", role: collab.role === "lead" ? "Lead" : "Collaborator" });
  }

  const pendingInvite =
    submission.viewerCollaborator?.status === "pending"
      ? submission.viewerCollaborator
      : undefined;

  const handleInviteResponse = async (accept: boolean) => {
    if (!submission.viewerCollaborator) return;
    setInviteBusy(accept ? "accept" : "deny");
    try {
      await respondToInvite({
        collaboratorId: submission.viewerCollaborator._id,
        accept,
      });
    } finally {
      setInviteBusy(null);
    }
  };

  const supportingLinks = [
    submission.githubUrl ? { icon: Code, label: "GitHub Repo", url: submission.githubUrl } : null,
    submission.websiteUrl ? { icon: Globe, label: "Live Demo", url: submission.websiteUrl } : null,
    submission.slideDeckUrl ? { icon: FileText, label: "Slide Deck", url: submission.slideDeckUrl } : null,
  ].filter(Boolean) as { icon: typeof Code; label: string; url: string }[];

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div className="space-y-2">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-2xl font-medium text-text-primary">{submission.title}</h1>
          <Badge variant={statusVariant(submission.status)}>{submission.status.charAt(0).toUpperCase() + submission.status.slice(1)}</Badge>
        </div>
        <div className="flex items-center gap-4 text-sm text-text-secondary flex-wrap">
          <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{formatMonthYear(submission.monthYear)}</span>
          <span className="flex items-center gap-1"><Eye className="h-3.5 w-3.5" />{submission.voteCount} vote{submission.voteCount !== 1 ? "s" : ""}</span>
        </div>
      </div>

      {pendingInvite && (
        <Card className="bg-surface-elevated">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-text-primary">Team invitation</p>
              <p className="text-xs text-text-secondary mt-1">
                Accept to join this pitch with the proposed revenue share below, or decline to pass.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                type="button"
                variant="danger"
                size="sm"
                disabled={inviteBusy !== null}
                onClick={() => handleInviteResponse(false)}
                leftIcon={
                  inviteBusy === "deny" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <XCircle className="h-4 w-4" />
                  )
                }
              >
                Deny
              </Button>
              <Button
                type="button"
                variant="brand"
                size="sm"
                disabled={inviteBusy !== null}
                onClick={() => handleInviteResponse(true)}
                leftIcon={
                  inviteBusy === "accept" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle className="h-4 w-4" />
                  )
                }
              >
                Accept
              </Button>
            </div>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {submission.videoUrl ? (
            <Card padding="none" className="overflow-hidden">
              <div className="aspect-video bg-surface-elevated flex items-center justify-center relative group cursor-pointer">
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <a href={submission.videoUrl} target="_blank" rel="noopener noreferrer" className="p-4 rounded-2xl bg-surface-elevated/80 backdrop-blur-sm group-hover:bg-surface-overlay/90 transition-colors">
                  <Video className="h-10 w-10 text-text-primary" />
                </a>
                <div className="absolute bottom-4 left-4"><p className="text-sm font-medium text-white">Pitch Video</p></div>
              </div>
            </Card>
          ) : (
            <Card padding="none" className="overflow-hidden">
              <div className="aspect-video bg-surface-elevated flex items-center justify-center">
                <div className="p-4 rounded-2xl bg-surface-overlay"><Video className="h-10 w-10 text-text-muted" /></div>
              </div>
            </Card>
          )}

          <Card>
            <CardTitle>Description</CardTitle>
            <p className="text-sm text-text-secondary leading-relaxed mt-3">{submission.description}</p>
          </Card>

          {submission.aiScore && rubricCategories.length > 0 && (
            <Card>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-surface-elevated"><Brain className="h-5 w-5 text-text-secondary" /></div>
                  <div><CardTitle>AI Scoring Results</CardTitle><p className="text-xs text-text-muted mt-0.5">Rubric v2.1</p></div>
                </div>
                <div className="text-right">
                  <p className="text-4xl font-light text-text-primary">{overallScore}</p>
                  <p className="text-xs text-text-muted">/ {maxScore}</p>
                </div>
              </div>

              <div className="space-y-3">
                {rubricCategories.map((cat, i) => (
                  <div key={i} className="rounded-xl border border-border-default overflow-hidden">
                    <button onClick={() => setExpandedCategory(expandedCategory === i ? null : i)} className="w-full p-4 flex items-center gap-4 hover:bg-surface-card-hover transition-colors">
                      <div className="p-1.5 rounded-lg bg-surface-elevated"><cat.icon className="h-4 w-4 text-text-secondary" /></div>
                      <div className="flex-1 text-left"><p className="text-sm font-medium text-text-primary">{cat.name}</p></div>
                      <div className="flex items-center gap-3">
                        <Progress value={cat.score} max={cat.max} size="sm" className="w-20" />
                        <span className="text-sm font-mono font-medium text-text-primary w-12 text-right">{cat.score}/{cat.max}</span>
                        {expandedCategory === i ? <ChevronUp className="h-4 w-4 text-text-tertiary" /> : <ChevronDown className="h-4 w-4 text-text-tertiary" />}
                      </div>
                    </button>
                    {expandedCategory === i && (
                      <div className="px-4 pb-4 pt-0">
                        <div className="p-3 rounded-lg bg-surface-elevated text-sm text-text-secondary leading-relaxed">{cat.feedback}</div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {submission.aiScore.qualitativeFeedback && (
                <InfoCallout padding="sm" className="mt-6">
                  <h4 className="text-sm font-medium text-text-primary mb-2">Overall Assessment</h4>
                  <p className="text-sm text-text-secondary leading-relaxed">{submission.aiScore.qualitativeFeedback}</p>
                </InfoCallout>
              )}
            </Card>
          )}
        </div>

        <div className="space-y-6">
          {supportingLinks.length > 0 && (
            <Card>
              <CardTitle>Supporting Materials</CardTitle>
              <div className="mt-4 space-y-2">
                {supportingLinks.map((link, i) => (
                  <a key={i} href={link.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 rounded-xl border border-border-default hover:bg-surface-card-hover hover:border-border-strong transition-all group">
                    <link.icon className="h-4 w-4 text-text-tertiary group-hover:text-text-primary transition-colors" />
                    <span className="text-sm text-text-primary">{link.label}</span>
                  </a>
                ))}
              </div>
            </Card>
          )}

          {submission.revenueSplitBreakdown && (
            <Card>
              <div className="flex items-center gap-2 mb-4">
                <Handshake className="h-4 w-4 text-text-tertiary" />
                <h3 className="text-sm font-medium text-text-primary">Revenue split</h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3 p-2.5 rounded-lg bg-surface-elevated">
                  <div className="flex items-center gap-2 min-w-0">
                    <Avatar name={submission.revenueSplitBreakdown.lead.name} size="sm" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-text-primary truncate">{submission.revenueSplitBreakdown.lead.name}</p>
                      <Badge variant="brand" className="mt-0.5">Lead</Badge>
                    </div>
                  </div>
                  <span className="text-lg font-medium text-text-primary tabular-nums shrink-0">{submission.revenueSplitBreakdown.lead.pct}%</span>
                </div>
                {submission.revenueSplitBreakdown.collaborators.map((c) => (
                  <div
                    key={c._id}
                    className="flex items-center justify-between gap-3 p-2.5 rounded-lg bg-surface-elevated"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Avatar name={c.name} size="sm" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-text-primary truncate">{c.name}</p>
                        <div className="flex flex-wrap gap-1 mt-0.5">
                          <Badge variant="default">{c.role === "lead" ? "Lead" : "Collaborator"}</Badge>
                          <Badge
                            variant={
                              c.status === "accepted"
                                ? "success"
                                : c.status === "declined"
                                  ? "error"
                                  : "warning"
                            }
                          >
                            {c.status === "pending"
                              ? "Pending"
                              : c.status === "accepted"
                                ? "Accepted"
                                : "Declined"}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <span className="text-lg font-medium text-text-primary tabular-nums shrink-0">{c.pct}%</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 p-3 rounded-lg bg-warning/5 border border-warning/10">
                <p className="text-xs text-text-secondary flex gap-1.5">
                  <Shield className="h-3.5 w-3.5 text-warning shrink-0 mt-0.5" />
                  <span>
                    Proposed split for prize distribution. After the pitch is submitted, this split is treated as the binding agreement among team members.
                  </span>
                </p>
              </div>
            </Card>
          )}

          {teamMembers.length > 0 && (
            <Card>
              <div className="flex items-center gap-2 mb-4">
                <Users className="h-4 w-4 text-text-tertiary" />
                <h3 className="text-sm font-medium text-text-primary">Team ({teamMembers.length} member{teamMembers.length !== 1 ? "s" : ""})</h3>
              </div>
              <div className="space-y-2">
                {teamMembers.map((member, i) => (
                  <Link key={i} href={`/community/${member.id}`} className="flex items-center gap-3 p-2.5 rounded-lg bg-surface-elevated hover:bg-surface-overlay transition-colors">
                    <Avatar name={member.name} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-text-primary hover:text-white transition-colors">{member.name}</p>
                      <Badge variant={member.role === "Lead" ? "brand" : "default"} className="mt-0.5">{member.role}</Badge>
                    </div>
                  </Link>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
