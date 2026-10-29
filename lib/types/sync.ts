/**
 * "Huella" de una casilla (GET /mailboxes/:id/sync-state). No se interpretan
 * los valores: si alguno cambió, hay novedades y se vuelven a pedir las listas.
 */
export interface MailboxSyncState {
  /** De Gmail: cambia con cualquier novedad (mail nuevo, enviado, leído, etiquetado). */
  historyId: string;
  /** Cambia al crear, editar, cancelar, enviar o fallar un programado. */
  scheduledVersion: string;
  /** No leídos de Recibidos: "(3) Corebio Mail" en la pestaña. */
  inboxUnread: number;
}
