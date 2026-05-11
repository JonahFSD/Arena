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

export interface SubTab {
  href: string;
  label: string;
  badge?: number;
}

/** Reserved under `/community/*` so Members list + other sub-routes are not member profiles. */
const COMMUNITY_RESERVED_SEGMENTS = new Set([
  "messages",
  "leadership",
  "leaderboard",
  "members",
]);

function isSubTabActive(
  tab: SubTab,
  pathname: string,
  firstTabHref: string
): boolean {
  if (pathname === tab.href) return true;
  // Members hub is `/community/members`; profiles are `/community/:id` (not reserved segments).
  if (tab.href === "/community/members") {
    const segments = pathname.split("/").filter(Boolean);
    if (segments[0] === "community" && segments.length === 2) {
      if (!COMMUNITY_RESERVED_SEGMENTS.has(segments[1])) {
        return true;
      }
    }
    return false;
  }
  if (tab.href !== firstTabHref && pathname.startsWith(`${tab.href}/`)) {
    return true;
  }
  return false;
}

export function SubTabNav({ tabs }: { tabs: SubTab[] }) {
  const pathname = usePathname();
  const navRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const [indicator, setIndicator] = useState<{
    left: number;
    width: number;
    visible: boolean;
  }>({ left: 0, width: 0, visible: false });

  const firstTabHref = tabs[0]?.href ?? "";
  const activeIndex = tabs.findIndex((tab) =>
    isSubTabActive(tab, pathname, firstTabHref)
  );

  const updateIndicator = useCallback(() => {
    const nav = navRef.current;
    const activeEl =
      activeIndex >= 0 ? tabRefs.current[activeIndex] : null;
    if (!nav || !activeEl) {
      setIndicator((prev) => ({ ...prev, visible: false }));
      return;
    }
    const left = activeEl.offsetLeft;
    const width = Math.max(0, activeEl.offsetWidth);
    setIndicator({ left, width, visible: width > 0 });
  }, [activeIndex]);

  useLayoutEffect(() => {
    updateIndicator();
  }, [updateIndicator, pathname, tabs]);

  useLayoutEffect(() => {
    const nav = navRef.current;
    if (!nav) return;

    const ro = new ResizeObserver(() => {
      updateIndicator();
    });
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
      className="relative flex h-full min-h-0 items-end gap-x-6 overflow-x-auto"
    >
      {tabs.map((tab, i) => {
        const isActive = isSubTabActive(tab, pathname, firstTabHref);
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
            {tab.badge !== undefined && tab.badge > 0 && (
              <span
                className="ml-1.5 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-sm bg-brand-500 px-1 text-[10px] font-medium leading-none text-black"
                aria-hidden
              >
                {tab.badge > 99 ? "99+" : tab.badge}
              </span>
            )}
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
