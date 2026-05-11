"use client";

import { useConvexAuth, useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { api } from "../../../convex/_generated/api";
import { UserProvider } from "@/contexts/user-context";
import {
  PlatformMainPadding,
  SidebarProvider,
} from "@/components/layout/sidebar-context";
import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/top-bar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { CommunityMembersFiltersWrapper } from "@/components/layout/community-members-filters-wrapper";
import type { Doc } from "../../../convex/_generated/dataModel";

/** Demo mode: set NEXT_PUBLIC_DEMO_MODE=true in .env.local to bypass auth + Convex queries. */
const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

/** Fake user used in demo mode. Cast through unknown because we don't have a real Convex Id. */
const DEMO_USER = {
  _id: "demo-user" as unknown as Doc<"users">["_id"],
  _creationTime: Date.now(),
  email: "demo@thearena.local",
  name: "Connor",
  role: "admin",
} as unknown as Doc<"users">;

export default function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  const router = useRouter();

  // Redirect to login if not authenticated (skipped in demo mode)
  useEffect(() => {
    if (DEMO_MODE) return;
    if (!authLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [authLoading, isAuthenticated, router]);

  // Only query user data when authenticated (skipped in demo mode)
  const user = useQuery(
    api.users.getMe,
    !DEMO_MODE && isAuthenticated ? {} : "skip"
  );

  // Demo-mode shortcut: render with the fake user immediately.
  if (DEMO_MODE) {
    return (
      <UserProvider user={DEMO_USER}>
        <CommunityMembersFiltersWrapper>
          <SidebarProvider>
            <div className="relative min-h-dvh">
              <div className="relative z-10 hidden lg:block">
                <Sidebar isAdmin={true} />
              </div>
              <PlatformMainPadding>
                <div className="relative z-10 pt-14 lg:pt-0">
                  <TopBar />
                  <main className="p-4 md:p-6 lg:p-8">
                    {children}
                  </main>
                </div>
              </PlatformMainPadding>
              <MobileNav isAdmin={true} />
            </div>
          </SidebarProvider>
        </CommunityMembersFiltersWrapper>
      </UserProvider>
    );
  }

  // Show loading state while checking auth
  if (authLoading || (!isAuthenticated && !authLoading)) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-circle border-2 border-brand-500 border-t-transparent" />
          <p className="text-sm text-text-secondary">Loading...</p>
        </div>
      </div>
    );
  }

  // Wait for user data to load
  if (user === undefined) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-circle border-2 border-brand-500 border-t-transparent" />
          <p className="text-sm text-text-secondary">Loading...</p>
        </div>
      </div>
    );
  }

  const isAdmin =
    user?.role === "admin" || user?.role === "superadmin";

  return (
    <UserProvider user={user}>
      <CommunityMembersFiltersWrapper>
        <SidebarProvider>
          <div className="relative min-h-dvh">
            {/* Desktop Sidebar */}
            <div className="relative z-10 hidden lg:block">
              <Sidebar isAdmin={isAdmin} />
            </div>

            {/* Main Content — padding tracks sidebar width when collapsed.
                pt-14 on mobile leaves room for the fixed mobile header. */}
            <PlatformMainPadding>
              <div className="relative z-10 pt-14 lg:pt-0">
                <TopBar />
                <main className="p-4 md:p-6 lg:p-8">{children}</main>
              </div>
            </PlatformMainPadding>

            {/* Mobile chrome — hamburger top header + slide-in drawer */}
            <MobileNav isAdmin={isAdmin} />
          </div>
        </SidebarProvider>
      </CommunityMembersFiltersWrapper>
    </UserProvider>
  );
}
