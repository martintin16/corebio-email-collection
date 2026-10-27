"use server";

import * as http from "./http.server";
import type { MailboxSyncState } from "@/lib/types/sync";

/**
 * Estado de sincronización de una casilla (módulo `sync` del backend). Lo
 * consulta la bandeja cada minuto para enterarse de mails nuevos sin
 * recargar. null si no se pudo consultar (se reintenta en la próxima vuelta).
 */
export async function getSyncState(mailboxId: string): Promise<MailboxSyncState | null> {
  return http.getOrNull(`/mailboxes/${encodeURIComponent(mailboxId)}/sync-state`);
}
