"use client";

import { useEffect, useRef } from "react";
import { XIcon } from "@/components/icons";
import { pushDialogLayer, popDialogLayer, isTopDialogLayer } from "@/lib/dialog-stack";

interface DialogProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  maxWidthClassName?: string;
  // true mientras hay una acción crítica en curso adentro (ver
  // LoadingOverlay): bloquea el cierre por backdrop/Escape/botón X para
  // que no se pueda abandonar el modal a mitad de un envío.
  preventClose?: boolean;
}

/**
 * Shell genérico de modal (backdrop + Escape + panel con header). Usado por
 * los diálogos de acción que no necesitan una URL propia (a diferencia de
 * Compose, que sí — ver compose-modal-shell.tsx). ConfirmDialog se mantiene
 * con su propio markup: ya está en uso y no vale la pena tocarlo solo por
 * DRY en este momento.
 */
export function Dialog({
  open,
  title,
  onClose,
  children,
  maxWidthClassName = "max-w-[360px]",
  preventClose = false,
}: DialogProps) {
  const layerId = useRef<symbol>();
  if (!layerId.current) layerId.current = Symbol("dialog");

  // Se anota en la pila compartida mientras está abierto, para que si hay
  // otro Dialog/ConfirmDialog/modal anidado arriba, Escape solo cierre a
  // ese — ver lib/dialog-stack.ts.
  useEffect(() => {
    if (!open) return;
    const id = layerId.current!;
    pushDialogLayer(id);
    return () => popDialogLayer(id);
  }, [open]);

  useEffect(() => {
    if (!open || preventClose) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isTopDialogLayer(layerId.current!)) onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, preventClose, onClose]);

  if (!open) return null;

  function handleBackdropClick() {
    if (!preventClose) onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 p-4">
      <div className="absolute inset-0" onClick={handleBackdropClick} aria-hidden="true" />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        className={`relative w-full ${maxWidthClassName} rounded-lg border border-gray-200 bg-white shadow-lg`}
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
          <span id="dialog-title" className="text-sm font-medium text-gray-900">
            {title}
          </span>
          <button
            type="button"
            onClick={onClose}
            disabled={preventClose}
            aria-label="Cerrar"
            className="text-gray-400 transition-colors hover:text-gray-600 disabled:opacity-40"
          >
            <XIcon className="h-4 w-4" />
          </button>
        </div>
        <div className="relative p-4">{children}</div>
      </div>
    </div>
  );
}
