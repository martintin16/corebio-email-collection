"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ToolbarButtonProps {
  label: string;
  active?: boolean;
  onClick: () => void;
  children: ReactNode;
}

// Botón chico y cuadrado para la barra de formato — mismo criterio visual
// que los "chips" del mockup del PDF: se resalta con el color primario
// cuando la marca correspondiente está activa donde está el cursor.
export function ToolbarButton({ label, active, onClick, children }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={active}
      title={label}
      onClick={onClick}
      className={cn(
        "flex h-7 w-7 shrink-0 items-center justify-center rounded-md border transition-colors",
        active
          ? "border-primary-700 bg-primary-100 text-primary-700"
          : "border-transparent text-gray-500 hover:bg-gray-100 hover:text-gray-700"
      )}
    >
      {children}
    </button>
  );
}
