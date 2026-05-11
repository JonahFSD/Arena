"use client";

import { useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  CreditCard,
  ExternalLink,
  CheckCircle,
  Download,
  Zap,
  Trophy,
  Users,
  MessageSquare,
  Sparkles,
} from "lucide-react";
import {
  platformPaneBleedClass,
  platformPaneCellPaddingClass,
  platformPaneGridCellFillClass,
  platformPaneTileClass,
} from "@/lib/platform-pane-grid";

/** Mock payment history rows — will be replaced with real Stripe data. */
const MOCK_PAYMENT_HISTORY = [
  { date: "Mar 1, 2026", amount: "$10.00", invoiceId: "inv_mar2026" },
  { date: "Feb 1, 2026", amount: "$10.00", invoiceId: "inv_feb2026" },
  { date: "Jan 1, 2026", amount: "$10.00", invoiceId: "inv_jan2026" },
  { date: "Dec 1, 2025", amount: "$10.00", invoiceId: "inv_dec2025" },
];

export default function SettingsSubscriptionPage() {
  return (
    <Suspense fallback={null}>
      <SettingsSubscriptionPageInner />
    </Suspense>
  );
}

function SettingsSubscriptionPageInner() {
  const membership = useQuery(api.memberships.getMyMembership);
  const searchParams = useSearchParams();
  const [coupon, setCoupon] = useState("");

  // Pre-fill coupon from URL param (passed from PaywallGate)
  useEffect(() => {
    const c = searchParams.get("coupon");
    if (c) setCoupon(c);
  }, [searchParams]);

  const isActive =
    membership?.status === "active" || membership?.status === "trialing";
  const isPastDue = membership?.status === "past_due";

  // Loading state
  if (membership === undefined) {
    return (
      <div className="animate-fade-in w-full">
        <div className={cn("rounded-none overflow-hidden", platformPaneBleedClass)}>
          <div className={cn(platformPaneGridCellFillClass, platformPaneCellPaddingClass)}>
            <div className="h-48 animate-pulse rounded-none bg-surface-elevated/50" />
          </div>
        </div>
      </div>
    );
  }

  // ─── Upgrade flow (no active membership) ───
  if (!isActive && !isPastDue) {
    return (
      <div className="animate-fade-in w-full">
        <div className={cn("rounded-none overflow-hidden", platformPaneBleedClass)}>
          {/* Plan details */}
          <div className={cn(platformPaneGridCellFillClass, platformPaneCellPaddingClass)}>
            <Card className={cn(platformPaneTileClass, "flex flex-col")}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <CardTitle>Youth Venture Membership</CardTitle>
                  </div>
                  <CardDescription className="mt-1">
                    Join the arena and compete monthly for real prizes.
                  </CardDescription>
                </div>
                <p className="text-4xl font-light text-text-primary">
                  $10
                  <span className="text-sm font-normal text-text-muted">
                    /mo
                  </span>
                </p>
              </div>

              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { icon: Sparkles, label: "Submit venture pitches monthly" },
                  { icon: Trophy, label: "Compete for the monthly prize pool" },
                  { icon: Users, label: "Access the member directory" },
                  { icon: MessageSquare, label: "Direct messaging with members" },
                ].map((perk) => (
                  <div
                    key={perk.label}
                    className="flex items-center gap-2.5 text-sm text-text-secondary"
                  >
                    <perk.icon className="h-4 w-4 text-text-tertiary shrink-0" />
                    {perk.label}
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Coupon + checkout */}
          <div
            className={cn(
              "border-t border-solid border-border-default",
              platformPaneGridCellFillClass,
              platformPaneCellPaddingClass
            )}
          >
            <Card className={cn(platformPaneTileClass, "flex flex-col gap-4")}>
              <CardTitle>Start Your Membership</CardTitle>
              <div className="max-w-sm">
                <Input
                  label="Coupon Code"
                  placeholder="e.g. FOUNDING100"
                  value={coupon}
                  onChange={(e) => setCoupon(e.target.value.toUpperCase())}
                />
              </div>
              <div>
                <Button
                  variant="brand"
                  leftIcon={<Zap className="h-4 w-4" />}
                >
                  Subscribe &mdash; $10/mo
                </Button>
                <p className="text-xs text-text-muted mt-2">
                  90% of your membership goes directly to the monthly prize pool.
                  Cancel anytime.
                </p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // ─── Active / past-due membership ───
  return (
    <div className="animate-fade-in w-full">
      <div className={cn("rounded-none overflow-hidden", platformPaneBleedClass)}>
        {/* Membership */}
        <div className={cn(platformPaneGridCellFillClass, platformPaneCellPaddingClass)}>
          <Card className={cn(platformPaneTileClass, "flex flex-col")}>
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <CardTitle>Youth Venture Membership</CardTitle>
                  <Badge variant={isPastDue ? "warning" : "success"}>
                    {isPastDue ? (
                      "Past Due"
                    ) : (
                      <>
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Active
                      </>
                    )}
                  </Badge>
                </div>
                <CardDescription className="mt-1">
                  $10/month &bull; 90% goes to the monthly prize pool
                </CardDescription>
              </div>
              <p className="text-4xl font-light text-text-primary">
                $10
                <span className="text-sm font-normal text-text-muted">
                  /mo
                </span>
              </p>
            </div>
            <div className="mt-4 p-3 rounded-lg bg-surface-elevated border border-border-default">
              <div className="flex items-center justify-between text-sm">
                <span className="text-text-secondary">
                  Current billing period
                </span>
                <span className="text-text-primary font-medium">
                  {membership?.currentPeriodStart
                    ? new Date(membership.currentPeriodStart).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                    : "Mar 1"}{" "}
                  -{" "}
                  {membership?.currentPeriodEnd
                    ? new Date(membership.currentPeriodEnd).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                    : "Mar 31, 2026"}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm mt-2">
                <span className="text-text-secondary">Next payment</span>
                <span className="text-text-primary font-medium">
                  {membership?.currentPeriodEnd
                    ? new Date(membership.currentPeriodEnd).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
                    : "April 1, 2026"}
                </span>
              </div>
            </div>
            <div className="mt-4">
              <Button variant="ghost" size="sm" className="text-error hover:text-error">
                Cancel Subscription
              </Button>
            </div>
          </Card>
        </div>

        {/* Payment Method */}
        <div
          className={cn(
            "border-t border-solid border-border-default",
            platformPaneGridCellFillClass,
            platformPaneCellPaddingClass
          )}
        >
          <Card className={cn(platformPaneTileClass, "flex flex-col")}>
            <CardTitle>Payment Method</CardTitle>
            <div className="mt-4 p-4 rounded-xl border border-border-default flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-surface-elevated">
                  <CreditCard className="h-5 w-5 text-text-secondary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-text-primary">
                    Visa ending in 4242
                  </p>
                  <p className="text-xs text-text-muted">Expires 12/2027</p>
                </div>
              </div>
              <Button variant="ghost" size="sm">
                Update
              </Button>
            </div>
          </Card>
        </div>

        {/* Payment History */}
        <div
          className={cn(
            "border-t border-solid border-border-default",
            platformPaneGridCellFillClass,
            platformPaneCellPaddingClass
          )}
        >
          <Card className={cn(platformPaneTileClass, "flex flex-col")}>
            <div className="flex items-center justify-between">
              <CardTitle>Payment History</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                rightIcon={<ExternalLink className="h-3.5 w-3.5" />}
              >
                Billing Portal
              </Button>
            </div>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border-default">
                    <th className="pb-2 text-left font-medium text-text-muted">
                      Date
                    </th>
                    <th className="pb-2 text-left font-medium text-text-muted">
                      Amount
                    </th>
                    <th className="pb-2 text-right font-medium text-text-muted">
                      Receipt
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {MOCK_PAYMENT_HISTORY.map((row) => (
                    <tr
                      key={row.invoiceId}
                      className="border-b border-border-subtle last:border-0"
                    >
                      <td className="py-3 text-text-primary">{row.date}</td>
                      <td className="py-3 text-text-primary tabular-nums">
                        {row.amount}
                      </td>
                      <td className="py-3 text-right">
                        <Button variant="ghost" size="sm">
                          <Download className="h-3.5 w-3.5" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
