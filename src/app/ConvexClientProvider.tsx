"use client";

import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { ConvexReactClient } from "convex/react";
import { ReactNode } from "react";

// Falls back to a placeholder URL when env is missing so the app boots in demo
// mode without a Convex backend. Real queries will idle forever, which the
// platform layout + dashboard handle via NEXT_PUBLIC_DEMO_MODE seed data.
const CONVEX_URL =
  process.env.NEXT_PUBLIC_CONVEX_URL || "https://placeholder.convex.cloud";
const convex = new ConvexReactClient(CONVEX_URL);

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  return <ConvexAuthProvider client={convex}>{children}</ConvexAuthProvider>;
}
