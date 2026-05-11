"use client";

import { usePathname } from "next/navigation";
import { isPitchesDetailRoute } from "@/lib/header-subtabs";

export default function PitchesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  if (isPitchesDetailRoute(pathname)) {
    return <>{children}</>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {children}
    </div>
  );
}
