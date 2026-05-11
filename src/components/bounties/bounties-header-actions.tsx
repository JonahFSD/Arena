"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Filter, Check, Search, Plus } from "lucide-react";
import { HEADER_SEARCH_INPUT_WRAPPER_CLASS } from "@/lib/header-search-input";
import { cn } from "@/lib/utils";
import {
  parseBountiesSearchFromSearch,
  parseBountiesFilterFromSearch,
  type BountiesActiveFilter,
  type BountiesPastFilter,
} from "@/lib/bounties-list-filters";

const ACTIVE_MENU: { value: BountiesActiveFilter; label: string }[] = [
  { value: "all", label: "Show all" },
  { value: "open", label: "Open" },
];

const PAST_MENU: { value: BountiesPastFilter; label: string }[] = [
  { value: "all", label: "Show all" },
  { value: "reward", label: "Highest reward" },
];

export function BountiesHeaderActions() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isPast = pathname === "/bounties/past";
  const filterValue = parseBountiesFilterFromSearch(pathname, searchParams);
  const qFromUrl = parseBountiesSearchFromSearch(searchParams);
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

  const setBountyFilter = (
    value: BountiesActiveFilter | BountiesPastFilter
  ) => {
    const next = new URLSearchParams(searchParams.toString());
    if (value === "all") {
      next.delete("bounty");
    } else {
      next.set("bounty", value);
    }
    const q = next.toString();
    router.push(q ? `${pathname}?${q}` : pathname, { scroll: false });
    setFilterOpen(false);
  };

  const menu = isPast ? PAST_MENU : ACTIVE_MENU;
  const filterLabel =
    filterValue === "all"
      ? null
      : filterValue === "open"
        ? "Open"
        : filterValue === "reward"
          ? "Reward"
          : null;

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
          aria-label="Search bounties"
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
          {filterLabel && (
            <span className="ml-1.5 rounded-full bg-brand-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-brand-500">
              {filterLabel}
            </span>
          )}
        </Button>
        {filterOpen && (
          <ul
            className="absolute right-0 z-50 mt-1 min-w-[12rem] rounded-lg border border-border-default bg-surface-elevated py-1 shadow-elevated"
            role="listbox"
            aria-label={isPast ? "Sort bounties" : "Filter bounties"}
          >
            {menu.map((opt) => (
              <li
                key={opt.value}
                role="option"
                aria-selected={filterValue === opt.value}
              >
                <button
                  type="button"
                  onClick={() => setBountyFilter(opt.value)}
                  className={cn(
                    "flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-text-primary hover:bg-surface-overlay",
                    filterValue === opt.value && "bg-surface-overlay",
                    opt.value === "all" && "text-text-secondary"
                  )}
                >
                  <span className="flex h-4 w-4 shrink-0 items-center justify-center">
                    {filterValue === opt.value ? (
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
      <Link href="/bounties/new">
        <Button variant="brand" size="sm" leftIcon={<Plus className="h-4 w-4" />}>
          Create
        </Button>
      </Link>
    </div>
  );
}
