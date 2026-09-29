import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  isLoading?: boolean;
}

const variantClasses: Record<Variant, string> = {
  primary: "bg-primary-700 text-white hover:bg-primary-600 disabled:bg-primary-300",
  secondary:
    "bg-white text-gray-800 border border-gray-300 hover:bg-gray-50 disabled:text-gray-400",
  ghost: "bg-transparent text-gray-600 hover:bg-gray-50 disabled:text-gray-300",
  danger: "bg-danger text-white hover:bg-red-700 disabled:bg-red-300",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    { className, variant = "primary", isLoading, disabled, children, ...props },
    ref
  ) {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        aria-busy={isLoading || undefined}
        className={cn(
          "inline-flex h-9 items-center justify-center gap-1.5 rounded-md px-4",
          "text-sm font-medium transition-colors disabled:cursor-not-allowed",
          variantClasses[variant],
          className
        )}
        {...props}
      >
        {isLoading ? (
          <span
            aria-hidden="true"
            className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white"
          />
        ) : (
          children
        )}
      </button>
    );
  }
);
