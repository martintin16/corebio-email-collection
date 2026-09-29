"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function InboxError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
      <p className="text-sm font-medium text-gray-900">No pudimos cargar la bandeja</p>
      <p className="max-w-[280px] text-xs text-gray-500">
        Puede ser un problema temporal de conexión. Probá de nuevo.
      </p>
      <Button variant="secondary" onClick={reset}>
        Reintentar
      </Button>
    </div>
  );
}
