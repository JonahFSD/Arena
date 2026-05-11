"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { api } from "../../../../../../convex/_generated/api";
import { Card, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Plus,
  X,
  Send,
  AlertTriangle,
} from "lucide-react";

export default function NewBountyPage() {
  const router = useRouter();
  const createBounty = useMutation(api.bounties.create);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [founderName, setFounderName] = useState("");
  const [founderCompany, setFounderCompany] = useState("");
  const [bountyAmount, setBountyAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [requirements, setRequirements] = useState<string[]>([""]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addRequirement = () => setRequirements([...requirements, ""]);
  const removeRequirement = (i: number) =>
    setRequirements(requirements.filter((_, j) => j !== i));
  const updateRequirement = (i: number, value: string) =>
    setRequirements(requirements.map((r, j) => (j === i ? value : r)));

  const canSubmit =
    title.trim() &&
    description.trim() &&
    founderName.trim() &&
    founderCompany.trim() &&
    Number(bountyAmount) > 0 &&
    dueDate;

  async function handleSubmit() {
    if (!canSubmit) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await createBounty({
        title: title.trim(),
        description: description.trim(),
        founderName: founderName.trim(),
        founderCompany: founderCompany.trim(),
        bountyAmount: Number(bountyAmount),
        dueDate: new Date(dueDate).getTime(),
        requirements: requirements
          .map((r) => r.trim())
          .filter((r) => r.length > 0),
      });
      router.push("/admin/bounties");
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Failed to create bounty."
      );
      setIsSubmitting(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <Card padding="lg">
        <CardTitle>Create New Bounty</CardTitle>

        <div className="mt-6 space-y-5">
          <Input
            label="Bounty Title"
            placeholder="e.g. Build an AI-Powered Study Tool"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <Textarea
            label="Description"
            placeholder="Describe what this bounty is about, the problem to solve, and expected deliverables..."
            rows={5}
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Founder Name"
              placeholder="John Smith"
              required
              value={founderName}
              onChange={(e) => setFounderName(e.target.value)}
            />
            <Input
              label="Company"
              placeholder="Acme Corp"
              required
              value={founderCompany}
              onChange={(e) => setFounderCompany(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Bounty Amount ($)"
              type="number"
              placeholder="500"
              required
              min={1}
              value={bountyAmount}
              onChange={(e) => setBountyAmount(e.target.value)}
            />
            <Input
              label="Due Date"
              type="date"
              required
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>

          {/* Requirements */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-text-secondary">
              Requirements
            </label>
            {requirements.map((req, i) => (
              <div key={i} className="flex items-center gap-2">
                <Input
                  placeholder={`Requirement ${i + 1}`}
                  value={req}
                  onChange={(e) => updateRequirement(i, e.target.value)}
                  className="flex-1"
                />
                {requirements.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeRequirement(i)}
                    className="p-2 rounded-lg hover:bg-surface-overlay text-text-tertiary hover:text-text-primary transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
            <Button
              variant="ghost"
              size="sm"
              onClick={addRequirement}
              leftIcon={<Plus className="h-4 w-4" />}
            >
              Add Requirement
            </Button>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-error/10 border border-error/20">
              <AlertTriangle className="h-4 w-4 text-error flex-shrink-0" />
              <p className="text-xs text-error">{error}</p>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border-default">
            <Button
              variant="ghost"
              onClick={() => router.push("/admin/bounties")}
            >
              Cancel
            </Button>
            <Button
              variant="brand"
              onClick={handleSubmit}
              disabled={!canSubmit}
              isLoading={isSubmitting}
              rightIcon={<Send className="h-4 w-4" />}
            >
              Create Bounty
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
