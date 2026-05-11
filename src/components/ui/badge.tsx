import { cn } from "@/lib/utils";

type BadgeVariant = "default" | "brand" | "success" | "warning" | "error" | "outline";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: "bg-surface-elevated text-text-secondary border-border-default",
  brand: "bg-brand-500/10 text-brand-500 border-brand-500/20",
  success: "bg-success/10 text-success border-success/20",
  warning: "bg-warning/10 text-warning border-warning/20",
  error: "bg-error/10 text-error border-error/20",
  outline: "bg-transparent text-text-secondary border-border-strong",
};

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-sans font-medium uppercase tracking-wide border",
        variantStyles[variant],
        className
      )}
      {...props}
    />
  );
}
