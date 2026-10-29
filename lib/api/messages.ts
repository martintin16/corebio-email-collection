"use server";

import * as http from "./http.server";
import { ApiError, type ActionResult } from "./errors";
import type {
  MessageDetail,
  MessagePage,
  MessageSummary,
  SentMessageDetail,
  SentMessageSummary,
  ThreadMessage,
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

/** Búsqueda y filtro de una lista; `pageToken` pide la página siguiente. */
export interface ListParams {
  q?: string;
  labelId?: string;
  pageToken?: string;
}

/** "?q=…&labelId=…&pageToken=…" con lo que venga (vacío si no hay nada). */
function queryString(params: ListParams): string {
  const search = new URLSearchParams();
  if (params.q) search.set("q", params.q);
  if (params.labelId) search.set("labelId", params.labelId);
  if (params.pageToken) search.set("pageToken", params.pageToken);
  const text = search.toString();
  return text ? `?${text}` : "";
}

/** La primera página de Recibidos (la pide el layout de la casilla). */
export async function getMessages(mailboxId: string): Promise<MessagePage<MessageSummary>> {
  return http.get(`${box(mailboxId)}/messages`);
}

/**
 * Una página de Recibidos desde el navegador: con búsqueda (`q`, la de Gmail),
 * filtro por etiqueta y/o la página siguiente ("Cargar más").
 */
export async function listMessages(
  mailboxId: string,
  params: ListParams
): Promise<ActionResult<MessagePage<MessageSummary>>> {
  return http.action(() =>
    http.get<MessagePage<MessageSummary>>(`${box(mailboxId)}/messages${queryString(params)}`)
  );
}

/** La conversación del mensaje (recibido o enviado). [] si no se pudo traer: el detalle se ve igual. */
export async function getThread(mailboxId: string, messageId: string): Promise<ThreadMessage[]> {
  try {
    return await http.get<ThreadMessage[]>(
      `${box(mailboxId)}/messages/${encodeURIComponent(messageId)}/thread`
    );
  } catch (err) {
    if (err instanceof ApiError) return [];
    throw err;
  }
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

/** Una página de Enviados desde el navegador: con búsqueda y/o la página siguiente. */
export async function listSentMessages(
  mailboxId: string,
  params: Omit<ListParams, "labelId">
): Promise<ActionResult<MessagePage<SentMessageSummary>>> {
  return http.action(() =>
    http.get<MessagePage<SentMessageSummary>>(`${box(mailboxId)}/sent${queryString(params)}`)
  );
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
