"use client";

import { usePathname } from "next/navigation";
import { CommunityMembersFiltersProvider } from "@/contexts/community-members-filters-context";

/** Provides shared members list filter state for `/community/members` (header + page). */
export function CommunityMembersFiltersWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  if (pathname !== "/community/members") {
    return <>{children}</>;
  }
  return (
    <CommunityMembersFiltersProvider>{children}</CommunityMembersFiltersProvider>
  );
}
