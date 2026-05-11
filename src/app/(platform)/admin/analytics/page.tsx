"use client";

import dynamic from "next/dynamic";
import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { Progress } from "@/components/ui/progress";

const AdminPlatformTrendsChart = dynamic(
  () =>
    import("@/components/admin/admin-platform-trends-chart").then(
      (m) => m.AdminPlatformTrendsChart
    ),
  {
    ssr: false,
    loading: () => (
      <div className="h-full min-h-[16rem] rounded-xl border border-border-default bg-surface-card/50 animate-pulse" />
    ),
  }
);

export default function AnalyticsPage() {
  const stats = useQuery(api.admin.getDashboardStats);
  const trends = useQuery(api.admin.getAnalyticsTrends);

  // Use last 6 months of trends for the growth chart
  const monthlyData = (trends ?? []).slice(-6);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Members"
          value={stats ? String(stats.totalMembers) : "—"}
          change={stats?.currentMonthSubmissions ?? 0}
          changeLabel="submissions this month"
        />
        <StatCard
          label="Submissions This Month"
          value={stats ? String(stats.currentMonthSubmissions) : "—"}
        />
        <StatCard
          label="Votes Cast"
          value={stats ? String(stats.totalVotes) : "—"}
        />
        <StatCard
          label="Total Revenue"
          value={
            stats
              ? `$${stats.totalRevenue >= 1000 ? `${(stats.totalRevenue / 1000).toFixed(1)}k` : stats.totalRevenue}`
              : "—"
          }
        />
      </div>

      {/* Platform Trends (filterable time-series) */}
      <div className="min-h-[22rem]">
        <AdminPlatformTrendsChart className="h-full min-h-0" />
      </div>

      {/* Growth Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Member Growth</CardTitle>
          </CardHeader>
          <div className="space-y-4 mt-2">
            {monthlyData.map((data) => (
              <div key={data.monthKey} className="flex items-center gap-4">
                <span className="text-xs text-text-muted w-8">
                  {data.label}
                </span>
                <Progress
                  value={data.members}
                  max={Math.max(250, ...monthlyData.map((d) => d.members))}
                  size="sm"
                  className="flex-1"
                />
                <span className="text-xs font-mono text-text-secondary w-8 text-right">
                  {data.members}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-4 p-3 rounded-lg bg-surface-elevated border border-border-default">
            <p className="text-xs text-text-secondary">
              <span className="text-text-primary font-medium">Target: 250 members</span>{" "}
              &bull; At 250+ members, the 10% operational fee covers all
              infrastructure costs
            </p>
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Submission Metrics</CardTitle>
          </CardHeader>
          <div className="space-y-4 mt-2">
            <div className="flex items-center justify-between p-3 rounded-lg bg-surface-elevated">
              <span className="text-sm text-text-secondary">
                Avg submissions per member
              </span>
              <span className="text-sm font-medium text-text-primary">
                {stats && stats.totalMembers > 0
                  ? (stats.totalSubmissions / stats.totalMembers).toFixed(2)
                  : "—"}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-surface-elevated">
              <span className="text-sm text-text-secondary">
                Avg AI score
              </span>
              <span className="text-sm font-medium text-text-primary">
                {stats ? stats.avgAiScore || "—" : "—"}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-surface-elevated">
              <span className="text-sm text-text-secondary">
                Total submissions
              </span>
              <span className="text-sm font-medium text-text-primary">
                {stats ? stats.totalSubmissions : "—"}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-surface-elevated">
              <span className="text-sm text-text-secondary">
                Total votes
              </span>
              <span className="text-sm font-medium text-text-primary">
                {stats ? stats.totalVotes : "—"}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-surface-elevated">
              <span className="text-sm text-text-secondary">
                Pending applications
              </span>
              <span className="text-sm font-medium text-text-primary">
                {stats ? stats.pendingApplications : "—"}
              </span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
