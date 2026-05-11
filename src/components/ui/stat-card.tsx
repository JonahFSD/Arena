import { cn } from "@/lib/utils";
import { Card } from "./card";
import { TrendingUp, TrendingDown } from "lucide-react";

interface StatCardProps {
  label: string;
  /** Same row as label, right-aligned (e.g. month-over-month %). */
  labelTrailing?: string;
  /** When set with `labelTrailing`, tints the trailing text (positive = brand gold; negative, neutral, or omitted = muted grey). */
  labelTrailingTone?: "positive" | "negative" | "neutral";
  value: string | number;
  change?: number;
  changeLabel?: string;
  /** "percent" appends %; "delta" shows a hard count (use deltaPrefix/deltaSuffix for units). */
  changeFormat?: "percent" | "delta";
  deltaPrefix?: string;
  deltaSuffix?: string;
  icon?: React.ReactNode;
  className?: string;
  /** Omit background glow decoration (e.g. flush dashboard tiles). */
  plain?: boolean;
}

function formatDelta(
  change: number,
  deltaPrefix = "",
  deltaSuffix = ""
): string {
  if (change > 0) {
    return `+${deltaPrefix}${change}${deltaSuffix}`;
  }
  if (change < 0) {
    return `-${deltaPrefix}${Math.abs(change)}${deltaSuffix}`;
  }
  return `0${deltaSuffix}`;
}

export function StatCard({
  label,
  labelTrailing,
  labelTrailingTone,
  value,
  change,
  changeLabel,
  changeFormat = "percent",
  deltaPrefix = "",
  deltaSuffix = "",
  icon,
  className,
  plain = false,
}: StatCardProps) {
  const isPositive = change !== undefined && change > 0;
  const isNeutral = change !== undefined && change === 0;

  const changeText =
    change !== undefined && changeFormat === "delta"
      ? formatDelta(change, deltaPrefix, deltaSuffix)
      : change !== undefined
        ? `${isPositive ? "+" : ""}${change}%`
        : "";

  return (
    <Card className={cn("relative overflow-hidden", className)}>
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2 min-w-0">
            <p className="text-sm text-text-secondary">{label}</p>
            {labelTrailing != null && labelTrailing !== "" && (
              <p
                className={cn(
                  "text-sm shrink-0 tabular-nums",
                  labelTrailingTone === "positive"
                    ? "text-brand-500"
                    : "text-text-muted"
                )}
              >
                {labelTrailing}
              </p>
            )}
          </div>
          <p className="mt-2 text-3xl font-bold text-brand-500 tracking-tight">
            {value}
          </p>
          {change !== undefined && (
            <div className="flex items-center gap-1 mt-2 flex-wrap">
              {!isNeutral ? (
                isPositive ? (
                  <TrendingUp className="h-3.5 w-3.5 text-success" />
                ) : (
                  <TrendingDown className="h-3.5 w-3.5 text-error" />
                )
              ) : null}
              <span
                className={cn(
                  "text-xs font-medium",
                  isNeutral
                    ? "text-text-muted"
                    : isPositive
                      ? "text-success"
                      : "text-error"
                )}
              >
                {changeText}
              </span>
              {changeLabel && (
                <span className="text-xs text-text-muted">{changeLabel}</span>
              )}
            </div>
          )}
        </div>
        {icon && (
          <div
            className={cn(
              "p-2.5 rounded-xl text-brand-500",
              !plain && "bg-brand-500/10"
            )}
          >
            {icon}
          </div>
        )}
      </div>
      {!plain && (
        <div className="absolute -bottom-8 -right-8 w-24 h-24 rounded-full bg-brand-500/5 blur-2xl" />
      )}
    </Card>
  );
}
