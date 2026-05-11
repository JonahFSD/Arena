"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Zap,
  Sparkles,
  Trophy,
  Users,
  MessageSquare,
  Lock,
} from "lucide-react";

const PERKS = [
  { icon: Sparkles, label: "Submit venture pitches monthly" },
  { icon: Trophy, label: "Compete for the monthly prize pool" },
  { icon: Users, label: "Access the member directory" },
  { icon: MessageSquare, label: "Direct messaging with members" },
];

/**
 * Wraps page content that requires an active membership.
 * Shows an upgrade prompt if the user has no active/trialing membership.
 */
export function PaywallGate({ children }: { children: React.ReactNode }) {
  const membership = useQuery(api.memberships.getMyMembership);
  const [coupon, setCoupon] = useState("");

  // Still loading — show nothing (prevents flash)
  if (membership === undefined) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="h-6 w-6 animate-spin rounded-circle border-2 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  const isActive =
    membership?.status === "active" || membership?.status === "trialing";

  if (isActive) {
    return <>{children}</>;
  }

  // Build upgrade URL with optional coupon
  const upgradeHref = coupon
    ? `/settings/subscription?coupon=${encodeURIComponent(coupon)}`
    : "/settings/subscription";

  return (
    <div className="flex items-center justify-center min-h-[50vh] animate-fade-in">
      <div className="w-full max-w-md mx-auto px-4">
        <div className="flex flex-col items-center text-center">
          <div className="p-4 rounded-2xl bg-brand-500/10 mb-5">
            <Lock className="h-8 w-8 text-brand-500" />
          </div>
          <h2 className="text-xl font-bold text-text-primary">
            Membership Required
          </h2>
          <p className="text-sm text-text-secondary mt-2 max-w-sm">
            Upgrade to a Youth Venture Membership to unlock this feature and compete for real prizes.
          </p>
        </div>

        <div className="mt-6 space-y-2.5">
          {PERKS.map((perk) => (
            <div
              key={perk.label}
              className="flex items-center gap-2.5 text-sm text-text-secondary"
            >
              <perk.icon className="h-4 w-4 text-brand-500 shrink-0" />
              {perk.label}
            </div>
          ))}
        </div>

        <div className="mt-6 space-y-3">
          <Input
            label="Coupon Code"
            placeholder="e.g. FOUNDING100"
            value={coupon}
            onChange={(e) => setCoupon(e.target.value.toUpperCase())}
          />
          <Link href={upgradeHref} className="block">
            <Button
              variant="brand"
              className="w-full"
              leftIcon={<Zap className="h-4 w-4" />}
            >
              Upgrade &mdash; $10/mo
            </Button>
          </Link>
          <p className="text-xs text-text-muted text-center">
            90% of your membership goes to the prize pool. Cancel anytime.
          </p>
        </div>
      </div>
    </div>
  );
}
