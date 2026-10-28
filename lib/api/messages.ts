"use server";

import * as http from "./http.server";
import { ApiError, type ActionResult } from "./errors";
import type {
  MessageDetail,
  MessagePage,
  MessageSummary,
  SentMessageDetail,
  SentMessageSummary,
} from "@/lib/types/mail";
import type { MailLabel } from "@/lib/types/label";

/**
 * Recibidos, Enviados y etiquetas de una casilla (módulo `messages` del backend).
 * Enviar y responder van en messages.browser.ts (pueden llevar adjuntos).
 */

const box = (mailboxId: string) => `/mailboxes/${encodeURIComponent(mailboxId)}`;

/** null si no existe o no se puede ver (404 / 403): para el `notFound()` de la page. */
async function orNull<T>(load: () => Promise<T>): Promise<T | null> {
  try {
    return await load();
  } catch (err) {
    if (err instanceof ApiError && (err.status === 404 || err.status === 403)) return null;
    throw err;
  }
}

// --- Recibidos ----------------------------------------------------------------

/** `?pageToken=` opcional (la página siguiente). */
const page = (pageToken?: string) =>
  pageToken ? `?pageToken=${encodeURIComponent(pageToken)}` : "";

/** La primera página de Recibidos (la pide el layout de la casilla). */
export async function getMessages(mailboxId: string): Promise<MessagePage<MessageSummary>> {
  return http.get(`${box(mailboxId)}/messages`);
}

/** "Cargar más" en Recibidos: la página siguiente. */
export async function loadMoreMessages(
  mailboxId: string,
  pageToken: string
): Promise<ActionResult<MessagePage<MessageSummary>>> {
  return http.action(() => http.get(`${box(mailboxId)}/messages${page(pageToken)}`));
}

/** Abrirlo lo marca como leído (como en Gmail). */
export async function getMessage(
  mailboxId: string,
  messageId: string
): Promise<MessageDetail | null> {
  return orNull(() =>
    http.get<MessageDetail>(`${box(mailboxId)}/messages/${encodeURIComponent(messageId)}`)
  );
}

// --- Enviados -----------------------------------------------------------------

/** La primera página de Enviados. */
export async function getSentMessages(mailboxId: string): Promise<MessagePage<SentMessageSummary>> {
  return http.get(`${box(mailboxId)}/sent`);
}

/** "Cargar más" en Enviados. */
export async function loadMoreSent(
  mailboxId: string,
  pageToken: string
): Promise<ActionResult<MessagePage<SentMessageSummary>>> {
  return http.action(() => http.get(`${box(mailboxId)}/sent${page(pageToken)}`));
}

export async function getSentMessage(
  mailboxId: string,
  sentId: string
): Promise<SentMessageDetail | null> {
  return orNull(() =>
    http.get<SentMessageDetail>(`${box(mailboxId)}/sent/${encodeURIComponent(sentId)}`)
  );
}

/** Para "Reenviar": Redactar recibe el id sin saber en qué casilla está. */
export async function getSentMessageById(sentId: string): Promise<SentMessageDetail | null> {
  return orNull(() => http.get<SentMessageDetail>(`/sent/${encodeURIComponent(sentId)}`));
}

// --- Etiquetas ----------------------------------------------------------------

/** Las etiquetas creadas en Gmail para la casilla (no las de sistema), por nombre. */
export async function getLabelsForMailbox(mailboxId: string): Promise<MailLabel[]> {
  return http.get(`${box(mailboxId)}/labels`);
}

export interface UpdateMessageLabelsInput {
  mailboxId: string;
  messageId: string;
  // Ids de etiqueta (MailLabel.id) a agregar / sacar de la conversación.
  add: string[];
  remove: string[];
}

/** Gmail las aplica a la conversación entera: las respuestas nuevas del hilo las heredan. */
export async function updateMessageLabels(
  input: UpdateMessageLabelsInput
): Promise<ActionResult<{ labelIds: string[] }>> {
  return http.action(() =>
    http.patch<{ labelIds: string[] }>(
      `${box(input.mailboxId)}/messages/${encodeURIComponent(input.messageId)}/labels`,
      { add: input.add, remove: input.remove }
    )
  );
}
