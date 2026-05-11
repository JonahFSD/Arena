"use client";

import { Suspense, useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";

const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

// Demo seed shapes match api.submissions.listMine + api.collaborators.listMyInvitations.
// Cast through unknown because we don't have real Convex Ids.
const DEMO_MINE = [
  {
    _id: "sub_1",
    _creationTime: Date.now() - 1000 * 60 * 60 * 6,
    title: "Onion: Privacy-First Messaging for Students",
    description:
      "End-to-end encrypted messaging built for students. No accounts, no metadata. Layered like an onion.",
    status: "submitted",
    monthYear: "Mar 2026",
    videoUrl: "https://example.com/video",
    githubUrl: "https://github.com/example/onion",
    isTeamSubmission: true,
    teamMemberCount: 3,
  },
  {
    _id: "sub_2",
    _creationTime: Date.now() - 1000 * 60 * 60 * 24 * 35,
    title: "Sola: Christian Apologetics for Gen Z",
    description:
      "Daily theology drops, AMA-style. Built for distribution through YouVersion + Gloo.",
    status: "scored",
    monthYear: "Feb 2026",
    aiScore: { overallScore: 87 },
    videoUrl: "https://example.com/video",
    websiteUrl: "https://sola.example.com",
    isTeamSubmission: false,
    teamMemberCount: 1,
  },
  {
    _id: "sub_3",
    _creationTime: Date.now() - 1000 * 60 * 60 * 24 * 2,
    title: "Workload Viewer for Canvas",
    description:
      "Visualizes student assignment load across the semester. Burndown chart per class.",
    status: "draft",
    monthYear: "Mar 2026",
    isTeamSubmission: false,
    teamMemberCount: 1,
  },
];

const DEMO_INVITES = [
  {
    _id: "inv_1",
    _creationTime: Date.now() - 1000 * 60 * 60 * 18,
    teamMemberCount: 2,
    submission: {
      _id: "sub_invite_1",
      _creationTime: Date.now() - 1000 * 60 * 60 * 20,
      title: "Dermi: At-Home Skin Diagnostics",
      description:
        "Computer vision skin assessment using your phone camera. Alex needs a technical co-founder.",
      status: "draft",
      monthYear: "Mar 2026",
      isTeamSubmission: true,
      teamMemberCount: 2,
    },
  },
];
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Video,
  Calendar,
  ExternalLink,
  Clock,
  Users,
  Play,
  FileQuestion,
  Mail,
} from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import type { SubmissionStatus } from "@/types";
import {
  parsePitchesStageFromSearch,
  parsePitchesSearchFromSearch,
  filterSubmissionsByPitchesStage,
  filterSubmissionsByPitchesSearch,
} from "@/lib/pitches-my-stage-filter";

const statusConfig: Record<
  SubmissionStatus,
  { label: string; variant: "default" | "brand" | "success" | "warning" | "error" }
> = {
  draft: { label: "Draft", variant: "default" },
  submitted: { label: "Submitted", variant: "brand" },
  scored: { label: "Scored", variant: "success" },
};

type SubmissionListItem = {
  id: string;
  title: string;
  description: string;
  status: SubmissionStatus;
  month_year: string;
  score: number | null;
  created_at: string;
  has_video: boolean;
  has_github: boolean;
  has_website: boolean;
  is_team: boolean;
  team_count: number;
  /** Pending invite to collaborate — card sorts first and is labeled. */
  is_team_invitation: boolean;
};

function MyPitchesPageContent() {
  const searchParams = useSearchParams();
  const stageFilter = parsePitchesStageFromSearch(searchParams);
  const searchQuery = parsePitchesSearchFromSearch(searchParams);

  const liveMine = useQuery(
    api.submissions.listMine,
    DEMO_MODE ? "skip" : {}
  );
  const liveInvites = useQuery(
    api.collaborators.listMyInvitations,
    DEMO_MODE ? "skip" : {}
  );
  const mine = DEMO_MODE
    ? (DEMO_MINE as unknown as NonNullable<typeof liveMine>)
    : liveMine;
  const invites = DEMO_MODE
    ? (DEMO_INVITES as unknown as NonNullable<typeof liveInvites>)
    : liveInvites;

  const feed = useMemo(() => {
    if (mine === undefined || invites === undefined) return undefined;
    const ownedIds = new Set(mine.map((s) => s._id));
    const inviteRows = invites
      .filter((inv) => !ownedIds.has(inv.submission._id))
      .sort((a, b) => b._creationTime - a._creationTime)
      .map((inv) => ({
        kind: "team_invite" as const,
        submission: inv.submission,
        teamMemberCount: inv.teamMemberCount,
      }));
    const ownedRows = mine
      .map((sub) => ({
        kind: "owned" as const,
        submission: sub,
        teamMemberCount:
          sub.teamMemberCount ?? (sub.isTeamSubmission ? 2 : 1),
      }))
      .sort((a, b) => b.submission._creationTime - a.submission._creationTime);
    return [...inviteRows, ...ownedRows];
  }, [mine, invites]);

  const submissions: SubmissionListItem[] = useMemo(
    () =>
      (feed ?? []).map((row) => {
        const sub = row.submission;
        return {
          id: sub._id,
          title: sub.title,
          description: sub.description,
          status: sub.status as SubmissionStatus,
          month_year: sub.monthYear,
          score: sub.aiScore?.overallScore ?? null,
          created_at: new Date(sub._creationTime).toISOString().split("T")[0],
          has_video: !!sub.videoUrl,
          has_github: !!sub.githubUrl,
          has_website: !!sub.websiteUrl,
          is_team: sub.isTeamSubmission ?? false,
          team_count:
            row.teamMemberCount ?? (sub.isTeamSubmission ? 2 : 1),
          is_team_invitation: row.kind === "team_invite",
        };
      }),
    [feed]
  );

  const afterStageFilter = useMemo(
    () => filterSubmissionsByPitchesStage(submissions, stageFilter),
    [submissions, stageFilter]
  );

  const filteredSubmissions = useMemo(
    () => filterSubmissionsByPitchesSearch(afterStageFilter, searchQuery),
    [afterStageFilter, searchQuery]
  );

  if (feed === undefined) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-circle border-2 border-brand-500 border-t-transparent" />
          <p className="text-sm text-text-secondary">Loading submissions...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {filteredSubmissions.length === 0 ? (
        (() => {
          const copy =
            submissions.length === 0
              ? stageFilter === "draft"
                ? {
                    title: "No drafts",
                    description: "Start a new pitch to build a draft.",
                  }
                : stageFilter === "submitted"
                  ? {
                      title: "No submitted pitches",
                      description:
                        "Submit a draft to see it here after you send it in and it is scored.",
                    }
                  : {
                      title: "No submissions yet",
                      description: "Create a pitch to see it here.",
                    }
              : searchQuery.trim() && afterStageFilter.length > 0
                ? {
                    title: "No matching pitches",
                    description:
                      "Nothing in this list matches your search. Try a different keyword or clear the search box.",
                  }
                : stageFilter === "draft"
                  ? {
                      title: "No drafts",
                      description: "Start a new pitch to build a draft.",
                    }
                  : stageFilter === "submitted"
                    ? {
                        title: "No submitted pitches",
                        description:
                          "Submit a draft to see it here after you send it in and it is scored.",
                      }
                    : {
                        title: "No submissions yet",
                        description: "Create a pitch to see it here.",
                      };
          return (
            <EmptyState
              icon={<FileQuestion className="h-8 w-8" />}
              title={copy.title}
              description={copy.description}
            />
          );
        })()
      ) : (
        <div className="space-y-3">
          {filteredSubmissions.map((sub) => (
            <Link key={sub.id} href={`/pitches/${sub.id}`} className="block">
              <Card hover padding="none" className="overflow-hidden mb-1">
                <div className="flex flex-col sm:flex-row items-stretch">
                  <div
                    className={`relative w-full sm:w-80 md:w-[500px] flex-shrink-0 ${
                      sub.has_video
                        ? "bg-surface-elevated group"
                        : "bg-surface-elevated/80"
                    }`}
                  >
                    {sub.has_video ? (
                      <>
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/20 pointer-events-none" />
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <div className="p-3 rounded-full bg-white/20 backdrop-blur-sm group-hover:bg-white/30 transition-colors">
                            <Play className="h-6 w-6 text-white fill-white" />
                          </div>
                        </div>
                        <div className="aspect-[16/10]" />
                      </>
                    ) : (
                      <div className="aspect-[16/10] flex items-center justify-center border-b sm:border-b-0 sm:border-r border-border-default">
                        <div className="flex flex-col items-center gap-2 text-text-muted">
                          <Video className="h-8 w-8 opacity-50" />
                          <span className="text-xs">No video yet</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 p-5 min-w-0 overflow-hidden flex flex-col">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      {sub.is_team_invitation && (
                        <Badge variant="brand" className="gap-1">
                          <Mail className="h-3 w-3" />
                          Team invitation
                        </Badge>
                      )}
                      {sub.status === "scored" && sub.score != null && (
                        <Badge variant="brand">
                          AI Score: {sub.score}
                        </Badge>
                      )}
                      <Badge variant={statusConfig[sub.status].variant}>
                        {statusConfig[sub.status].label}
                      </Badge>
                      {sub.is_team && !sub.is_team_invitation && (
                        <Badge variant="outline">
                          <Users className="h-3 w-3 mr-1" />
                          Team ({sub.team_count})
                        </Badge>
                      )}
                    </div>
                    <h3 className="text-base font-medium text-text-primary truncate">
                      {sub.title}
                    </h3>
                    <p className="text-sm text-text-secondary line-clamp-2 mt-1">
                      {sub.description}
                    </p>

                    <div className="flex items-center gap-4 mt-3 flex-wrap text-xs text-text-muted">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {sub.month_year}
                      </span>
                      {sub.has_video && (
                        <span className="flex items-center gap-1">
                          <Video className="h-3.5 w-3.5" />
                          Video
                        </span>
                      )}
                      {sub.has_github && (
                        <span className="flex items-center gap-1">
                          <ExternalLink className="h-3.5 w-3.5" />
                          GitHub
                        </span>
                      )}
                      {sub.has_website && (
                        <span className="flex items-center gap-1">
                          <ExternalLink className="h-3.5 w-3.5" />
                          Website
                        </span>
                      )}
                    </div>

                    {sub.status === "draft" && (
                      <div className="flex items-center gap-2 mt-4 p-3 bg-surface-elevated">
                        <Clock className="h-4 w-4 text-text-tertiary shrink-0" />
                        <span className="text-xs text-text-secondary">
                          Draft &mdash; finish and submit before Mar 20
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}

export default function MyPitchesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-circle border-2 border-brand-500 border-t-transparent" />
            <p className="text-sm text-text-secondary">Loading submissions...</p>
          </div>
        </div>
      }
    >
      <MyPitchesPageContent />
    </Suspense>
  );
}
