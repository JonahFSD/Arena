"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { cn } from "@/lib/utils";

const RANGE_TABS: { href: string; label: string }[] = [
  { href: "/community/leaderboard", label: "This Month" },
  { href: "/community/leaderboard/all-time", label: "All Time" },
];

function rangeTabActive(pathname: string, href: string): boolean {
  if (href === "/community/leaderboard") {
    return (
      pathname === "/community/leaderboard" || pathname === "/community/leaderboard/"
    );
  }
  return pathname === href;
}

/** Right-aligned time range tabs for Community → Leaderboard (matches main SubTabNav behavior). */
export function LeaderboardRangeSubTabs() {
  const pathname = usePathname();
  const navRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const [indicator, setIndicator] = useState<{
    left: number;
    width: number;
    visible: boolean;
  }>({ left: 0, width: 0, visible: false });

  const activeIndex = RANGE_TABS.findIndex((tab) =>
    rangeTabActive(pathname, tab.href)
  );

  const updateIndicator = useCallback(() => {
    const nav = navRef.current;
    const activeEl =
      activeIndex >= 0 ? tabRefs.current[activeIndex] : null;
    if (!nav || !activeEl) {
      setIndicator((prev) => ({ ...prev, visible: false }));
      return;
    }
    setIndicator({
      left: activeEl.offsetLeft,
      width: Math.max(0, activeEl.offsetWidth),
      visible: activeEl.offsetWidth > 0,
    });
  }, [activeIndex]);

  useLayoutEffect(() => {
    updateIndicator();
  }, [updateIndicator, pathname]);

  useLayoutEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    const ro = new ResizeObserver(() => updateIndicator());
    ro.observe(nav);
    window.addEventListener("resize", updateIndicator);
    nav.addEventListener("scroll", updateIndicator, { passive: true });
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", updateIndicator);
      nav.removeEventListener("scroll", updateIndicator);
    };
  }, [updateIndicator]);

  return (
    <div
      ref={navRef}
      className="relative ml-auto flex h-full min-h-0 items-end justify-end gap-x-6 overflow-x-auto"
      role="navigation"
      aria-label="Leaderboard time range"
    >
      {RANGE_TABS.map((tab, i) => {
        const isActive = rangeTabActive(pathname, tab.href);
        return (
          <Link
            key={tab.href}
            ref={(el) => {
              tabRefs.current[i] = el;
            }}
            href={tab.href}
            className={cn(
              "relative pt-2.5 pb-1 text-sm font-medium whitespace-nowrap rounded-t-lg sm:pt-[13px] sm:pb-[5px]",
              "transition-colors duration-300 ease-out",
              isActive
                ? "text-brand-500"
                : "text-text-tertiary hover:text-text-secondary"
            )}
          >
            {tab.label}
          </Link>
        );
      })}
      <span
        className="pointer-events-none absolute -bottom-px h-0.5 rounded-full bg-brand-500 transition-[left,width,opacity] duration-300 ease-out"
        style={{
          left: indicator.left,
          width: indicator.width,
          opacity: indicator.visible ? 1 : 0,
        }}
        aria-hidden
      />
    </div>
  );
}
