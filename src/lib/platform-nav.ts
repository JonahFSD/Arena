import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Video,
  Users,
  Settings,
  Shield,
  CircleDollarSign,
} from "lucide-react";

export interface PlatformNavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Opens in a new tab (e.g. external tools) */
  external?: boolean;
}

/** Primary sidebar routes — keep in sync with page headers using the same icon */
export const mainNavItems: PlatformNavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/pitches", label: "Pitches", icon: Video },
  { href: "/bounties", label: "Bounties", icon: CircleDollarSign },
  { href: "/community/leadership", label: "Community", icon: Users },
];

export const bottomNavItems: PlatformNavItem[] = [
  { href: "/settings", label: "Settings", icon: Settings },
];

export const adminNavItems: PlatformNavItem[] = [
  { href: "/admin", label: "Admin", icon: Shield },
];
