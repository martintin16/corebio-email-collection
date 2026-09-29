"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { CheckIcon, XIcon } from "@/components/icons";
import { cn } from "@/lib/utils";

interface ToastItem {
  id: number;
  type: "success" | "error";
  message: string;
}

interface ToastContextValue {
  showToast: (type: ToastItem["type"], message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast() tiene que usarse dentro de <ToastProvider>");
  }
  return ctx;
}

let nextId = 1;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = useCallback((type: ToastItem["type"], message: string) => {
    const id = nextId++;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      <div className="fixed bottom-4 right-4 z-[60] flex flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="status"
            className={cn(
              "flex items-center gap-2.5 rounded-md border border-l-[3px] border-gray-200 bg-white px-3.5 py-2.5 text-sm shadow-md",
              toast.type === "success" ? "border-l-success" : "border-l-danger"
            )}
          >
            {toast.type === "success" ? (
              <CheckIcon className="h-4 w-4 shrink-0 text-success" />
            ) : (
              <XIcon className="h-4 w-4 shrink-0 text-danger" />
            )}
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
