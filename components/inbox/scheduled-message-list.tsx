"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ActionsMenu, ActionsMenuItem } from "@/components/ui/actions-menu";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { ClockIcon, EditIcon, TrashIcon } from "@/components/icons";
import { useToast } from "@/components/ui/toast/toast-context";
import { cancelScheduledMessage } from "@/lib/actions/schedule";
import { formatScheduledAt } from "@/lib/schedule-options";
import type { ScheduledMessage } from "@/lib/types/scheduled-message";

interface ScheduledMessageListProps {
  mailboxId: string;
  initialItems: ScheduledMessage[];
}

export function ScheduledMessageList({ initialItems }: ScheduledMessageListProps) {
  const router = useRouter();
  const { showToast } = useToast();
  // Copia local: cancelar saca la fila acá mismo (optimista) en vez de
  // depender de que el mock de lib/actions/schedule.ts persista algo — no
  // persiste nada, igual que el resto de las acciones simuladas del proyecto.
  const [items, setItems] = useState(initialItems);
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
      await cancelScheduledMessage(cancelTarget.id);
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
                <span className="truncate text-sm font-medium text-gray-900">{item.to}</span>
              </div>
              <p className="truncate text-xs font-medium text-gray-700">{item.subject}</p>
              <p className="truncate text-xs text-gray-400">{item.bodyPreview}</p>
              <p className="mt-0.5 flex items-center gap-1 text-[11px] text-primary-700">
                <ClockIcon className="h-3 w-3 shrink-0" />
                Se envía {formatScheduledAt(new Date(item.scheduledAt))}
              </p>
            </div>
            <ActionsMenu label={`Acciones para el envío a ${item.to}`}>
              <ActionsMenuItem icon={EditIcon} onClick={() => router.push(`/compose?edit=${item.id}`)}>
                Editar
              </ActionsMenuItem>
              <ActionsMenuItem icon={TrashIcon} danger onClick={() => setCancelTarget(item)}>
                Cancelar envío
              </ActionsMenuItem>
            </ActionsMenu>
          </li>
        ))}
      </ul>

      <ConfirmDialog
        open={cancelTarget !== null}
        title="¿Cancelar este envío?"
        description={
          cancelTarget
            ? `"${cancelTarget.subject}" para ${cancelTarget.to} no se va a mandar.`
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
