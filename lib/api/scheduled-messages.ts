"use server";

import { revalidatePath } from "next/cache";
import * as http from "./http.server";
import { ApiError, type ActionResult } from "./errors";
import type { ScheduledMessage } from "@/lib/types/scheduled-message";

/**
 * Envíos programados (módulo `scheduled-messages` del backend): lista,
 * detalle y cancelar. Programar y editar van en scheduled-messages.browser.ts
 * (pueden llevar adjuntos).
 */

/** Pendientes, enviándose y con error, por fecha. */
export async function getScheduledMessages(mailboxId: string): Promise<ScheduledMessage[]> {
  return http.get(`/mailboxes/${encodeURIComponent(mailboxId)}/scheduled-messages`);
}

/** Para "Editar": Redactar recibe el id sin saber la casilla. null si no existe o no se puede ver. */
export async function getScheduledMessageById(id: string): Promise<ScheduledMessage | null> {
  try {
    return await http.get<ScheduledMessage>(`/scheduled-messages/${encodeURIComponent(id)}`);
  } catch (err) {
    if (err instanceof ApiError && (err.status === 404 || err.status === 403)) return null;
    throw err;
  }
}

/** Solo si todavía no salió (si ya se está enviando → error 409). */
/** Cancelar revalida las bandejas: así baja también el contador "Programados (N)". */
export async function cancelScheduledMessage(id: string): Promise<ActionResult> {
  const result = await http.action(() => http.del(`/scheduled-messages/${encodeURIComponent(id)}`));
  if (result.ok) revalidatePath("/inbox", "layout");
  return result;
}
