"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Plus, Filter, Check, Search } from "lucide-react";
import { HEADER_SEARCH_INPUT_WRAPPER_CLASS } from "@/lib/header-search-input";
import { cn } from "@/lib/utils";
import {
  parsePitchesStageFromSearch,
  parsePitchesSearchFromSearch,
  PITCHES_STAGE_MENU_OPTIONS,
  type PitchesMyStageFilter,
} from "@/lib/pitches-my-stage-filter";

export function PitchesMyHeaderActions() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const stageFilter = parsePitchesStageFromSearch(searchParams);
  const qFromUrl = parsePitchesSearchFromSearch(searchParams);
  const [filterOpen, setFilterOpen] = useState(false);
  const filterRootRef = useRef<HTMLDivElement>(null);
  const [searchInput, setSearchInput] = useState(qFromUrl);
  const searchParamsRef = useRef(searchParams);
  searchParamsRef.current = searchParams;

  useEffect(() => {
    setSearchInput(qFromUrl);
  }, [qFromUrl]);

  useEffect(() => {
    const t = window.setTimeout(() => {
      const sp = searchParamsRef.current;
      const trimmed = searchInput.trim();
      const currentQ = (sp.get("q") ?? "").trim();
      if (trimmed === currentQ) return;
      const next = new URLSearchParams(sp.toString());
      if (trimmed) next.set("q", trimmed);
      else next.delete("q");
      const qs = next.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    }, 300);
    return () => window.clearTimeout(t);
  }, [searchInput, pathname, router]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        filterRootRef.current &&
        !filterRootRef.current.contains(e.target as Node)
      ) {
        setFilterOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const setStage = (value: PitchesMyStageFilter) => {
    const next = new URLSearchParams(searchParams.toString());
    if (value === null) {
      next.delete("stage");
    } else {
      next.set("stage", value);
    }
    const q = next.toString();
    router.push(q ? `${pathname}?${q}` : pathname, { scroll: false });
    setFilterOpen(false);
  };

  return (
    <div className="flex min-w-0 shrink-0 items-center gap-2 sm:h-full sm:gap-3">
      <div className={HEADER_SEARCH_INPUT_WRAPPER_CLASS}>
        <Search
          className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-tertiary"
          aria-hidden
        />
        <input
          type="search"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search…"
          autoComplete="off"
          aria-label="Search pitches"
          className={cn(
            "h-8 w-full rounded-lg border border-border-default bg-transparent py-0 pl-7 pr-2",
            "text-xs text-text-primary placeholder:text-text-muted",
            "transition-colors hover:border-border-strong focus:border-white focus:outline-none"
          )}
        />
      </div>
      <div className="relative" ref={filterRootRef}>
        <Button
          type="button"
          variant="outline"
          size="sm"
          leftIcon={<Filter className="h-4 w-4" />}
          aria-expanded={filterOpen}
          aria-haspopup="listbox"
          onClick={() => setFilterOpen((o) => !o)}
        >
          Filter
          {stageFilter !== null && (
            <span className="ml-1.5 rounded-full bg-brand-500/15 px-1.5 py-0.5 text-[10px] font-medium text-brand-500">
              {stageFilter === "draft" ? "Draft" : "Submitted"}
            </span>
          )}
        </Button>
        {filterOpen && (
          <ul
            className="absolute right-0 z-50 mt-1 min-w-[12rem] rounded-lg border border-border-default bg-surface-elevated py-1 shadow-elevated"
            role="listbox"
            aria-label="Filter by stage"
          >
            {PITCHES_STAGE_MENU_OPTIONS.map((opt) => (
              <li
                key={opt.label}
                role="option"
                aria-selected={stageFilter === opt.value}
              >
                <button
                  type="button"
                  onClick={() => setStage(opt.value)}
                  className={cn(
                    "flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-text-primary hover:bg-surface-overlay",
                    stageFilter === opt.value && "bg-surface-overlay",
                    opt.value === null && "text-text-secondary"
                  )}
                >
                  <span className="flex h-4 w-4 shrink-0 items-center justify-center">
                    {stageFilter === opt.value ? (
                      <Check className="h-3.5 w-3.5 text-brand-500" />
                    ) : null}
                  </span>
                  {opt.label}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <Link href="/pitches/new">
        <Button
          variant="brand"
          size="sm"
          leftIcon={<Plus className="h-4 w-4" />}
        >
          New Pitch
        </Button>
      </Link>
    </div>
  );
}
