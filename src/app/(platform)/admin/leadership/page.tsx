"use client";

import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { type Id } from "../../../../../convex/_generated/dataModel";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Crown,
  UserPlus,
  X,
  Search,
  Check,
  Trash2,
  GripVertical,
  Plus,
} from "lucide-react";

// ─── Slot card for a single leadership position ───────────────────────

function SlotCard({
  position,
  onAssign,
  onUnassign,
  onRemove,
}: {
  position: {
    _id: Id<"leadershipPositions">;
    name: string;
    role: string;
    userId?: Id<"users">;
    school?: string;
    graduation?: number;
    company?: string;
    jobTitle?: string;
    avatarUrl?: string | null;
  };
  onAssign: (positionId: Id<"leadershipPositions">) => void;
  onUnassign: (positionId: Id<"leadershipPositions">) => void;
  onRemove: (positionId: Id<"leadershipPositions">) => void;
}) {
  const hasUser = !!position.userId;

  return (
    <Card padding="md" className="border-border-default flex items-center gap-4">
      <div className="flex-shrink-0">
        {hasUser && position.avatarUrl ? (
          <img
            src={position.avatarUrl}
            alt={position.name}
            className="w-10 h-10 rounded-full object-cover"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-surface-elevated flex items-center justify-center text-sm font-medium text-text-secondary">
            {position.name
              .split(" ")
              .map((w) => w[0])
              .join("")
              .slice(0, 2)
              .toUpperCase()}
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-text-primary truncate">
            {position.name}
          </span>
          <Badge variant="default">
            {position.role}
          </Badge>
        </div>
        <p className="text-xs text-text-secondary mt-0.5 truncate">
          {position.company
            ? `${position.company}${position.jobTitle ? ` \u00B7 ${position.jobTitle}` : ""}`
            : position.school
              ? `${position.school}${position.graduation ? ` '${String(position.graduation).slice(-2)}` : ""}`
              : hasUser
                ? "Assigned"
                : "Unassigned"}
        </p>
      </div>

      <div className="flex items-center gap-1 flex-shrink-0">
        {hasUser ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onAssign(position._id)}
            className="text-text-secondary hover:text-text-primary"
          >
            Change
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onAssign(position._id)}
            className=""
          >
            <UserPlus className="h-3.5 w-3.5 mr-1" />
            Assign
          </Button>
        )}
        {hasUser && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onUnassign(position._id)}
            className="text-text-tertiary hover:text-error"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onRemove(position._id)}
          className="text-text-tertiary hover:text-error"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </Card>
  );
}

// ─── User search picker (dropdown) ────────────────────────────────────

function UserPicker({
  onSelect,
  onCancel,
}: {
  onSelect: (userId: Id<"users">, name: string, school?: string, graduation?: number) => void;
  onCancel: () => void;
}) {
  const [search, setSearch] = useState("");
  const members = useQuery(api.users.listMembers, { search }) ?? [];
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onCancel();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onCancel]);

  return (
    <div
      ref={containerRef}
      className="absolute top-full left-0 right-0 mt-1 z-50 bg-surface-card border border-border-default rounded-xl shadow-lg overflow-hidden"
    >
      <div className="p-2 border-b border-border-default">
        <Input
          placeholder="Search members..."
          leftIcon={<Search className="h-4 w-4" />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          autoFocus
        />
      </div>
      <div className="max-h-56 overflow-y-auto">
        {members.length === 0 ? (
          <p className="p-3 text-sm text-text-tertiary text-center">
            {search ? "No members found" : "Type to search..."}
          </p>
        ) : (
          members.slice(0, 20).map((m) => (
            <button
              key={m._id}
              type="button"
              onClick={() => onSelect(m._id, m.fullName, m.schoolName, m.graduationYear)}
              className="w-full flex items-center gap-3 px-3 py-2 hover:bg-surface-elevated transition-colors text-left"
            >
              <div className="w-7 h-7 rounded-full bg-surface-elevated flex items-center justify-center text-xs font-medium text-text-secondary flex-shrink-0">
                {m.fullName
                  .split(" ")
                  .map((w) => w[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-text-primary truncate">
                  {m.fullName}
                </p>
                <p className="text-xs text-text-secondary truncate">
                  {m.schoolName ?? m.email}
                </p>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}

// ─── Add new position form ────────────────────────────────────────────

const ROLE_PRESETS = [
  "President",
  "VP Marketing",
  "VP Technology",
  "VP Recruitment",
  "VP Operations",
  "VP Finance",
  "Advisor",
];

function AddPositionForm({
  onClose,
  existingRoles,
}: {
  onClose: () => void;
  existingRoles: string[];
}) {
  const [role, setRole] = useState("");
  const [customRole, setCustomRole] = useState("");
  const createPosition = useMutation(api.leadership.create);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const availablePresets = ROLE_PRESETS.filter(
    (r) => !existingRoles.includes(r)
  );

  const finalRole = role === "__custom" ? customRole.trim() : role;

  async function handleSubmit() {
    if (!finalRole) return;
    setIsSubmitting(true);
    try {
      await createPosition({
        type: "executive",
        name: "Unassigned",
        role: finalRole,
        sortOrder: existingRoles.length + 1,
      });
      onClose();
    } catch {
      // Silently handle — user will see it didn't close
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card padding="md" className="border border-border-default border-dashed">
      <div className="space-y-3">
        <p className="text-sm font-medium text-text-primary">Add Position</p>
        <div className="flex flex-wrap gap-2">
          {availablePresets.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRole(r)}
              className={`px-3 py-1 rounded-lg text-sm border transition-colors ${
                role === r
                  ? "bg-surface-elevated border-border-strong text-text-primary"
                  : "border-border-default text-text-secondary hover:border-border-strong"
              }`}
            >
              {r}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setRole("__custom")}
            className={`px-3 py-1 rounded-lg text-sm border transition-colors ${
              role === "__custom"
                ? "bg-surface-elevated border-border-strong text-text-primary"
                : "border-border-default text-text-secondary hover:border-border-strong"
            }`}
          >
            Custom...
          </button>
        </div>
        {role === "__custom" && (
          <Input
            placeholder="e.g. VP Community"
            value={customRole}
            onChange={(e) => setCustomRole(e.target.value)}
            autoFocus
          />
        )}
        <div className="flex items-center gap-2">
          <Button
            variant="brand"
            size="sm"
            onClick={handleSubmit}
            disabled={!finalRole || isSubmitting}
            isLoading={isSubmitting}
          >
            <Check className="h-3.5 w-3.5 mr-1" />
            Create Slot
          </Button>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </Card>
  );
}

// ─── Main page ────────────────────────────────────────────────────────

export default function AdminLeadershipPage() {
  const leadership = useQuery(api.leadership.list);
  const updatePosition = useMutation(api.leadership.update);
  const removePosition = useMutation(api.leadership.remove);

  const [assigningId, setAssigningId] = useState<Id<"leadershipPositions"> | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const executives = leadership?.executives ?? [];
  const existingRoles = executives.map((e) => e.role);

  async function handleAssign(
    positionId: Id<"leadershipPositions">,
    userId: Id<"users">,
    name: string,
    school?: string,
    graduation?: number,
  ) {
    await updatePosition({
      positionId,
      userId,
      name,
      ...(school ? { school } : {}),
      ...(graduation ? { graduation } : {}),
    });
    setAssigningId(null);
  }

  async function handleUnassign(positionId: Id<"leadershipPositions">) {
    await updatePosition({
      positionId,
      name: "Unassigned",
      clearUserId: true,
    });
  }

  async function handleRemove(positionId: Id<"leadershipPositions">) {
    await removePosition({ positionId });
  }

  if (!leadership) {
    return (
      <div className="p-6 text-center text-text-secondary">Loading...</div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Executive Team */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-text-tertiary" />
            <h2 className="text-lg font-semibold text-text-primary">
              Executive Team
            </h2>
            <Badge variant="default">
              {executives.length} slots
            </Badge>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAddForm(!showAddForm)}
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            Add Position
          </Button>
        </div>

        <div className="space-y-2">
          {executives.map((pos) => (
            <div key={pos._id} className="relative">
              <SlotCard
                position={pos}
                onAssign={setAssigningId}
                onUnassign={handleUnassign}
                onRemove={handleRemove}
              />
              {assigningId === pos._id && (
                <UserPicker
                  onSelect={(userId, name, school, graduation) =>
                    handleAssign(pos._id, userId, name, school, graduation)
                  }
                  onCancel={() => setAssigningId(null)}
                />
              )}
            </div>
          ))}

          {executives.length === 0 && !showAddForm && (
            <p className="text-sm text-text-tertiary py-4 text-center">
              No executive positions defined yet.
            </p>
          )}

          {showAddForm && (
            <AddPositionForm
              onClose={() => setShowAddForm(false)}
              existingRoles={existingRoles}
            />
          )}
        </div>
      </section>

      {/* Regional Directors */}
      {(leadership.regionalDirectors.length > 0) && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-lg font-semibold text-text-primary">
              Regional Directors
            </h2>
            <Badge variant="default">
              {leadership.regionalDirectors.length}
            </Badge>
          </div>
          <div className="space-y-2">
            {leadership.regionalDirectors.map((pos) => (
              <div key={pos._id} className="relative">
                <SlotCard
                  position={pos}
                  onAssign={setAssigningId}
                  onUnassign={handleUnassign}
                  onRemove={handleRemove}
                />
                {assigningId === pos._id && (
                  <UserPicker
                    onSelect={(userId, name, school, graduation) =>
                      handleAssign(pos._id, userId, name, school, graduation)
                    }
                    onCancel={() => setAssigningId(null)}
                  />
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Ambassadors */}
      {(leadership.ambassadors.length > 0) && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-lg font-semibold text-text-primary">
              Ambassadors
            </h2>
            <Badge variant="default">
              {leadership.ambassadors.length}
            </Badge>
          </div>
          <div className="space-y-2">
            {leadership.ambassadors.map((pos) => (
              <div key={pos._id} className="relative">
                <SlotCard
                  position={pos}
                  onAssign={setAssigningId}
                  onUnassign={handleUnassign}
                  onRemove={handleRemove}
                />
                {assigningId === pos._id && (
                  <UserPicker
                    onSelect={(userId, name, school, graduation) =>
                      handleAssign(pos._id, userId, name, school, graduation)
                    }
                    onCancel={() => setAssigningId(null)}
                  />
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
