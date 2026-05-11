"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Video,
  CircleDollarSign,
  Users,
} from "lucide-react";

const items = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/pitches", label: "Pitches", icon: Video },
  { href: "/bounties", label: "Bounties", icon: CircleDollarSign },
  { href: "/community/leadership", label: "Community", icon: Users },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-surface-chrome/95 backdrop-blur-xl border-t border-border-default font-sans">
      <div className="flex items-center justify-around h-16 px-2">
        {items.map((item) => {
          const isActive =
            pathname === item.href ||
            pathname.startsWith(item.href + "/") ||
            (item.href === "/community/leadership" &&
              pathname.startsWith("/community"));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center justify-center px-3 py-1.5 rounded-xl transition-colors",
                isActive
                  ? "text-brand-500"
                  : "text-text-tertiary active:text-text-secondary"
              )}
            >
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
