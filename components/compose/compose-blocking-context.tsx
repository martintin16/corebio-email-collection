"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

interface ComposeBlockingContextValue {
  blocking: boolean;
  setBlocking: (value: boolean) => void;
  /** ComposeForm avisa si hay algo escrito o adjuntado sin enviar. */
  setDirty: (value: boolean) => void;
  /** Cerrar el modal (X, Escape, fondo, Cancelar): si hay algo sin enviar, pregunta antes. */
  requestClose: () => void;
}

const ComposeBlockingContext = createContext<ComposeBlockingContextValue | null>(null);

// Le permite a ComposeForm avisarle a su contenedor (ComposeModalShell,
// cuando mode="modal"):
// - que hay un envío con adjuntos en curso (el mismo momento en que se
//   muestra el LoadingOverlay bloqueante), para que Escape o un click en el
//   fondo no cierren el modal y dejen ese envío colgado sin ninguna UI;
// - que hay algo escrito sin enviar, para preguntar antes de descartarlo
//   (igual que el editor de plantillas).
// En mode="page" no hay Provider (no hay modal que cerrar), así que el hook
// devuelve null y ComposeForm no llama a nada.
export function ComposeBlockingProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [blocking, setBlocking] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const requestClose = useCallback(() => {
    if (blocking) return;
    if (dirty) setConfirmOpen(true);
    else router.back();
  }, [blocking, dirty, router]);

  return (
    <ComposeBlockingContext.Provider value={{ blocking, setBlocking, setDirty, requestClose }}>
      {children}
      <ConfirmDialog
        open={confirmOpen}
        title="¿Descartar el mensaje?"
        description="Lo que escribiste no se envió y se va a perder."
        confirmLabel="Descartar"
        onConfirm={() => {
          setConfirmOpen(false);
          router.back();
        }}
        onCancel={() => setConfirmOpen(false)}
      />
    </ComposeBlockingContext.Provider>
  );
}

export function useComposeBlocking() {
  return useContext(ComposeBlockingContext);
}
