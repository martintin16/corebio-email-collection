"use client";

import { useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { LoadingOverlay } from "@/components/ui/loading-overlay";
import { useToast } from "@/components/ui/toast/toast-context";
import { reconnectMailbox } from "@/lib/api/mailboxes";
import type { AdminMailbox } from "@/lib/types/admin";

interface ReconnectMailboxDialogProps {
  open: boolean;
  onClose: () => void;
  mailbox: AdminMailbox;
}

// No es un form: ya sabemos la dirección, lo único que falta es que el
// dueño de la casilla vuelva a autorizar el acceso en Google (el permiso
// anterior venció o se revocó). Mismo overlay bloqueante que
// ConnectMailboxDialog, mismo motivo: hay una espera real de por medio.
export function ReconnectMailboxDialog({ open, onClose, mailbox }: ReconnectMailboxDialogProps) {
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  function handleClose() {
    if (isLoading) return;
    setFormError(null);
    onClose();
  }

  async function handleReconnect() {
    setFormError(null);
    setIsLoading(true);
    // El navegador va a Google para que la cuenta de la casilla vuelva a
    // autorizar el acceso; Google vuelve a /admin/mailboxes con el resultado.
    const result = await reconnectMailbox(mailbox.id);
    if (!result.ok) {
      setIsLoading(false);
      setFormError(result.error.message);
      return;
    }
    showToast("success", "Te llevamos a Google para autorizar la casilla…");
    window.location.assign(result.data.authUrl);
  }

  return (
    <Dialog
      open={open}
      title="Reconectar casilla"
      onClose={handleClose}
      preventClose={isLoading}
      maxWidthClassName="max-w-[360px]"
    >
      <LoadingOverlay active={isLoading} label="Conectando con Google…" />

      {formError && (
        <div
          role="alert"
          className="mb-3.5 rounded-md border border-red-200 bg-danger-bg px-3 py-2 text-xs text-danger-text"
        >
          {formError}
        </div>
      )}

      <p className="mb-1 text-sm font-medium text-gray-800">{mailbox.email}</p>
      <p className="mb-5 text-xs leading-relaxed text-gray-500">
        El permiso de acceso a esta casilla venció o fue revocado. La persona dueña va a tener que
        autorizarlo de nuevo desde Google para que vuelva a funcionar.
      </p>

      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={handleClose} disabled={isLoading}>
          Cancelar
        </Button>
        <Button onClick={handleReconnect} isLoading={isLoading}>
          Continuar con Google
        </Button>
      </div>
    </Dialog>
  );
}
