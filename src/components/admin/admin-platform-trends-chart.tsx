"use client";

import { useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";

type TrendMetricId =
  | "members"
  | "revenue"
  | "applicants"
  | "submissions"
  | "avgAiScore"
  | "votes"
  | "points";

const TREND_METRICS: {
  id: TrendMetricId;
  label: string;
  format: "integer" | "currency" | "oneDecimal";
}[] = [
  { id: "members", label: "Total members", format: "integer" },
  { id: "revenue", label: "Total revenue", format: "currency" },
  { id: "applicants", label: "Applicants", format: "integer" },
  { id: "submissions", label: "Submissions by month", format: "integer" },
  { id: "avgAiScore", label: "Avg. AI score (platform)", format: "oneDecimal" },
  { id: "votes", label: "Votes", format: "integer" },
  { id: "points", label: "Points earned", format: "integer" },
];

function formatTooltipValue(
  value: number,
  format: (typeof TREND_METRICS)[number]["format"]
): string {
  if (format === "currency") {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(value);
  }
  if (format === "oneDecimal") {
    return value.toFixed(1);
  }
  return Math.round(value).toLocaleString("en-US");
}

export function AdminPlatformTrendsChart({ className }: { className?: string }) {
  const [metric, setMetric] = useState<TrendMetricId>("members");
  const trends = useQuery(api.admin.getAnalyticsTrends);

  const meta = useMemo(
    () => TREND_METRICS.find((m) => m.id === metric)!,
    [metric]
  );

  const chartData = useMemo(
    () =>
      (trends ?? []).map((row) => ({
        label: row.label,
        monthKey: row.monthKey,
        value: row[metric] as number,
      })),
    [trends, metric]
  );

  return (
    <Card
      className={cn(
        "flex flex-col min-h-0 h-full border-border-default bg-surface-card/80",
        className
      )}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between shrink-0 px-4 pt-4 pb-2">
        <div>
          <h2 className="text-sm font-semibold text-text-primary">
            Platform trends
          </h2>
          <p className="text-xs text-text-muted mt-0.5">
            Last 12 months
          </p>
        </div>
        <div className="w-full sm:w-72 shrink-0">
          <Select
            aria-label="Metric"
            options={TREND_METRICS.map((m) => ({
              value: m.id,
              label: m.label,
            }))}
            value={metric}
            onChange={(e) => setMetric(e.target.value as TrendMetricId)}
            className="font-mono text-xs"
          />
        </div>
      </div>
      <div className="flex-1 min-h-[12rem] w-full px-2 pb-2 sm:px-4 sm:pb-4">
        {chartData.length === 0 ? (
          <div className="flex items-center justify-center h-full text-sm text-text-muted">
            Loading trends...
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
            >
              <CartesianGrid
                stroke="var(--color-border-subtle)"
                strokeDasharray="4 4"
                vertical={false}
              />
              <XAxis
                dataKey="label"
                tick={{ fill: "var(--color-text-muted)", fontSize: 11 }}
                tickLine={false}
                axisLine={{ stroke: "var(--color-border-default)" }}
              />
              <YAxis
                tick={{ fill: "var(--color-text-muted)", fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v: number) =>
                  meta.format === "currency"
                    ? `$${v >= 1000 ? `${(v / 1000).toFixed(v % 1000 === 0 ? 0 : 1)}k` : v}`
                    : meta.format === "oneDecimal"
                      ? v.toFixed(1)
                      : `${v}`
                }
                width={44}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--color-surface-elevated)",
                  border: "1px solid var(--color-border-default)",
                  borderRadius: 0,
                  fontSize: "12px",
                }}
                labelStyle={{ color: "var(--color-text-secondary)" }}
                formatter={(value) => {
                  const v =
                    value == null
                      ? 0
                      : typeof value === "number"
                        ? value
                        : Number(value);
                  return [
                    formatTooltipValue(
                      Number.isFinite(v) ? v : 0,
                      meta.format
                    ),
                    meta.label,
                  ];
                }}
                labelFormatter={(label) => {
                  const row = chartData.find((d) => d.label === label);
                  return row?.monthKey ?? String(label);
                }}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="var(--color-brand-500)"
                strokeWidth={2}
                dot={{ r: 3, fill: "var(--color-brand-500)" }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </Card>
  );
}
