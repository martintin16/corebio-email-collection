"use client";

import { useEffect, useRef } from "react";
import { AlertIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { pushDialogLayer, popDialogLayer, isTopDialogLayer } from "@/lib/dialog-stack";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

// Reservado para acciones irreversibles (eliminar, desconectar). Las
// reversibles (ej. desactivar) no pasan por acá — alcanza con un toast.
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Eliminar",
  isLoading,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const layerId = useRef<symbol>();
  if (!layerId.current) layerId.current = Symbol("confirm-dialog");

  useEffect(() => {
    if (!open) return;
    const id = layerId.current!;
    pushDialogLayer(id);
    return () => popDialogLayer(id);
  }, [open]);

  useEffect(() => {
    if (!open || isLoading) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isTopDialogLayer(layerId.current!)) onCancel();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, isLoading, onCancel]);

  if (!open) return null;

  function handleBackdropClick() {
    // Mismo criterio que Dialog/preventClose: no se abandona a mitad de
    // una acción en curso.
    if (!isLoading) onCancel();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 p-4">
      <div className="absolute inset-0" onClick={handleBackdropClick} aria-hidden="true" />

      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-desc"
        className="relative w-full max-w-[340px] rounded-lg border border-gray-200 bg-white p-5 shadow-lg"
      >
        <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-full bg-danger-bg">
          <AlertIcon className="h-4 w-4 text-danger" />
        </div>
        <p id="confirm-dialog-title" className="mb-1.5 text-sm font-medium text-gray-900">
          {title}
        </p>
        <p id="confirm-dialog-desc" className="mb-5 text-xs leading-relaxed text-gray-500">
          {description}
        </p>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onCancel} disabled={isLoading}>
            Cancelar
          </Button>
          <Button type="button" variant="danger" onClick={onConfirm} isLoading={isLoading}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
