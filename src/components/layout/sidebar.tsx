"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuthActions } from "@convex-dev/auth/react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { cn } from "@/lib/utils";
import { sidebarRailClass, useSidebar } from "@/components/layout/sidebar-context";
import {
  adminNavItems,
  bottomNavItems,
  mainNavItems,
} from "@/lib/platform-nav";
import { ChevronLeft, ChevronRight, LogOut, Swords } from "lucide-react";

interface SidebarProps {
  isAdmin?: boolean;
}

const tronLogoClass =
  "font-tron font-medium uppercase text-brand-500 tracking-[0.18em]";

/** Same horizontal inset as nav rows (`px-3` shell + `px-3` control) so collapse chevron lines up with nav icons. */
const shellPadX = "px-3";

/** One line only during rail animation; ellipsis if the rail is still too narrow. */
const sidebarLabelClass = "min-w-0 flex-1 truncate";

function sidebarBadgeForHref(
  href: string,
  counts: { community: number; bounties: number; settingsBilling: number } | null | undefined
): number {
  if (!counts) return 0;
  if (href === "/community/leadership" || href.startsWith("/community/"))
    return counts.community;
  if (href === "/bounties") return counts.bounties;
  if (href === "/settings") return counts.settingsBilling;
  return 0;
}

function SidebarNavBadge({
  count,
  collapsed,
}: {
  count: number;
  collapsed: boolean;
}) {
  if (count <= 0) return null;
  const display = count > 99 ? "99+" : String(count);
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-brand-500 font-medium leading-none text-black tabular-nums",
        collapsed
          ? "absolute -right-1 -top-1 h-4 min-w-4 px-0.5 text-[9px]"
          : "h-5 min-w-5 px-1 text-[10px]"
      )}
      aria-hidden
    >
      {display}
    </span>
  );
}

const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

export function Sidebar({ isAdmin = false }: SidebarProps) {
  const { collapsed, setCollapsed } = useSidebar();
  const pathname = usePathname();
  const router = useRouter();
  const { signOut } = useAuthActions();
  const liveBadgeCounts = useQuery(
    api.sidebarBadges.getCounts,
    DEMO_MODE ? "skip" : {}
  );
  const badgeCounts = DEMO_MODE
    ? { community: 2, bounties: 3, settingsBilling: 0 }
    : liveBadgeCounts;

  const handleSignOut = async () => {
    await signOut();
    router.replace("/login");
  };

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 h-full z-40 flex flex-col font-sans overflow-x-hidden",
        "bg-surface-chrome border-r border-border-default",
        "transition-all duration-300 ease-in-out",
        sidebarRailClass(collapsed)
      )}
    >
      {/* Logo — same row pattern as nav: icon + label; collapsed shows icon only */}
      <div
        className={cn(
          "h-16 flex items-center border-b border-border-subtle",
          shellPadX
        )}
      >
        <Link
          href="/dashboard"
          aria-label={collapsed ? "021 — home" : undefined}
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium min-w-0 w-full",
            "transition-colors duration-200",
            "text-brand-500 hover:text-brand-400",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/35 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-chrome"
          )}
        >
          <Swords className="h-5 w-5 flex-shrink-0" aria-hidden />
          {!collapsed && (
            <span
              className={cn(
                "text-[13px] leading-none",
                sidebarLabelClass,
                tronLogoClass
              )}
            >
              THE ARENA
            </span>
          )}
        </Link>
      </div>

      {/* Main nav + collapse under tabs; spacer keeps bottom section at viewport bottom */}
      <div className="flex min-h-0 flex-1 flex-col">
        <nav
          className={cn(
            "shrink-0 space-y-1 overflow-y-auto py-3 max-h-[min(60vh,calc(100vh-14rem))]",
            shellPadX
          )}
        >
          {mainNavItems.map((item) => {
            const isActive =
              !item.external &&
              (pathname === item.href ||
                pathname.startsWith(item.href + "/") ||
                (item.href === "/community/leadership" &&
                  pathname.startsWith("/community")));
            if (item.external) {
              return (
                <a
                  key={item.href}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    "flex min-w-0 items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium",
                    "transition-all duration-200",
                    "text-text-secondary hover:text-text-primary hover:bg-surface-elevated"
                  )}
                >
                  {collapsed && (
                    <item.icon className={cn("h-5 w-5 flex-shrink-0")} />
                  )}
                  {!collapsed && (
                    <span className={sidebarLabelClass}>{item.label}</span>
                  )}
                </a>
              );
            }
            const badge = sidebarBadgeForHref(item.href, badgeCounts);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex min-w-0 items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium",
                  "transition-all duration-200",
                  isActive
                    ? "bg-brand-500/10 text-brand-500 shadow-sm"
                    : "text-text-secondary hover:text-text-primary hover:bg-surface-elevated"
                )}
              >
                {collapsed && (
                  <div className="relative shrink-0">
                    <item.icon className={cn("h-5 w-5 flex-shrink-0")} />
                    <SidebarNavBadge count={badge} collapsed />
                  </div>
                )}
                {!collapsed && (
                  <>
                    <span className={sidebarLabelClass}>{item.label}</span>
                    <SidebarNavBadge count={badge} collapsed={false} />
                  </>
                )}
              </Link>
            );
          })}
        </nav>

        <div className={cn("shrink-0 pb-1 pt-1", shellPadX)}>
          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            aria-expanded={!collapsed}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="flex w-full items-center rounded-xl px-3 py-2.5 text-sm font-medium text-text-tertiary transition-all duration-200 hover:bg-surface-elevated hover:text-text-secondary"
          >
            {collapsed ? (
              <ChevronRight className="h-5 w-5 flex-shrink-0" />
            ) : (
              <ChevronLeft className="h-5 w-5 flex-shrink-0" />
            )}
          </button>
        </div>

        <div className="min-h-0 flex-1" aria-hidden />
      </div>

      {/* Bottom */}
      <div className={cn("py-4 space-y-1 border-t border-border-default", shellPadX)}>
        {isAdmin &&
          adminNavItems.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex min-w-0 items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium",
                  "transition-all duration-200",
                  isActive
                    ? "bg-brand-500/10 text-brand-500"
                    : "text-text-secondary hover:text-text-primary hover:bg-surface-elevated"
                )}
              >
                {collapsed && (
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                )}
                {!collapsed && (
                  <span className={sidebarLabelClass}>{item.label}</span>
                )}
              </Link>
            );
          })}

        {bottomNavItems.map((item) => {
          const isActive = pathname === item.href;
          const badge = sidebarBadgeForHref(item.href, badgeCounts);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex min-w-0 items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium",
                "transition-all duration-200",
                isActive
                  ? "bg-brand-500/10 text-brand-500"
                  : "text-text-secondary hover:text-text-primary hover:bg-surface-elevated"
              )}
            >
              {collapsed && (
                <div className="relative shrink-0">
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  <SidebarNavBadge count={badge} collapsed />
                </div>
              )}
              {!collapsed && (
                <>
                  <span className={sidebarLabelClass}>{item.label}</span>
                  <SidebarNavBadge count={badge} collapsed={false} />
                </>
              )}
            </Link>
          );
        })}

        <button
          type="button"
          onClick={handleSignOut}
          aria-label={collapsed ? "Sign out" : undefined}
          className={cn(
            "flex min-w-0 items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium w-full text-left",
            "transition-all duration-200",
            "text-text-secondary hover:text-error hover:bg-error/10"
          )}
        >
          <LogOut className="h-5 w-5 flex-shrink-0" />
          {!collapsed && (
            <span className={sidebarLabelClass}>Sign out</span>
          )}
        </button>
      </div>
    </aside>
  );
}
