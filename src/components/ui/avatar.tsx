import Image from "next/image";
import { cn, getInitials } from "@/lib/utils";

interface AvatarProps {
  src?: string | null;
  name: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
  className?: string;
}

const sizeStyles = {
  xs: { className: "h-5 w-5 text-[8px]", px: 20 },
  sm: { className: "h-8 w-8 text-xs", px: 32 },
  md: { className: "h-10 w-10 text-sm", px: 40 },
  lg: { className: "h-12 w-12 text-base", px: 48 },
  xl: { className: "h-16 w-16 text-lg", px: 64 },
  "2xl": { className: "h-24 w-24 text-2xl", px: 96 },
} as const;

export function Avatar({ src, name, size = "md", className }: AvatarProps) {
  const { className: sizeClass, px } = sizeStyles[size];

  if (src) {
    return (
      <Image
        src={src}
        alt={name}
        width={px}
        height={px}
        className={cn(
          "rounded-full object-cover border border-border-default",
          sizeClass,
          className
        )}
      />
    );
  }

  return (
    <div
      className={cn(
        "rounded-full flex items-center justify-center font-medium",
        "bg-surface-elevated text-text-secondary border border-border-default",
        sizeClass,
        className
      )}
    >
      {getInitials(name)}
    </div>
  );
}
