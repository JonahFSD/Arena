"use client";

import { useMemo, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Select } from "@/components/ui/select";
import {
  DASHBOARD_TREND_METRICS,
  DASHBOARD_TRENDS_SERIES,
  type DashboardTrendMetricId,
  getDashboardTrendValue,
} from "@/lib/dashboard-trends-data";
import { cn } from "@/lib/utils";

function formatTooltipValue(
  value: number,
  format: (typeof DASHBOARD_TREND_METRICS)[number]["format"]
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
  if (format === "rank") {
    return `#${Math.round(value)}`;
  }
  return Math.round(value).toLocaleString("en-US");
}

export function DashboardTrendsChart({ className }: { className?: string }) {
  const [metric, setMetric] = useState<DashboardTrendMetricId>("pointsEarned");

  const meta = useMemo(
    () => DASHBOARD_TREND_METRICS.find((m) => m.id === metric)!,
    [metric]
  );

  const chartData = useMemo(
    () =>
      DASHBOARD_TRENDS_SERIES.map((row) => ({
        label: row.label,
        monthKey: row.monthKey,
        value: getDashboardTrendValue(row, metric),
      })),
    [metric]
  );

  return (
    <div
      className={cn(
        "flex w-full min-w-0 flex-col bg-transparent",
        className
      )}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between shrink-0 pb-4">
        <div>
          <h2 className="text-sm font-semibold text-text-primary">
            Your trends
          </h2>
          <p className="text-xs text-text-muted mt-0.5">
            Last 12 months (sample data)
          </p>
        </div>
        <div className="w-full sm:w-72 shrink-0">
          <Select
            aria-label="Metric"
            options={DASHBOARD_TREND_METRICS.map((m) => ({
              value: m.id,
              label: m.label,
            }))}
            value={metric}
            onChange={(e) =>
              setMetric(e.target.value as DashboardTrendMetricId)
            }
            className="font-mono text-xs"
          />
        </div>
      </div>
      <div className="relative h-72 w-full min-w-0">
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
              reversed={meta.format === "rank"}
              tickFormatter={(v: number) =>
                meta.format === "currency"
                  ? `$${v >= 1000 ? `${(v / 1000).toFixed(v % 1000 === 0 ? 0 : 1)}k` : v}`
                  : meta.format === "oneDecimal"
                    ? v.toFixed(1)
                    : meta.format === "rank"
                      ? `#${v}`
                      : `${v}`
              }
              width={meta.format === "rank" ? 36 : 44}
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
      </div>
    </div>
  );
}
