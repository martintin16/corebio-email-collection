"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AlertIcon } from "@/components/icons";

/**
 * Error en cualquier pantalla del panel (Admin, Plantillas, Redactar…) que no
 * tenga uno propio. Sin esto, Next mostraba su pantalla genérica en inglés
 * ("Application error") y no había cómo volver. El menú de la izquierda
 * sigue a la vista (este archivo vive dentro del layout del panel).
 */
export default function DashboardError({
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
      <AlertIcon className="h-6 w-6 text-gray-400" />
      <p className="text-sm font-medium text-gray-900">Algo salió mal</p>
      <p className="max-w-[300px] text-xs text-gray-500">
        Puede ser un problema temporal de conexión con el servidor. Probá de nuevo en unos segundos.
      </p>
      <div className="flex gap-2">
        <Button variant="secondary" onClick={reset}>
          Reintentar
        </Button>
        <Link
          href="/inbox"
          className="inline-flex h-9 items-center rounded-md px-3 text-sm font-medium text-primary-700 hover:underline"
        >
          Volver a la bandeja
        </Link>
      </div>
    </div>
  );
}
