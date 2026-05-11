"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import type { Id } from "../../../../../convex/_generated/dataModel";
import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import {
  ArrowLeft, MessageCircle, Handshake, Calendar, GraduationCap,
  Brain, Network, ExternalLink, Video, CircleDollarSign,
} from "lucide-react";

export default function MemberProfilePage() {
  const params = useParams();
  const id = params.id as string;
  const member = useQuery(api.users.getById, { userId: id as Id<"users"> });

  if (member === undefined) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
        <Card className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-circle border-2 border-brand-500 border-t-transparent" />
            <p className="text-sm text-text-secondary">Loading profile...</p>
          </div>
        </Card>
      </div>
    );
  }

  if (member === null) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
        <Card className="text-center py-16">
          <p className="text-lg font-semibold text-text-primary mb-2">Member not found</p>
          <p className="text-sm text-text-secondary">This profile doesn&apos;t exist or has been removed.</p>
        </Card>
      </div>
    );
  }

  const formatCurrency = (cents: number) => {
    if (cents >= 100000) return `$${(cents / 100).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
    if (cents >= 1000) return `$${(cents / 100).toFixed(0)}`;
    return `$${(cents / 100).toFixed(2)}`;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <Card className="relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-r from-brand-500/10 to-brand-600/5" />
        <div className="relative pt-12">
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
            <Avatar src={member.avatarUrl} name={member.fullName} size="xl" className="ring-4 ring-surface-card" />
            <div className="flex-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-bold text-text-primary">{member.fullName}</h1>
                {member.lookingForCofounders && (
                  <Badge variant="brand"><Handshake className="h-3 w-3 mr-1" />Looking for co-founders</Badge>
                )}
                {member.bqType && (
                  <a href={member.bqResultsUrl ?? "https://bq.austinchristianu.org/"} target="_blank" rel="noopener noreferrer">
                    <Badge variant="outline" className="hover:border-brand-500 transition-colors">
                      <Brain className="h-3 w-3 mr-1" />BQ: {member.bqType}<ExternalLink className="h-2.5 w-2.5 ml-1 text-text-muted" />
                    </Badge>
                  </a>
                )}
              </div>
              <div className="flex items-center gap-4 mt-2 text-sm text-text-secondary flex-wrap">
                {member.schoolName && <span className="flex items-center gap-1"><GraduationCap className="h-4 w-4" />{member.schoolName}</span>}
                {member.graduationYear && <span className="flex items-center gap-1"><Calendar className="h-4 w-4" />Class of {member.graduationYear}</span>}
              </div>
            </div>
            <Link href={`/community/messages?to=${member._id}`}>
              <Button variant="brand" leftIcon={<MessageCircle className="h-4 w-4" />}>Message</Button>
            </Link>
          </div>

          {member.bio && <p className="mt-4 text-sm text-text-secondary leading-relaxed">{member.bio}</p>}

          {member.skills && member.skills.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {member.skills.map((skill) => <Badge key={skill} variant="outline">{skill}</Badge>)}
            </div>
          )}

          <div className="grid grid-cols-5 gap-4 mt-6 pt-6 border-t border-border-default">
            <div className="text-center"><p className="text-2xl font-bold text-text-primary">&mdash;</p><p className="text-xs text-text-muted">Pitches</p></div>
            <div className="text-center"><p className="text-2xl font-bold text-brand-500">&mdash;</p><p className="text-xs text-text-muted">Avg Score</p></div>
            <div className="text-center"><p className="text-2xl font-bold text-yellow-500">&mdash;</p><p className="text-xs text-text-muted">Wins</p></div>
            <div className="text-center"><p className="text-2xl font-bold text-success">{formatCurrency(member.totalEarnings ?? 0)}</p><p className="text-xs text-text-muted">Earned</p></div>
            <div className="text-center">
              <p className="text-2xl font-bold text-brand-500">{member.networkCount ?? 0}</p>
              <p className="text-xs text-text-muted flex items-center justify-center gap-1"><Network className="h-3 w-3" />Network</p>
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <CardTitle>Pitch History</CardTitle>
        <div className="mt-4 flex flex-col items-center py-8 text-center">
          <Video className="h-8 w-8 text-text-muted mb-2" />
          <p className="text-sm text-text-secondary">Coming soon</p>
          <p className="text-xs text-text-muted mt-1">Pitch history will appear here once submissions are wired up.</p>
        </div>
      </Card>

      <Card>
        <CardTitle>Bounty History</CardTitle>
        <div className="mt-4 flex flex-col items-center py-8 text-center">
          <CircleDollarSign className="h-8 w-8 text-text-muted mb-2" />
          <p className="text-sm text-text-secondary">Coming soon</p>
          <p className="text-xs text-text-muted mt-1">Bounty history will appear here once bounty submissions are wired up.</p>
        </div>
      </Card>
    </div>
  );
}
