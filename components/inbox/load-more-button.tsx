"use client";

import { Button } from "@/components/ui/button";

/** Al final de Recibidos y Enviados: trae los 25 siguientes. */
export function LoadMoreButton({
  loading,
  error,
  onClick,
}: {
  loading: boolean;
  error: string | null;
  onClick: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-1.5 px-4 py-3">
      {error && (
        <p role="alert" className="text-center text-[11px] text-danger">
          {error}
        </p>
      )}
      <Button type="button" variant="secondary" isLoading={loading} onClick={onClick} className="w-full justify-center">
        {loading ? "Cargando…" : "Cargar más"}
      </Button>
    </div>
  );
}
