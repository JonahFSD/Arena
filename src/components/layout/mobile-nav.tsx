"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuthActions } from "@convex-dev/auth/react";
import { Menu, X, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/logo";
import {
  mainNavItems,
  bottomNavItems,
  adminNavItems,
} from "@/lib/platform-nav";

interface MobileNavProps {
  isAdmin?: boolean;
}

/**
 * Mobile chrome: top-left hamburger + 021 wordmark, opens a left-slide drawer
 * containing the same nav items the desktop sidebar uses. Replaces the old
 * bottom tab bar so the layout pattern matches desktop (drawer on tap vs.
 * sidebar always-on).
 *
 * lg:hidden across the board — desktop uses the real Sidebar component.
 */
export function MobileNav({ isAdmin = false }: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { signOut } = useAuthActions();

  // Close drawer whenever route changes (e.g., user tapped a nav item).
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Lock body scroll while drawer is open.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Close on Escape.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const handleSignOut = async () => {
    setOpen(false);
    await signOut();
    router.push("/login");
  };

  const isItemActive = (href: string): boolean =>
    pathname === href ||
    pathname.startsWith(href + "/") ||
    (href === "/community/leadership" && pathname.startsWith("/community"));

  const navLinkClass = (href: string) =>
    cn(
      "block px-3 py-2.5 rounded-xl text-sm transition-colors",
      isItemActive(href)
        ? "bg-brand-500/10 text-brand-500"
        : "text-text-secondary hover:bg-surface-elevated hover:text-text-primary"
    );

  return (
    <>
      {/* Top mobile header — hamburger left, wordmark immediately to the right */}
      <header className="fixed top-0 left-0 right-0 z-40 lg:hidden h-14 flex items-center gap-3 px-4 bg-surface-chrome/95 backdrop-blur-xl border-b border-border-default">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          aria-expanded={open}
          className={cn(
            "flex items-center justify-center rounded-lg p-2 -ml-2 text-text-tertiary",
            "transition-colors duration-200 hover:text-text-secondary hover:bg-surface-elevated",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text-primary/25"
          )}
        >
          <Menu className="h-5 w-5" />
        </button>
        <Link
          href="/dashboard"
          aria-label="021 — home"
          className="text-text-primary transition-opacity hover:opacity-75"
        >
          <Logo variant="wordmark" size="md" />
        </Link>
      </header>

      {/* Backdrop */}
      <div
        onClick={() => setOpen(false)}
        aria-hidden="true"
        className={cn(
          "fixed inset-0 z-40 lg:hidden bg-black/60 backdrop-blur-sm",
          "transition-opacity duration-300",
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
      />

      {/* Drawer */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Navigation"
        className={cn(
          "fixed top-0 left-0 bottom-0 z-50 lg:hidden w-72 max-w-[85vw]",
          "bg-surface-chrome border-r border-border-default flex flex-col",
          "transform transition-transform duration-300 ease-out",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Drawer header — wordmark + close X */}
        <div className="h-14 flex items-center justify-between gap-2 px-4 border-b border-border-subtle shrink-0">
          <Link
            href="/dashboard"
            aria-label="021 — home"
            className="text-text-primary transition-opacity hover:opacity-75"
          >
            <Logo variant="wordmark" size="md" />
          </Link>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close menu"
            className={cn(
              "flex items-center justify-center rounded-lg p-2 -mr-2 text-text-tertiary",
              "transition-colors duration-200 hover:text-text-secondary hover:bg-surface-elevated"
            )}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Main nav */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {mainNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={navLinkClass(item.href)}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Bottom: settings + admin (if applicable) + sign out */}
        <div className="p-3 space-y-1 border-t border-border-default shrink-0">
          {isAdmin &&
            adminNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={navLinkClass(item.href)}
              >
                {item.label}
              </Link>
            ))}
          {bottomNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={navLinkClass(item.href)}
            >
              {item.label}
            </Link>
          ))}
          <button
            type="button"
            onClick={handleSignOut}
            className={cn(
              "w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm",
              "text-text-secondary hover:bg-surface-elevated hover:text-text-primary transition-colors"
            )}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            Sign out
          </button>
        </div>
      </aside>
    </>
  );
}
