import type { ComponentProps } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/** Information callout — dashed border + surface, aligned with vacant state ambassador cards (hover). */
export function InfoCallout({
  className,
  ...props
}: ComponentProps<typeof Card>) {
  return (
    <Card
      className={cn(
        "border-dashed bg-surface-elevated/50 border-brand-500/30",
        className
      )}
      {...props}
    />
  );
}
