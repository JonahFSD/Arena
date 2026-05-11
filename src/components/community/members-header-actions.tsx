"use client";

import { Button } from "@/components/ui/button";
import { Filter, Search } from "lucide-react";
import { HEADER_SEARCH_INPUT_WRAPPER_CLASS } from "@/lib/header-search-input";
import { cn } from "@/lib/utils";
import { useCommunityMembersFilters } from "@/contexts/community-members-filters-context";

export function MembersHeaderActions() {
  const { search, setSearch, showFilters, toggleFilters } =
    useCommunityMembersFilters();

  return (
    <div className="flex min-w-0 shrink-0 items-center gap-2 sm:h-full sm:gap-3">
      <div className={HEADER_SEARCH_INPUT_WRAPPER_CLASS}>
        <Search
          className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-tertiary"
          aria-hidden
        />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search…"
          autoComplete="off"
          aria-label="Search"
          className={cn(
            "h-8 w-full rounded-lg border border-border-default bg-transparent py-0 pl-7 pr-2",
            "text-xs text-text-primary placeholder:text-text-muted",
            "transition-colors hover:border-border-strong focus:border-white focus:outline-none"
          )}
        />
      </div>
      <Button
        type="button"
        variant={showFilters ? "brand" : "outline"}
        size="sm"
        onClick={toggleFilters}
        leftIcon={<Filter className="h-4 w-4" />}
      >
        Filter
      </Button>
    </div>
  );
}
