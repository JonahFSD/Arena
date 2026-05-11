"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Filter, Check, Search } from "lucide-react";
import { HEADER_SEARCH_INPUT_WRAPPER_CLASS } from "@/lib/header-search-input";
import { cn } from "@/lib/utils";
import {
  parseMessagesCofoundersOnly,
  parseMessagesNetworkOnly,
  parseMessagesSearchFromSearch,
  parseMessagesSortFromSearch,
  messagesFilterSummary,
  type MessagesSort,
} from "@/lib/messages-list-filters";

const SORT_OPTIONS: { value: MessagesSort; label: string; description: string }[] =
  [
    {
      value: "activity",
      label: "Recent activity",
      description: "Latest message in the thread",
    },
    {
      value: "unread",
      label: "Unread first",
      description: "Threads with new messages on top",
    },
    {
      value: "sent",
      label: "Last sent",
      description: "By your most recent outgoing message",
    },
    {
      value: "received",
      label: "Last received",
      description: "By their most recent message to you",
    },
  ];

export function MessagesHeaderActions() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const sort = parseMessagesSortFromSearch(searchParams);
  const cofoundersOnly = parseMessagesCofoundersOnly(searchParams);
  const networkOnly = parseMessagesNetworkOnly(searchParams);
  const qFromUrl = parseMessagesSearchFromSearch(searchParams);

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

  const pushParams = (mutate: (next: URLSearchParams) => void) => {
    const next = new URLSearchParams(searchParams.toString());
    mutate(next);
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  const setSort = (value: MessagesSort) => {
    pushParams((next) => {
      if (value === "activity") next.delete("sort");
      else next.set("sort", value);
    });
    setFilterOpen(false);
  };

  const toggleCofounders = () => {
    pushParams((next) => {
      if (cofoundersOnly) next.delete("cofounders");
      else next.set("cofounders", "1");
    });
  };

  const toggleNetwork = () => {
    pushParams((next) => {
      if (networkOnly) next.delete("network");
      else next.set("network", "1");
    });
  };

  const filterLabel = messagesFilterSummary(
    sort,
    cofoundersOnly,
    networkOnly
  );

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
          aria-label="Search messages"
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
          aria-haspopup="dialog"
          onClick={() => setFilterOpen((o) => !o)}
        >
          Filter
          {filterLabel && (
            <span className="ml-1.5 max-w-[7rem] truncate rounded-full bg-brand-500/15 px-1.5 py-0.5 text-[10px] font-medium text-brand-500">
              {filterLabel}
            </span>
          )}
        </Button>
        {filterOpen && (
          <div
            className="absolute right-0 z-50 mt-1 w-[min(calc(100vw-2rem),18rem)] rounded-lg border border-border-default bg-surface-elevated py-2 shadow-elevated"
            role="dialog"
            aria-label="Message filters"
          >
            <p className="px-3 pb-1 text-[10px] font-medium uppercase tracking-wide text-text-muted">
              Sort by
            </p>
            <ul className="max-h-[40vh] overflow-y-auto py-0.5" role="listbox">
              {SORT_OPTIONS.map((opt) => (
                <li key={opt.value} role="option" aria-selected={sort === opt.value}>
                  <button
                    type="button"
                    onClick={() => setSort(opt.value)}
                    className={cn(
                      "flex w-full flex-col gap-0.5 px-3 py-2 text-left hover:bg-surface-overlay",
                      sort === opt.value && "bg-surface-overlay"
                    )}
                  >
                    <span className="flex items-center gap-2 text-sm text-text-primary">
                      <span className="flex h-4 w-4 shrink-0 items-center justify-center">
                        {sort === opt.value ? (
                          <Check className="h-3.5 w-3.5 text-brand-500" />
                        ) : null}
                      </span>
                      {opt.label}
                    </span>
                    <span className="pl-6 text-[11px] text-text-muted">
                      {opt.description}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
            <div className="my-2 h-px bg-border-default" />
            <p className="px-3 pb-1 text-[10px] font-medium uppercase tracking-wide text-text-muted">
              Show only
            </p>
            <div className="flex flex-col gap-0.5 px-2 pb-1">
              <button
                type="button"
                onClick={toggleCofounders}
                className={cn(
                  "flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm text-text-primary hover:bg-surface-overlay",
                  cofoundersOnly && "bg-surface-overlay"
                )}
              >
                <span className="flex h-4 w-4 shrink-0 items-center justify-center">
                  {cofoundersOnly ? (
                    <Check className="h-3.5 w-3.5 text-brand-500" />
                  ) : null}
                </span>
                Open to cofounders
              </button>
              <button
                type="button"
                onClick={toggleNetwork}
                className={cn(
                  "flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm text-text-primary hover:bg-surface-overlay",
                  networkOnly && "bg-surface-overlay"
                )}
              >
                <span className="flex h-4 w-4 shrink-0 items-center justify-center">
                  {networkOnly ? (
                    <Check className="h-3.5 w-3.5 text-brand-500" />
                  ) : null}
                </span>
                Active network
              </button>
              <p className="px-2 pt-0.5 text-[10px] leading-snug text-text-muted">
                Active network shows members who already have connections in the
                community.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
