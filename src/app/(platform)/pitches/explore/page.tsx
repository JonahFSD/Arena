"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/empty-state";
import { Search, Compass, Sparkles } from "lucide-react";

const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

const DEMO_EXPLORE = [
  { _id: "ep1", title: "Onion: Privacy-First Messaging", description: "E2E encrypted messaging for students.", monthYear: "Mar 2026", user: { fullName: "Connor", avatarUrl: null, schoolName: "ACU" }, aiScore: { overallScore: 88 } },
  { _id: "ep2", title: "Dermi: At-Home Skin Diagnostics", description: "Computer vision skin assessment.", monthYear: "Mar 2026", user: { fullName: "Alex Mi", avatarUrl: null, schoolName: "Valley Christian" }, aiScore: { overallScore: 91 } },
  { _id: "ep3", title: "Safelock: Locker Security", description: "Bluetooth-controlled school lockers.", monthYear: "Mar 2026", user: { fullName: "Yichi Zhang", avatarUrl: null, schoolName: "Valley Christian" }, aiScore: { overallScore: 84 } },
  { _id: "ep4", title: "Sola: Christian Apologetics", description: "Theology drops + AMA for Gen Z.", monthYear: "Feb 2026", user: { fullName: "Jonah Elliot", avatarUrl: null, schoolName: "ACU" }, aiScore: { overallScore: 87 } },
  { _id: "ep5", title: "Milestone: Teen Driver Coach", description: "Real-time driving feedback.", monthYear: "Feb 2026", user: { fullName: "Seowoong Park", avatarUrl: null, schoolName: "Cedar Park" }, aiScore: { overallScore: 79 } },
  { _id: "ep6", title: "Lexx AI: Construction Litigation", description: "AI-powered legal research for builders.", monthYear: "Feb 2026", user: { fullName: "Lars Ostervold", avatarUrl: null, schoolName: "ACU" }, aiScore: { overallScore: 82 } },
];

export default function ExplorePage() {
  const [search, setSearch] = useState("");
  const liveSubmissions = useQuery(
    api.submissions.listAll,
    DEMO_MODE ? "skip" : { search: search || undefined }
  );
  const submissions = DEMO_MODE
    ? (DEMO_EXPLORE.filter((s) =>
        search
          ? s.title.toLowerCase().includes(search.toLowerCase()) ||
            s.user.fullName.toLowerCase().includes(search.toLowerCase())
          : true
      ) as unknown as NonNullable<typeof liveSubmissions>)
    : liveSubmissions;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <Input
            placeholder="Search pitches by title, creator, or school..."
            leftIcon={<Search className="h-4 w-4" />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {submissions === undefined ? (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-circle border-2 border-brand-500 border-t-transparent" />
            <p className="text-sm text-text-secondary">Loading pitches...</p>
          </div>
        </div>
      ) : submissions.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Compass className="h-8 w-8" />}
            title={search ? "No matching pitches" : "No pitches yet"}
            description={
              search
                ? "Try a different search term."
                : "Submitted pitches will appear here once the first round begins."
            }
          />
        </Card>
      ) : (
        <div className="space-y-3">
          {submissions.map((sub) => (
            <Link key={sub._id} href={`/pitches/${sub._id}`} className="block">
              <Card hover className="flex items-start gap-4">
                <Avatar
                  name={sub.user?.fullName ?? "Unknown"}
                  src={sub.user?.avatarUrl ?? undefined}
                  size="md"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-medium text-text-primary truncate">
                      {sub.title}
                    </h3>
                    <Badge variant="default" className="text-[10px]">
                      {sub.monthYear}
                    </Badge>
                    {sub.aiScore && (
                      <Badge variant="brand" className="text-[10px]">
                        <Sparkles className="h-3 w-3 mr-1" />
                        {sub.aiScore.overallScore}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-text-muted mt-1 truncate">
                    {sub.user?.fullName}
                    {sub.user?.schoolName ? ` \u2022 ${sub.user.schoolName}` : ""}
                  </p>
                  <p className="text-xs text-text-secondary mt-1 line-clamp-2">
                    {sub.description}
                  </p>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
