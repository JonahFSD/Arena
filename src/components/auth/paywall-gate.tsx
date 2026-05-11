"use client";

import { Lock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface PaywallGateProps {
  feature: string;
  children: React.ReactNode;
}

export function PaywallGate({ feature, children }: PaywallGateProps) {
  // TODO: Replace with real membership check when Stripe is wired
  // const membership = useQuery(api.memberships.getMyMembership);
  // const hasAccess = membership?.status === "active";
  const hasAccess = true;

  if (hasAccess) {
    return <>{children}</>;
  }

  return (
    <div className="relative">
      {/* Blurred content behind the gate */}
      <div className="pointer-events-none select-none blur-sm opacity-40">
        {children}
      </div>

      {/* Overlay card */}
      <div className="absolute inset-0 flex items-center justify-center z-10">
        <Card padding="lg" className="max-w-md text-center shadow-elevated">
          <div className="flex flex-col items-center gap-4">
            <div className="p-3 rounded-2xl bg-surface-elevated">
              <Lock className="h-6 w-6 text-text-secondary" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-lg font-medium text-text-primary">
                Membership Required
              </h3>
              <p className="text-sm text-text-secondary">
                You need an active membership to {feature}. Subscribe to unlock
                full access to the platform.
              </p>
            </div>
            <Button variant="brand" size="lg">
              Subscribe Now
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
