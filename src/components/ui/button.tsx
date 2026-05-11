"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "outline" | "danger" | "brand";
type ButtonSize = "sm" | "md" | "lg" | "icon";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  // Outlined-cream — matches the landing's CTA aesthetic (transparent bg,
  // cream border, cream text). Hover fills slightly + brightens border.
  primary:
    "bg-transparent text-text-primary border border-text-secondary hover:bg-surface-elevated hover:border-text-primary active:bg-surface-overlay",
  secondary:
    "bg-surface-elevated text-text-primary border border-border-default hover:bg-surface-overlay active:bg-gray-700",
  ghost:
    "text-text-secondary hover:text-text-primary hover:bg-surface-elevated active:bg-surface-overlay",
  outline:
    "border border-border-default text-text-primary hover:bg-surface-elevated active:bg-surface-overlay",
  danger:
    "bg-error/10 text-error border border-error/20 hover:bg-error/20 active:bg-error/30",
  // `brand` is a legacy alias — renders identically to `primary` so the dozens
  // of variant="brand" callsites retreat without touching each one.
  brand:
    "bg-transparent text-text-primary border border-text-secondary hover:bg-surface-elevated hover:border-text-primary active:bg-surface-overlay",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-sm gap-1.5 rounded-lg",
  md: "h-10 px-4 text-sm gap-2 rounded-lg",
  lg: "h-12 px-6 text-base gap-2.5 rounded-xl",
  icon: "h-10 w-10 rounded-lg",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      isLoading,
      leftIcon,
      rightIcon,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          "inline-flex items-center justify-center font-sans font-medium transition-all duration-200",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          "active:scale-[0.97] focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-primary",
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          leftIcon
        )}
        {children}
        {rightIcon}
      </button>
    );
  }
);

Button.displayName = "Button";
