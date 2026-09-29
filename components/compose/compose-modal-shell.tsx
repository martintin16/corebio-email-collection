"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { XIcon } from "@/components/icons";
import { ComposeBlockingProvider, useComposeBlocking } from "@/components/compose/compose-blocking-context";
import { pushDialogLayer, popDialogLayer, isTopDialogLayer } from "@/lib/dialog-stack";

interface ComposeModalShellProps {
  children: React.ReactNode;
  title?: string;
}

export function ComposeModalShell({ children, title = "Nuevo mensaje" }: ComposeModalShellProps) {
  return (
    <ComposeBlockingProvider>
      <ComposeModalShellInner title={title}>{children}</ComposeModalShellInner>
    </ComposeBlockingProvider>
  );
}

// Separado del componente de arriba porque necesita LEER el contexto que
// ComposeBlockingProvider recién provee un nivel más arriba — un componente
// no puede consumir el contexto que él mismo declara.
function ComposeModalShellInner({ children, title }: ComposeModalShellProps) {
  const router = useRouter();
  // Mientras ComposeForm está enviando un mensaje con adjuntos (mismo
  // momento en que muestra su LoadingOverlay), este modal no se puede
  // cerrar ni con Escape ni clickeando el backdrop — cerrarlo ahí dejaría
  // ese envío en curso sin ninguna pantalla que lo represente.
  const blocking = useComposeBlocking()?.blocking ?? false;

  function close() {
    if (blocking) return;
    router.back();
  }

  const layerId = useRef<symbol>();
  if (!layerId.current) layerId.current = Symbol("compose-modal-shell");

  // Se anota en la misma pila compartida que Dialog/ConfirmDialog: si hay
  // algo anidado arriba (ej. el diálogo de "¿Reemplazar el contenido
  // actual?" de TemplatePicker, o el menú de programar envío), un Escape
  // tiene que cerrar solo eso — no todo el modal de Redactar de paso.
  useEffect(() => {
    const id = layerId.current!;
    pushDialogLayer(id);
    return () => popDialogLayer(id);
  }, []);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isTopDialogLayer(layerId.current!)) close();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blocking]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 p-4">
      <div className="absolute inset-0" onClick={close} aria-hidden="true" />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="compose-modal-title"
        className="relative w-full max-w-[420px] rounded-lg border border-gray-200 bg-white shadow-lg"
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
          <span id="compose-modal-title" className="text-sm font-medium text-gray-900">
            {title}
          </span>
          <button
            type="button"
            onClick={close}
            disabled={blocking}
            aria-label="Cerrar"
            className="text-gray-400 transition-colors hover:text-gray-600 disabled:opacity-40"
          >
            <XIcon className="h-4 w-4" />
          </button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}
