"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";

/** Collapsed width = nav px-3 + link px-3 + icon + link pr + nav pr (icons align with expanded) */
export function sidebarRailClass(collapsed: boolean) {
  return collapsed ? "w-[68px]" : "w-[210px]";
}

export function sidebarMainPaddingClass(collapsed: boolean) {
  return collapsed ? "lg:pl-[68px]" : "lg:pl-[210px]";
}

type SidebarContextValue = {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
};

const SidebarContext = createContext<SidebarContextValue | null>(null);

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const value = useMemo(
    () => ({ collapsed, setCollapsed }),
    [collapsed]
  );
  return (
    <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>
  );
}

export function useSidebar() {
  const ctx = useContext(SidebarContext);
  if (!ctx) {
    throw new Error("useSidebar must be used within SidebarProvider");
  }
  return ctx;
}

/** Applies left offset matching the desktop sidebar width (expanded vs collapsed). */
export function PlatformMainPadding({ children }: { children: ReactNode }) {
  const { collapsed } = useSidebar();
  return (
    <div
      className={cn(
        "transition-[padding-left] duration-300 ease-in-out",
        sidebarMainPaddingClass(collapsed)
      )}
    >
      {children}
    </div>
  );
}
