import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Tone = "primary" | "neutral" | "success" | "warning" | "danger";

const toneClasses: Record<Tone, string> = {
  primary: "bg-primary-100 text-primary-700",
  neutral: "bg-gray-100 text-gray-700",
  success: "bg-success-bg text-success",
  warning: "bg-warning-bg text-warning",
  danger: "bg-danger-bg text-danger-text",
};

export function Badge({ tone = "neutral", children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium",
        toneClasses[tone]
      )}
    >
      {children}
    </span>
  );
}
