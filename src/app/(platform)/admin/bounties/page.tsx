"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { type Id } from "../../../../../convex/_generated/dataModel";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  CircleDollarSign,
  Clock,
  Send,
  ExternalLink,
  Check,
  X,
  Pencil,
  Archive,
  Link2,
  AlertTriangle,
} from "lucide-react";
import { cn, formatDate, daysUntilDue } from "@/lib/utils";

const STATUS_BADGE: Record<
  string,
  { variant: "success" | "warning" | "error" | "brand" | "default"; label: string }
> = {
  needs_review: { variant: "warning", label: "Needs Review" },
  active: { variant: "brand", label: "Active" },
  completed: { variant: "success", label: "Completed" },
  archived: { variant: "default", label: "Archived" },
  rejected: { variant: "error", label: "Rejected" },
};

export default function AdminBountiesPage() {
  const rawBounties = useQuery(api.bounties.list, {});
  const approveMutation = useMutation(api.bounties.approve);
  const rejectMutation = useMutation(api.bounties.reject);
  const archiveMutation = useMutation(api.bounties.archive);
  const updateMutation = useMutation(api.bounties.update);
  const confirmWinnerMutation = useMutation(api.bounties.confirmWinner);

  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<Id<"bounties"> | null>(null);
  const [editFields, setEditFields] = useState<{
    title: string;
    description: string;
    founderName: string;
    founderCompany: string;
    bountyAmount: string;
    dueDate: string;
  }>({ title: "", description: "", founderName: "", founderCompany: "", bountyAmount: "", dueDate: "" });
  const [reviewNotes, setReviewNotes] = useState("");
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  const { needsReview, rest } = useMemo(() => {
    if (!rawBounties) return { needsReview: [], rest: [] };
    const nr = rawBounties.filter((b) => b.status === "needs_review");
    const other = rawBounties
      .filter((b) => b.status !== "needs_review")
      .sort((a, b) => {
        const order: Record<string, number> = { active: 0, completed: 1, archived: 2, rejected: 3 };
        const statusDiff = (order[a.status] ?? 9) - (order[b.status] ?? 9);
        if (statusDiff !== 0) return statusDiff;
        return b._creationTime - a._creationTime;
      });
    return { needsReview: nr, rest: other };
  }, [rawBounties]);

  if (rawBounties === undefined) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-circle border-2 border-brand-500 border-t-transparent" />
          <p className="text-sm text-text-secondary">Loading bounties...</p>
        </div>
      </div>
    );
  }

  async function handleApprove(bountyId: Id<"bounties">) {
    setActionLoading(bountyId);
    try {
      const result = await approveMutation({ bountyId, adminNotes: reviewNotes || undefined });
      if (result?.reviewToken) {
        const url = `${window.location.origin}/review/bounty/${result.reviewToken}`;
        await navigator.clipboard.writeText(url);
        setCopiedToken(bountyId);
        setTimeout(() => setCopiedToken(null), 3000);
      }
      setReviewNotes("");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleReject(bountyId: Id<"bounties">) {
    setActionLoading(bountyId);
    try {
      await rejectMutation({ bountyId, adminNotes: reviewNotes || undefined });
      setReviewNotes("");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleArchive(bountyId: Id<"bounties">) {
    setActionLoading(bountyId);
    try {
      await archiveMutation({ bountyId });
    } finally {
      setActionLoading(null);
    }
  }

  function startEditing(bounty: NonNullable<typeof rawBounties>[number]) {
    setEditingId(bounty._id);
    setEditFields({
      title: bounty.title,
      description: bounty.description,
      founderName: bounty.founderName,
      founderCompany: bounty.founderCompany,
      bountyAmount: String(bounty.bountyAmount),
      dueDate: new Date(bounty.dueDate).toISOString().split("T")[0],
    });
  }

  async function saveEdit() {
    if (!editingId) return;
    setActionLoading(editingId);
    try {
      await updateMutation({
        bountyId: editingId,
        title: editFields.title,
        description: editFields.description,
        founderName: editFields.founderName,
        founderCompany: editFields.founderCompany,
        bountyAmount: Number(editFields.bountyAmount),
        dueDate: new Date(editFields.dueDate).getTime(),
      });
      setEditingId(null);
    } finally {
      setActionLoading(null);
    }
  }

  async function copyReviewLink(bountyId: Id<"bounties">) {
    const bounty = rawBounties?.find((b) => b._id === bountyId);
    if (!bounty?.reviewToken) return;
    const url = `${window.location.origin}/review/bounty/${bounty.reviewToken}`;
    await navigator.clipboard.writeText(url);
    setCopiedToken(bountyId);
    setTimeout(() => setCopiedToken(null), 3000);
  }

  return (
    <div className="animate-fade-in space-y-6">
      {/* Review Queue */}
      {needsReview.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Badge variant="warning">{needsReview.length} pending review</Badge>
          </div>
          <div className="space-y-3">
            {needsReview.map((bounty) => (
              <Card key={bounty._id} padding="lg" className="border-warning/30">
                <div className="flex flex-col gap-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-medium text-text-primary">
                        {bounty.title}
                      </h3>
                      <p className="text-xs text-text-muted mt-0.5">
                        {bounty.founderName} · {bounty.founderCompany} ·{" "}
                        <span className="font-medium text-text-primary">
                          ${bounty.bountyAmount.toLocaleString()}
                        </span>{" "}
                        · Due {formatDate(bounty.dueDate)}
                      </p>
                      <p className="text-xs text-text-secondary mt-2 line-clamp-3">
                        {bounty.description}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => startEditing(bounty)}
                      leftIcon={<Pencil className="h-3.5 w-3.5" />}
                    >
                      Edit
                    </Button>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
                    <div className="flex-1">
                      <label className="block text-[11px] font-medium text-text-muted mb-1">
                        Admin notes (optional)
                      </label>
                      <input
                        type="text"
                        placeholder="Reason for approval/rejection..."
                        value={reviewNotes}
                        onChange={(e) => setReviewNotes(e.target.value)}
                        className="w-full h-8 px-3 rounded-lg text-xs bg-surface-elevated border border-border-default text-text-primary placeholder:text-text-muted focus:outline-none focus:border-white"
                      />
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleReject(bounty._id)}
                        disabled={actionLoading === bounty._id}
                        isLoading={actionLoading === bounty._id}
                        leftIcon={<X className="h-3.5 w-3.5" />}
                      >
                        Reject & Refund
                      </Button>
                      <Button
                        variant="brand"
                        size="sm"
                        onClick={() => handleApprove(bounty._id)}
                        disabled={actionLoading === bounty._id}
                        isLoading={actionLoading === bounty._id}
                        leftIcon={<Check className="h-3.5 w-3.5" />}
                      >
                        Approve
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* All bounties table */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <Badge variant="brand">
            {rest.filter((b) => b.status === "active").length} active
          </Badge>
          <span className="text-xs text-text-muted">
            {(rawBounties?.length ?? 0)} total bounties
          </span>
        </div>

        {rest.length === 0 && needsReview.length === 0 ? (
          <Card padding="lg" className="text-center">
            <CircleDollarSign className="h-10 w-10 text-text-muted mx-auto mb-3" />
            <p className="text-sm text-text-secondary">
              No bounties yet.
            </p>
          </Card>
        ) : rest.length > 0 ? (
          <div className="overflow-x-auto rounded-xl border border-border-default">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border-default bg-surface-elevated/50">
                  <th className="px-4 py-3 text-xs font-medium text-text-muted uppercase tracking-wider">
                    Bounty
                  </th>
                  <th className="px-4 py-3 text-xs font-medium text-text-muted uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-4 py-3 text-xs font-medium text-text-muted uppercase tracking-wider hidden sm:table-cell">
                    Founder
                  </th>
                  <th className="px-4 py-3 text-xs font-medium text-text-muted uppercase tracking-wider hidden md:table-cell">
                    Due Date
                  </th>
                  <th className="px-4 py-3 text-xs font-medium text-text-muted uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-xs font-medium text-text-muted uppercase tracking-wider text-right">
                    Subs
                  </th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border-default">
                {rest.map((bounty) => {
                  const days = daysUntilDue(bounty.dueDate);
                  const badge = STATUS_BADGE[bounty.status] ?? {
                    variant: "default" as const,
                    label: bounty.status,
                  };
                  // Check if any submission has entrepreneurPick
                  const hasEntrepreneurPick =
                    bounty.status === "active" && bounty.submissionsCount > 0;

                  return (
                    <tr
                      key={bounty._id}
                      className="group hover:bg-surface-elevated/40 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-text-primary line-clamp-1">
                          {bounty.title}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-medium tabular-nums text-text-primary">
                          ${bounty.bountyAmount.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <p className="text-xs text-text-secondary">
                          {bounty.founderName}
                        </p>
                        <p className="text-xs text-text-muted">
                          {bounty.founderCompany}
                        </p>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <p className="text-xs text-text-secondary">
                          {formatDate(bounty.dueDate)}
                        </p>
                        {bounty.status === "active" && (
                          <p
                            className={cn(
                              "text-[11px]",
                              days <= 0
                                ? "text-error"
                                : days <= 7
                                  ? "text-warning"
                                  : "text-text-muted"
                            )}
                          >
                            {days > 0 ? `${days} days left` : "Overdue"}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant={badge.variant}
                          className="text-[10px]"
                        >
                          {badge.label}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="flex items-center justify-end gap-1 text-xs text-text-secondary">
                          <Send className="h-3 w-3 text-text-muted" />
                          {bounty.submissionsCount}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {bounty.status === "active" && bounty.reviewToken && (
                            <button
                              type="button"
                              onClick={() => copyReviewLink(bounty._id)}
                              className="p-1 rounded hover:bg-surface-overlay transition-colors"
                              title="Copy review link"
                            >
                              {copiedToken === bounty._id ? (
                                <Check className="h-3.5 w-3.5 text-success" />
                              ) : (
                                <Link2 className="h-3.5 w-3.5 text-text-tertiary hover:text-text-primary" />
                              )}
                            </button>
                          )}
                          {bounty.status === "active" && (
                            <>
                              <button
                                type="button"
                                onClick={() => startEditing(bounty)}
                                className="p-1 rounded hover:bg-surface-overlay transition-colors"
                                title="Edit bounty"
                              >
                                <Pencil className="h-3.5 w-3.5 text-text-tertiary hover:text-text-primary" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleArchive(bounty._id)}
                                className="p-1 rounded hover:bg-surface-overlay transition-colors"
                                title="Archive bounty"
                              >
                                <Archive className="h-3.5 w-3.5 text-text-tertiary hover:text-warning" />
                              </button>
                            </>
                          )}
                          <Link
                            href={`/bounties/${bounty._id}`}
                            className="p-1 rounded hover:bg-surface-overlay transition-colors"
                          >
                            <ExternalLink className="h-3.5 w-3.5 text-text-tertiary hover:text-text-primary" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>

      {/* Edit Modal */}
      {editingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <Card className="w-full max-w-lg" padding="lg">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-text-primary">
                Edit Bounty
              </h2>
              <button
                type="button"
                onClick={() => setEditingId(null)}
                className="p-1 rounded-lg hover:bg-surface-elevated transition-colors"
              >
                <X className="h-5 w-5 text-text-muted" />
              </button>
            </div>
            <div className="space-y-4">
              <Input
                label="Title"
                value={editFields.title}
                onChange={(e) =>
                  setEditFields({ ...editFields, title: e.target.value })
                }
              />
              <Textarea
                label="Description"
                value={editFields.description}
                rows={3}
                onChange={(e) =>
                  setEditFields({ ...editFields, description: e.target.value })
                }
              />
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Founder Name"
                  value={editFields.founderName}
                  onChange={(e) =>
                    setEditFields({ ...editFields, founderName: e.target.value })
                  }
                />
                <Input
                  label="Company"
                  value={editFields.founderCompany}
                  onChange={(e) =>
                    setEditFields({
                      ...editFields,
                      founderCompany: e.target.value,
                    })
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Amount ($)"
                  type="number"
                  value={editFields.bountyAmount}
                  onChange={(e) =>
                    setEditFields({
                      ...editFields,
                      bountyAmount: e.target.value,
                    })
                  }
                />
                <Input
                  label="Due Date"
                  type="date"
                  value={editFields.dueDate}
                  onChange={(e) =>
                    setEditFields({ ...editFields, dueDate: e.target.value })
                  }
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button variant="ghost" onClick={() => setEditingId(null)}>
                  Cancel
                </Button>
                <Button
                  variant="brand"
                  onClick={saveEdit}
                  isLoading={actionLoading === editingId}
                >
                  Save Changes
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
