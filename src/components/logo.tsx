import { cn } from "@/lib/utils";

/**
 * 021 wordmark / mark.
 *
 * Treatment notes:
 * - Inter Light, loose tracking. Lower-case-feeling restraint.
 * - Leading 0 is rendered at ~115% the size of the trailing "21" so it reads
 *   as the load-bearing element. The 0 is also the standalone mark — when
 *   collapsed (mark variant), only the 0 renders.
 * - Color inherits via `currentColor` so the parent decides cream / brand /
 *   muted depending on context.
 * - `aria-label="021"` so screen readers don't read the digits one by one.
 */
type LogoProps = {
  variant?: "wordmark" | "mark";
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
};

const SIZE_CLASS: Record<NonNullable<LogoProps["size"]>, string> = {
  xs: "text-sm",
  sm: "text-base",
  md: "text-lg",
  lg: "text-2xl",
  xl: "text-4xl",
};

export function Logo({
  variant = "wordmark",
  size = "md",
  className,
}: LogoProps) {
  return (
    <span
      role="img"
      aria-label="021"
      className={cn(
        "inline-flex items-baseline font-light leading-none select-none tracking-[0.04em]",
        SIZE_CLASS[size],
        className,
      )}
    >
      <span className="text-[1.15em] leading-none">0</span>
      {variant === "wordmark" && <span className="leading-none">21</span>}
    </span>
  );
}
