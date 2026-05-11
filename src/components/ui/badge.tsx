import { cn } from "@/lib/utils";

type BadgeVariant = "default" | "brand" | "success" | "warning" | "error" | "outline";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

// HF0 doesn't pill anything — status indicators are tiny tracked uppercase text,
// no chrome. Variants now adjust color only; the API is preserved so callers
// don't break.
const variantStyles: Record<BadgeVariant, string> = {
  default: "text-text-tertiary",
  brand: "text-text-secondary",
  success: "text-text-tertiary",
  warning: "text-text-secondary",
  error: "text-error/80",
  outline: "text-text-tertiary",
};

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center text-[10px] font-sans font-medium uppercase tracking-[0.08em]",
        variantStyles[variant],
        className
      )}
      {...props}
    />
  );
}
