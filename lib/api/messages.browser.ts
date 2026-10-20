import { downloadFile, sendForm, toFormData } from "./http.browser";
import type { ActionResult } from "./errors";
import type { SentMessageSummary } from "@/lib/types/mail";

/**
 * Lo de mensajes que va directo del navegador al backend porque mueve archivos
 * (ver http.browser.ts). Para usar desde componentes "use client".
 */

const box = (mailboxId: string) => `/mailboxes/${encodeURIComponent(mailboxId)}`;

/** Cada campo: emails separados por coma ("" si no hay). Al menos uno entre los tres. */
export interface Recipients {
  to: string;
  cc: string;
  bcc: string;
}

/** Un adjunto de otro mensaje de la misma casilla, para reenviarlo sin volver a subirlo. */
export interface ForwardedAttachmentRef {
  messageId: string;
  attachmentId: string;
}

export interface SendMessageInput extends Recipients {
  mailboxId: string;
  subject: string;
  body: string;
  forwardedAttachments?: ForwardedAttachmentRef[];
}

/**
 * Redactar. Errores con `code` a tener en cuenta: RECIPIENT_LIMIT_EXCEEDED
 * (cupo diario; el mensaje ya dice cuántos quedan) y mailbox_needs_reconnect.
 */
export function sendMessage(
  input: SendMessageInput,
  files: File[] = []
): Promise<ActionResult<SentMessageSummary>> {
  return sendForm("POST", `${box(input.mailboxId)}/messages`, toFormData({ ...input }, files));
}

/** Responder en el mismo hilo (al remitente del original, con "Re:"). */
export function replyToMessage(
  mailboxId: string,
  messageId: string,
  body: string,
  files: File[] = []
): Promise<ActionResult<SentMessageSummary>> {
  return sendForm(
    "POST",
    `${box(mailboxId)}/messages/${encodeURIComponent(messageId)}/reply`,
    toFormData({ body }, files)
  );
}

/** Baja un adjunto de un recibido o enviado y lo guarda con su nombre. */
export function downloadMessageAttachment(
  mailboxId: string,
  messageId: string,
  attachmentId: string
): Promise<ActionResult> {
  return downloadFile(
    `${box(mailboxId)}/messages/${encodeURIComponent(messageId)}` +
      `/attachments/${encodeURIComponent(attachmentId)}`
  );
}
