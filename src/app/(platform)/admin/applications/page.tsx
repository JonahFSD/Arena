"use client";

import { useState, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { type Id } from "../../../../../convex/_generated/dataModel";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs } from "@/components/ui/tabs";
import { Modal } from "@/components/ui/modal";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Eye,
  Calendar,
  User,
  GraduationCap,
  Heart,
  Lightbulb,
  Clock,
} from "lucide-react";
import Link from "next/link";
import { formatDate } from "@/lib/utils";

export default function ApplicationsPage() {
  const [activeTab, setActiveTab] = useState("pending");
  const [selectedAppId, setSelectedAppId] = useState<Id<"applications"> | null>(null);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewNotes, setReviewNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const pendingApps = useQuery(api.applications.listPending) ?? [];
  const approvedApps = useQuery(api.applications.listByStatus, { status: "approved" }) ?? [];
  const rejectedApps = useQuery(api.applications.listByStatus, { status: "rejected" }) ?? [];

  const reviewApplication = useMutation(api.applications.reviewApplication);

  const appsByTab: Record<string, typeof pendingApps> = {
    pending: pendingApps,
    approved: approvedApps,
    rejected: rejectedApps,
  };

  const currentApps = appsByTab[activeTab] ?? [];
  const selectedApp = currentApps.find((a) => a._id === selectedAppId) ?? null;

  async function handleReview(decision: "approved" | "rejected") {
    if (!selectedAppId) return;
    setIsSubmitting(true);
    try {
      await reviewApplication({
        applicationId: selectedAppId,
        decision,
        notes: reviewNotes || undefined,
      });
      setReviewModalOpen(false);
      setSelectedAppId(null);
      setReviewNotes("");
    } catch (err) {
      console.error("Review failed:", err);
    } finally {
      setIsSubmitting(false);
    }
  }

  const statusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="warning">Pending</Badge>;
      case "approved":
        return <Badge variant="success">Approved</Badge>;
      case "rejected":
        return <Badge variant="error">Rejected</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {pendingApps.length > 0 && (
        <div className="flex justify-end">
          <Badge variant="warning" className="text-sm py-1 px-3">
            <Clock className="h-3.5 w-3.5 mr-1.5" />
            {pendingApps.length} pending
          </Badge>
        </div>
      )}

      <Tabs
        tabs={[
          { id: "pending", label: "Pending", count: pendingApps.length },
          { id: "approved", label: "Approved", count: approvedApps.length },
          { id: "rejected", label: "Rejected", count: rejectedApps.length },
        ]}
        onChange={(tabId) => setActiveTab(tabId)}
      >
        {(tab) => {
          const apps = appsByTab[tab] ?? [];

          if (apps.length === 0) {
            return (
              <Card className="text-center py-12">
                <p className="text-sm text-text-secondary">
                  No {tab} applications.
                </p>
              </Card>
            );
          }

          return (
            <div className="space-y-4">
              {apps.map((app) => (
                <Card key={app._id} padding="none">
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-base font-medium text-text-primary">
                            {app.fullName}
                          </h3>
                          {statusBadge(app.status)}
                        </div>
                        <div className="flex items-center gap-4 text-xs text-text-muted">
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            Age {app.age}
                          </span>
                          <span className="flex items-center gap-1">
                            <GraduationCap className="h-3 w-3" />
                            {app.school} ({app.graduationYear})
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Applied {formatDate(app._creationTime)}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          leftIcon={<Eye className="h-4 w-4" />}
                          onClick={() => {
                            setSelectedAppId(app._id);
                            setReviewNotes("");
                            setReviewModalOpen(true);
                          }}
                        >
                          Review
                        </Button>
                      </div>
                    </div>

                    {/* Preview sections */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-3 mt-4">
                      <div>
                        <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-text-muted mb-1">
                          <Heart className="h-3 w-3" />
                          Faith
                        </div>
                        <p className="text-xs text-text-secondary line-clamp-2">
                          {app.faithStatement}
                        </p>
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-text-muted mb-1">
                          <Lightbulb className="h-3 w-3" />
                          Venture
                        </div>
                        <p className="text-xs text-text-secondary line-clamp-2">
                          {app.entrepreneurshipInterest}
                        </p>
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-text-muted mb-1">
                          <Lightbulb className="h-3 w-3" />
                          AI Interest
                        </div>
                        <p className="text-xs text-text-secondary line-clamp-2">
                          {app.aiInterest}
                        </p>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          );
        }}
      </Tabs>

      {/* Review Modal */}
      <Modal
        isOpen={reviewModalOpen}
        onClose={() => setReviewModalOpen(false)}
        title={`Review: ${selectedApp?.fullName ?? ""}`}
        size="lg"
      >
        {selectedApp && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-text-muted">Age</span>
                <p className="font-medium text-text-primary">
                  {selectedApp.age}
                </p>
              </div>
              <div>
                <span className="text-text-muted">School</span>
                <p className="font-medium text-text-primary">
                  {selectedApp.school}
                </p>
              </div>
              <div>
                <span className="text-text-muted">Graduation</span>
                <p className="font-medium text-text-primary">
                  {selectedApp.graduationYear}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="p-4 rounded-xl bg-surface-primary border border-border-default">
                <h4 className="text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
                  Faith Statement
                </h4>
                <p className="text-sm text-text-secondary">
                  {selectedApp.faithStatement}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-surface-primary border border-border-default">
                <h4 className="text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
                  Entrepreneurship Interest
                </h4>
                <p className="text-sm text-text-secondary">
                  {selectedApp.entrepreneurshipInterest}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-surface-primary border border-border-default">
                <h4 className="text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
                  AI Interest
                </h4>
                <p className="text-sm text-text-secondary">
                  {selectedApp.aiInterest}
                </p>
              </div>
            </div>

            <Textarea
              label="Review Notes (Internal)"
              placeholder="Add notes about this application..."
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
            />

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-border-default">
              <Button
                variant="danger"
                leftIcon={<XCircle className="h-4 w-4" />}
                disabled={isSubmitting}
                onClick={() => handleReview("rejected")}
              >
                Reject
              </Button>
              <Button
                variant="brand"
                leftIcon={<CheckCircle className="h-4 w-4" />}
                disabled={isSubmitting}
                onClick={() => handleReview("approved")}
              >
                Approve
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
