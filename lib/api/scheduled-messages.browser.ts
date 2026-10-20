import { downloadFile, sendForm, toFormData } from "./http.browser";
import type { ActionResult } from "./errors";
import type { ForwardedAttachmentRef, Recipients } from "./messages.browser";
import type { ScheduledMessage } from "@/lib/types/scheduled-message";

/**
 * Programar y editar envíos: van directo del navegador al backend porque
 * pueden llevar adjuntos (ver http.browser.ts). Para componentes "use client".
 */

export interface ScheduleMessageInput extends Partial<Recipients> {
  mailboxId: string;
  subject?: string;
  body: string;
  // ISO 8601, en UTC — entre 1 minuto y 1 año desde ahora.
  scheduledAt: string;
  // Respuesta programada: destinatario y asunto salen del original.
  replyToMessageId?: string;
  forwardedAttachments?: ForwardedAttachmentRef[];
}

export function scheduleMessage(
  input: ScheduleMessageInput,
  files: File[] = []
): Promise<ActionResult<ScheduledMessage>> {
  return sendForm("POST", "/scheduled-messages", toFormData({ ...input }, files));
}

export interface UpdateScheduledMessageInput extends Partial<Recipients> {
  subject?: string;
  body?: string;
  scheduledAt?: string;
  // Ids de los adjuntos que ya tenía y se conservan (omitido = todos; [] = ninguno).
  keepAttachmentIds?: string[];
  forwardedAttachments?: ForwardedAttachmentRef[];
}

/** Solo si todavía no salió; uno que falló vuelve a quedar pendiente. */
export function updateScheduledMessage(
  id: string,
  input: UpdateScheduledMessageInput,
  files: File[] = []
): Promise<ActionResult<ScheduledMessage>> {
  return sendForm(
    "PATCH",
    `/scheduled-messages/${encodeURIComponent(id)}`,
    toFormData({ ...input }, files)
  );
}

export function downloadScheduledAttachment(
  id: string,
  attachmentId: string
): Promise<ActionResult> {
  return downloadFile(
    `/scheduled-messages/${encodeURIComponent(id)}/attachments/${encodeURIComponent(attachmentId)}`
  );
}
