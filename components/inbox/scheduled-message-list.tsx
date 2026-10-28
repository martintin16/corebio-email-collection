"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ActionsMenu, ActionsMenuItem } from "@/components/ui/actions-menu";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { ClockIcon, EditIcon, TrashIcon } from "@/components/icons";
import { useToast } from "@/components/ui/toast/toast-context";
import { cancelScheduledMessage } from "@/lib/api/scheduled-messages";
import { formatScheduledAt } from "@/lib/schedule-options";
import { AttachmentList } from "@/components/inbox/attachment-list";
import type { ScheduledMessage } from "@/lib/types/scheduled-message";

interface ScheduledMessageListProps {
  mailboxId: string;
  initialItems: ScheduledMessage[];
}

/** "Para" de la fila: los de to, o si todo va en copia, cuántos son. */
function recipientsLabel(item: ScheduledMessage): string {
  if (item.to) return item.to;
  const copies = [item.cc, item.bcc].filter(Boolean).join(", ").split(",").filter((e) => e.trim());
  return copies.length === 1 ? copies[0]!.trim() : `${copies.length} destinatarios en copia`;
}

export function ScheduledMessageList({ initialItems }: ScheduledMessageListProps) {
  const router = useRouter();
  const { showToast } = useToast();
  // Copia local: cancelar saca la fila acá mismo, sin esperar a recargar la lista.
  const [items, setItems] = useState(initialItems);
  // Al recargar la página (router.refresh tras programar o editar) llega la lista nueva.
  useEffect(() => setItems(initialItems), [initialItems]);
  const [cancelTarget, setCancelTarget] = useState<ScheduledMessage | null>(null);
  const [cancelling, setCancelling] = useState(false);

  if (items.length === 0) {
    return (
      <EmptyState
        icon={ClockIcon}
        title="No hay envíos programados"
        description="Los mensajes que programes desde Redactar o Responder van a aparecer acá."
      />
    );
  }

  async function confirmCancel() {
    if (!cancelTarget) return;
    setCancelling(true);
    try {
      const result = await cancelScheduledMessage(cancelTarget.id);
      if (!result.ok) {
        // Ej. 409: ya se está enviando.
        showToast("error", result.error.message);
        return;
      }
      setItems((prev) => prev.filter((m) => m.id !== cancelTarget.id));
      showToast("success", "Envío cancelado.");
      setCancelTarget(null);
    } catch {
      showToast("error", "No pudimos cancelar el envío. Intentá de nuevo.");
    } finally {
      setCancelling(false);
    }
  }

  return (
    <>
      <ul aria-label="Envíos programados" className="divide-y divide-gray-200">
        {items.map((item) => (
          <li key={item.id} className="flex items-start gap-2 px-4 py-2.5">
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-2">
                <span className="truncate text-sm font-medium text-gray-900">
                  {recipientsLabel(item)}
                </span>
              </div>
              <p className="truncate text-xs font-medium text-gray-700">{item.subject}</p>
              <p className="truncate text-xs text-gray-400">{item.bodyPreview}</p>
              <AttachmentList
                source={{ kind: "scheduled", scheduledId: item.id }}
                attachments={item.attachments}
                compact
              />
              {item.status === "failed" ? (
                <p className="mt-0.5 text-[11px] text-danger">
                  No se envió: {item.lastError ?? "error desconocido"}
                </p>
              ) : item.status === "sending" ? (
                <p className="mt-0.5 flex items-center gap-1 text-[11px] text-primary-700">
                  <ClockIcon className="h-3 w-3 shrink-0" />
                  Enviándose…
                </p>
              ) : (
                <p className="mt-0.5 flex items-center gap-1 text-[11px] text-primary-700">
                  <ClockIcon className="h-3 w-3 shrink-0" />
                  Se envía {formatScheduledAt(new Date(item.scheduledAt))}
                </p>
              )}
            </div>
            {item.status !== "sending" && (
              <ActionsMenu label={`Acciones para el envío a ${recipientsLabel(item)}`}>
                <ActionsMenuItem icon={EditIcon} onClick={() => router.push(`/compose?edit=${item.id}`)}>
                  Editar
                </ActionsMenuItem>
                <ActionsMenuItem icon={TrashIcon} danger onClick={() => setCancelTarget(item)}>
                  Cancelar envío
                </ActionsMenuItem>
              </ActionsMenu>
            )}
          </li>
        ))}
      </ul>

      <ConfirmDialog
        open={cancelTarget !== null}
        title="¿Cancelar este envío?"
        description={
          cancelTarget
            ? `"${cancelTarget.subject}" para ${recipientsLabel(cancelTarget)} no se va a mandar.`
            : ""
        }
        confirmLabel="Cancelar envío"
        isLoading={cancelling}
        onConfirm={confirmCancel}
        onCancel={() => setCancelTarget(null)}
      />
    </>
  );
}
