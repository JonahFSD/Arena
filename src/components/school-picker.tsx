"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, ChevronRight, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import {
  STATE_NAMES,
  formatSchoolLabel,
  getSchoolsForState,
  keyToSchool,
  schoolToKey,
  type NewSchoolPayload,
  type SchoolListing,
  type SchoolSelection,
} from "@/lib/school-directory";
import { US_STATE_ABBREVIATIONS } from "@/lib/us-states";

const emptyForm = (): NewSchoolPayload => ({
  schoolName: "",
  schoolWebsite: "",
  schoolCity: "",
  schoolState: "TX",
  contactFirstName: "",
  contactLastName: "",
  contactEmail: "",
  contactPhone: "",
  contactTitle: "",
});

function isFormComplete(f: NewSchoolPayload): boolean {
  const keys: (keyof NewSchoolPayload)[] = [
    "schoolName",
    "schoolWebsite",
    "schoolCity",
    "schoolState",
    "contactFirstName",
    "contactLastName",
    "contactEmail",
    "contactPhone",
    "contactTitle",
  ];
  if (!keys.every((k) => String(f[k]).trim())) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.contactEmail.trim());
}

export function SchoolPicker({
  label = "School",
  value,
  onChange,
  extraSchoolsByState,
  onAddSchool,
}: {
  label?: string;
  value: string | null;
  onChange: (key: string | null) => void;
  extraSchoolsByState: Record<string, SchoolListing[]>;
  onAddSchool: (payload: NewSchoolPayload) => void;
}) {
  const [open, setOpen] = useState(false);
  const [expandedState, setExpandedState] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selected = value ? keyToSchool(value) : null;
  const summary = selected
    ? formatSchoolLabel(selected)
    : "Select school";

  const pickSchool = (s: SchoolSelection) => {
    onChange(schoolToKey(s));
    setOpen(false);
  };

  return (
    <div className="relative min-w-0" ref={rootRef}>
      <span className="mb-1 block text-sm font-medium text-text-secondary">
        {label}
      </span>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex h-10 w-full items-center justify-between gap-2 rounded-lg border border-border-default bg-surface-elevated px-3 text-left text-sm text-text-primary",
          "transition-colors hover:border-border-strong",
          "focus:outline-none focus:border-white"
        )}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <span className="min-w-0 flex-1 truncate">{summary}</span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-text-muted transition-transform",
            open && "rotate-180"
          )}
          aria-hidden
        />
      </button>

      {open && (
        <div
          className="absolute left-0 right-0 z-30 mt-1 flex max-h-[min(70vh,26rem)] flex-col overflow-hidden rounded-lg border border-border-default bg-surface-elevated shadow-elevated"
          role="listbox"
        >
          <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
            {US_STATE_ABBREVIATIONS.map((abbr) => {
              const schools = getSchoolsForState(abbr, extraSchoolsByState);
              const isExpanded = expandedState === abbr;
              const stateLabel = STATE_NAMES[abbr] ?? abbr;
              return (
                <div
                  key={abbr}
                  className="border-b border-border-subtle last:border-b-0"
                >
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-text-primary hover:bg-surface-overlay"
                    onClick={() =>
                      setExpandedState((prev) => (prev === abbr ? null : abbr))
                    }
                    aria-expanded={isExpanded}
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 shrink-0 text-text-muted" />
                    ) : (
                      <ChevronRight className="h-4 w-4 shrink-0 text-text-muted" />
                    )}
                    <span className="font-medium">{stateLabel}</span>
                    <span className="text-text-muted">({abbr})</span>
                  </button>
                  {isExpanded && (
                    <ul className="border-t border-border-subtle bg-surface-primary/40 pb-2">
                      {schools.length === 0 ? (
                        <li className="px-4 py-2 text-xs text-text-muted">
                          No schools listed yet for this state.
                        </li>
                      ) : (
                        schools.map((sch) => (
                          <li key={`${abbr}-${sch.name}-${sch.city}`}>
                            <button
                              type="button"
                              role="option"
                              className="w-full px-4 py-2 text-left text-sm text-text-primary hover:bg-surface-overlay"
                              onClick={() =>
                                pickSchool({
                                  state: abbr,
                                  name: sch.name,
                                  city: sch.city,
                                })
                              }
                            >
                              <span className="block">{sch.name}</span>
                              <span className="text-xs text-text-muted">
                                {sch.city}
                              </span>
                            </button>
                          </li>
                        ))
                      )}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
          <div className="shrink-0 border-t border-border-default bg-surface-elevated p-2">
            <button
              type="button"
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm text-text-primary hover:bg-surface-overlay"
              onClick={() => {
                setAddOpen(true);
                setOpen(false);
              }}
            >
              <Plus className="h-4 w-4 shrink-0" aria-hidden />
              <span>Don&apos;t see yours? Add new school</span>
            </button>
          </div>
        </div>
      )}

      <AddSchoolModal
        isOpen={addOpen}
        onClose={() => setAddOpen(false)}
        onSubmit={(payload) => {
          onAddSchool(payload);
          setAddOpen(false);
        }}
      />
    </div>
  );
}

function AddSchoolModal({
  isOpen,
  onClose,
  onSubmit,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: NewSchoolPayload) => void;
}) {
  const [form, setForm] = useState<NewSchoolPayload>(emptyForm);
  const [attempted, setAttempted] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setForm(emptyForm());
      setAttempted(false);
    }
  }, [isOpen]);

  const setField =
    (field: keyof NewSchoolPayload) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm((f) => ({ ...f, [field]: e.target.value }));
    };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAttempted(true);
    const f = form;
    if (!isFormComplete(f)) return;
    onSubmit({
      ...f,
      schoolName: f.schoolName.trim(),
      schoolWebsite: f.schoolWebsite.trim(),
      schoolCity: f.schoolCity.trim(),
      schoolState: f.schoolState,
      contactFirstName: f.contactFirstName.trim(),
      contactLastName: f.contactLastName.trim(),
      contactEmail: f.contactEmail.trim(),
      contactPhone: f.contactPhone.trim(),
      contactTitle: f.contactTitle.trim(),
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="xl"
      className="max-w-2xl"
      title="Add a new school"
      description="We’ll review your submission before it appears for everyone. Include accurate contact details so we can verify with your school."
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-3">
          <p className="text-xs font-medium uppercase tracking-wide text-text-muted">
            School
          </p>
          <Input
            label="School name"
            required
            value={form.schoolName}
            onChange={setField("schoolName")}
          />
          <Input
            label="School website"
            type="url"
            required
            placeholder="https://"
            value={form.schoolWebsite}
            onChange={setField("schoolWebsite")}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="School city"
              required
              value={form.schoolCity}
              onChange={setField("schoolCity")}
              autoComplete="address-level2"
            />
            <Select
              label="School state"
              required
              value={form.schoolState}
              onChange={(e) =>
                setForm((f) => ({ ...f, schoolState: e.target.value }))
              }
              options={US_STATE_ABBREVIATIONS.map((abbr) => ({
                value: abbr,
                label: abbr,
              }))}
            />
          </div>
        </div>

        <div className="space-y-3 border-t border-border-default pt-4">
          <p className="text-xs font-medium uppercase tracking-wide text-text-muted">
            Main point of contact at the school
          </p>
          <p className="text-xs text-text-secondary leading-relaxed">
            This is usually your entrepreneurship program lead, business teacher,
            or college/career counselor.
          </p>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="First name"
              required
              autoComplete="given-name"
              value={form.contactFirstName}
              onChange={setField("contactFirstName")}
            />
            <Input
              label="Last name"
              required
              autoComplete="family-name"
              value={form.contactLastName}
              onChange={setField("contactLastName")}
            />
          </div>
          <Input
            label="Email"
            type="email"
            required
            autoComplete="email"
            value={form.contactEmail}
            onChange={setField("contactEmail")}
          />
          <Input
            label="Phone"
            type="tel"
            required
            inputMode="tel"
            autoComplete="tel"
            value={form.contactPhone}
            onChange={setField("contactPhone")}
          />
          <Input
            label="Title"
            required
            placeholder="e.g. College & Career Counselor"
            value={form.contactTitle}
            onChange={setField("contactTitle")}
          />
        </div>

        {attempted && !isFormComplete(form) && (
          <p className="text-xs text-error" role="alert">
            Please fill in every required field. Use a valid email for the
            contact.
          </p>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="brand">
            Submit school
          </Button>
        </div>
      </form>
    </Modal>
  );
}
