"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface Tab {
  id: string;
  label: string;
  icon?: React.ReactNode;
  count?: number;
}

interface TabsProps {
  tabs: Tab[];
  defaultTab?: string;
  onChange?: (tabId: string) => void;
  className?: string;
  children?: (activeTab: string) => React.ReactNode;
}

export function Tabs({ tabs, defaultTab, onChange, className, children }: TabsProps) {
  const [active, setActive] = useState(defaultTab || tabs[0]?.id);

  const handleChange = (id: string) => {
    setActive(id);
    onChange?.(id);
  };

  return (
    <div className={className}>
      <div className="flex gap-1 p-1 bg-surface-elevated rounded-xl border border-border-default">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleChange(tab.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
              active === tab.id
                ? "bg-surface-overlay text-text-primary shadow-sm"
                : "text-text-tertiary hover:text-text-secondary"
            )}
          >
            {tab.icon}
            {tab.label}
            {tab.count !== undefined && (
              <span
                className={cn(
                  "px-1.5 py-0.5 rounded-full text-xs",
                  active === tab.id
                    ? "bg-brand-500/10 text-brand-500"
                    : "bg-surface-primary text-text-muted"
                )}
              >
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>
      {children && <div className="mt-4">{children(active)}</div>}
    </div>
  );
}
