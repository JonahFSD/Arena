"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import {
  ArrowLeft,
  Trophy,
  Send,
  CheckCircle,
  Clock,
  Calendar,
  Medal,
  Crown,
} from "lucide-react";

const placeIcon = (place: number) => {
  if (place === 1) return <Crown className="h-4 w-4 text-yellow-400" />;
  if (place === 2) return <Medal className="h-4 w-4 text-gray-300" />;
  return <Medal className="h-4 w-4 text-amber-600" />;
};

const placeLabel = (place: number) => {
  if (place === 1) return "1st";
  if (place === 2) return "2nd";
  return "3rd";
};

const placePct = (place: number) => {
  if (place === 1) return 55;
  if (place === 2) return 30;
  return 15;
};

export default function PayoutsPage() {
  const prizePoolData = useQuery(api.prizes.getPastRounds);

  if (prizePoolData === undefined) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-circle border-2 border-brand-500 border-t-transparent" />
          <p className="text-sm text-text-secondary">Loading payouts...</p>
        </div>
      </div>
    );
  }

  // Find the most recent pending pool for the "current month" card
  const currentPool = prizePoolData.find((p) => p.payoutStatus === "pending");
  // History = everything else (or all if no pending)
  const historyPools = prizePoolData.filter((p) => p !== currentPool);

  // Build placements array from a pool record
  const getPlacements = (pool: (typeof prizePoolData)[number]) => {
    const netPrize = pool.netPrize;
    return [
      {
        place: 1,
        name: pool.firstPlaceUser?.fullName ?? null,
        amount: Math.round(netPrize * (pool.firstPlacePct / 100)),
      },
      {
        place: 2,
        name: pool.secondPlaceUser?.fullName ?? null,
        amount: Math.round(netPrize * (pool.secondPlacePct / 100)),
      },
      {
        place: 3,
        name: pool.thirdPlaceUser?.fullName ?? null,
        amount: Math.round(netPrize * (pool.thirdPlacePct / 100)),
      },
    ];
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Current Month */}
      {currentPool && (() => {
        const fee = Math.round(currentPool.totalCollected * (currentPool.operationalFeePct / 100));
        const placements = getPlacements(currentPool);
        return (
          <Card className="bg-gradient-to-r from-brand-500/5 to-transparent border border-dashed border-brand-500/30">
            <CardHeader>
              <div>
                <CardTitle>{currentPool.monthYear} Prize Pool</CardTitle>
                <p className="text-xs text-text-muted mt-1">
                  Voting in progress &bull; Payouts pending
                </p>
              </div>
              <Badge variant="warning">
                <Clock className="h-3 w-3 mr-1" />
                Pending
              </Badge>
            </CardHeader>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-2">
              <div className="p-4 rounded-xl bg-surface-elevated border border-border-default text-center">
                <p className="text-xs text-text-muted">Total Collected</p>
                <p className="text-2xl font-medium text-text-primary mt-1">
                  ${currentPool.totalCollected.toLocaleString()}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-surface-elevated border border-border-default text-center">
                <p className="text-xs text-text-muted">
                  Operational Fee ({currentPool.operationalFeePct}%)
                </p>
                <p className="text-2xl font-medium text-error mt-1">
                  -${fee.toLocaleString()}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-brand-500/10 border border-brand-500/20 text-center col-span-2 sm:col-span-2">
                <p className="text-xs text-brand-400">Prize Pool</p>
                <p className="text-2xl font-medium text-brand-500 mt-1">
                  ${currentPool.netPrize.toLocaleString()}
                </p>
              </div>
            </div>

            {/* Prize Breakdown */}
            <div className="grid grid-cols-3 gap-3 mt-4">
              {[
                { place: 1, pct: currentPool.firstPlacePct, amount: placements[0].amount, color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/20" },
                { place: 2, pct: currentPool.secondPlacePct, amount: placements[1].amount, color: "text-gray-300", bg: "bg-gray-400/10", border: "border-gray-400/20" },
                { place: 3, pct: currentPool.thirdPlacePct, amount: placements[2].amount, color: "text-amber-600", bg: "bg-amber-600/10", border: "border-amber-600/20" },
              ].map((p) => (
                <div key={p.place} className={`p-3 rounded-xl ${p.bg} border ${p.border} text-center`}>
                  <div className="flex items-center justify-center gap-1.5 mb-1">
                    {placeIcon(p.place)}
                    <span className={`text-xs font-medium ${p.color}`}>
                      {placeLabel(p.place)} Place
                    </span>
                  </div>
                  <p className="text-lg font-medium text-text-primary">${p.amount.toLocaleString()}</p>
                  <p className="text-[10px] text-text-muted">{p.pct}% of pool</p>
                </div>
              ))}
            </div>

            <div className="mt-4 flex items-center justify-between p-4 rounded-xl bg-surface-elevated border border-border-default">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-yellow-500/10">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-text-primary">
                    Voting in progress
                  </p>
                  <p className="text-xs text-text-muted">
                    Top 3 will be determined when voting closes
                  </p>
                </div>
              </div>
              <Button variant="brand" disabled leftIcon={<Send className="h-4 w-4" />}>
                Execute Payouts
              </Button>
            </div>
          </Card>
        );
      })()}

      {/* History */}
      <Card>
        <CardHeader>
          <CardTitle>Payout History</CardTitle>
        </CardHeader>

        {historyPools.length === 0 ? (
          <p className="text-sm text-text-muted py-4 text-center">No payout history yet.</p>
        ) : (
          <div className="space-y-4">
            {historyPools.map((pool) => {
              const placements = getPlacements(pool);
              return (
                <div
                  key={pool._id}
                  className="p-4 rounded-xl border border-border-default hover:bg-surface-card-hover transition-colors"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-text-muted" />
                      <span className="text-sm font-medium text-text-primary">
                        {pool.monthYear}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-brand-500">
                        ${pool.netPrize.toLocaleString()} pool
                      </span>
                      <Badge
                        variant={pool.payoutStatus === "paid" ? "success" : "warning"}
                      >
                        {pool.payoutStatus === "paid" ? (
                          <CheckCircle className="h-3 w-3 mr-1" />
                        ) : (
                          <Clock className="h-3 w-3 mr-1" />
                        )}
                        {pool.payoutStatus}
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    {placements.map((p) => (
                      <div
                        key={p.place}
                        className="flex items-center gap-2.5 p-2.5 rounded-lg bg-surface-elevated"
                      >
                        {placeIcon(p.place)}
                        <div className="flex-1 min-w-0">
                          {p.name ? (
                            <div className="flex items-center gap-2">
                              <Avatar name={p.name} size="sm" />
                              <div className="min-w-0">
                                <p className="text-xs font-medium text-text-primary truncate">
                                  {p.name}
                                </p>
                                <p className="text-[10px] text-text-muted">
                                  {placeLabel(p.place)} &bull; {placePct(p.place)}%
                                </p>
                              </div>
                            </div>
                          ) : (
                            <p className="text-xs text-text-muted italic">TBD</p>
                          )}
                        </div>
                        <span className="text-sm font-medium text-text-primary">
                          ${p.amount.toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
