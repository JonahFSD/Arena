"use client";

import { usePathname } from "next/navigation";
import { isCommunityDetailRoute } from "@/lib/header-subtabs";

export default function CommunityLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  if (isCommunityDetailRoute(pathname)) {
    return <>{children}</>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {children}
    </div>
  );
}
