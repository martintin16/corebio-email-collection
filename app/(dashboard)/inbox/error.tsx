"use client";

import { useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
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

  // reset() solo redibuja en el navegador: el error vino de pedir datos en el
  // servidor, así que primero hay que volver a pedirlos (router.refresh()).
  const router = useRouter();
  const [retrying, startTransition] = useTransition();
  function retry() {
    startTransition(() => {
      router.refresh();
      reset();
    });
  }

  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
      <p className="text-sm font-medium text-gray-900">No pudimos cargar la bandeja</p>
      <p className="max-w-[280px] text-xs text-gray-500">
        Puede ser un problema temporal de conexión. Probá de nuevo.
      </p>
      <Button variant="secondary" onClick={retry} isLoading={retrying}>
        Reintentar
      </Button>
    </div>
  );
}
