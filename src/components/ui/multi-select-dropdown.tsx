"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export function MultiSelectDropdown({
  label,
  options,
  value,
  onChange,
  emptyLabel,
}: {
  label: string;
  options: string[];
  value: string[];
  onChange: (next: string[]) => void;
  emptyLabel: string;
}) {
  const [open, setOpen] = useState(false);
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

  const toggle = (opt: string) => {
    if (value.includes(opt)) {
      onChange(value.filter((x) => x !== opt));
    } else {
      onChange([...value, opt]);
    }
  };

  const summary =
    value.length === 0
      ? emptyLabel
      : value.length <= 2
        ? value.join(", ")
        : `${value.length} selected`;

  return (
    <div className="relative" ref={rootRef}>
      <span className="mb-1 block text-xs font-medium text-text-muted">{label}</span>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex h-9 w-full items-center justify-between gap-2 rounded-lg border border-border-default bg-surface-elevated px-3 text-left text-sm text-text-primary"
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
        <ul
          className="absolute left-0 right-0 z-20 mt-1 max-h-60 overflow-auto rounded-lg border border-border-default bg-surface-elevated py-1 shadow-elevated"
          role="listbox"
          aria-multiselectable
        >
          {options.map((opt) => (
            <li key={opt} role="option" aria-selected={value.includes(opt)}>
              <label className="flex cursor-pointer items-center gap-2 px-3 py-2 text-sm text-text-primary hover:bg-surface-overlay">
                <input
                  type="checkbox"
                  checked={value.includes(opt)}
                  onChange={() => toggle(opt)}
                  className="h-3.5 w-3.5 shrink-0 rounded border-border-strong text-brand-500 focus:ring-brand-500/30"
                />
                <span className="min-w-0 truncate">{opt}</span>
              </label>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
