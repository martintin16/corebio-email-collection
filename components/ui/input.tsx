import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export type InputProps = InputHTMLAttributes<HTMLInputElement>;

export const Input = forwardRef<HTMLInputElement, InputProps>(
  function Input({ className, ...props }, ref) {
    return (
      <input
        ref={ref}
        className={cn(
          "h-9 w-full rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900",
          "placeholder:text-gray-400 outline-none transition-colors",
          "focus:border-primary-500 focus:ring-2 focus:ring-primary-100",
          "disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400",
          "aria-[invalid=true]:border-danger aria-[invalid=true]:focus:ring-red-100",
          className
        )}
        {...props}
      />
    );
  }
);
