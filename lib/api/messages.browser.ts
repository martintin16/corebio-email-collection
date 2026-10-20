import { downloadFile } from "./http.browser";
import type { ActionResult } from "./errors";

/**
 * Lo de mensajes que va directo del navegador al backend porque mueve archivos
 * (ver http.browser.ts). Para usar desde componentes "use client".
 */

/** Baja un adjunto de un recibido o enviado y lo guarda con su nombre. */
export function downloadMessageAttachment(
  mailboxId: string,
  messageId: string,
  attachmentId: string,
): Promise<ActionResult> {
  return downloadFile(
    `/mailboxes/${encodeURIComponent(mailboxId)}/messages/${encodeURIComponent(messageId)}` +
      `/attachments/${encodeURIComponent(attachmentId)}`,
  );
}
