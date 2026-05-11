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

export default function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  const router = useRouter();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [authLoading, isAuthenticated, router]);

  // Only query user data when authenticated
  const user = useQuery(
    api.users.getMe,
    isAuthenticated ? {} : "skip"
  );

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
          <div className="min-h-dvh">
            {/* Desktop Sidebar */}
            <div className="hidden lg:block">
              <Sidebar isAdmin={isAdmin} />
            </div>

            {/* Main Content — padding tracks sidebar width when collapsed */}
            <PlatformMainPadding>
              <TopBar />
              <main className="p-4 md:p-6 lg:p-8 pb-24 lg:pb-8">{children}</main>
            </PlatformMainPadding>

            {/* Mobile Bottom Nav */}
            <MobileNav />
          </div>
        </SidebarProvider>
      </CommunityMembersFiltersWrapper>
    </UserProvider>
  );
}
