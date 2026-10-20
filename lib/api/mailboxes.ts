"use server";

import { revalidatePath } from "next/cache";
import * as http from "./http.server";
import type { ActionResult } from "./errors";
import type { AdminMailbox, AdminUser, MailboxAccessSummary } from "@/lib/types/admin";
import type { Mailbox } from "@/lib/types/mail";
import type { ConnectMailboxFormValues, EditMailboxNameFormValues } from "@/lib/validations/admin";

/** Casillas a las que la persona logueada tiene algún permiso, con lo que puede hacer en cada una. */
export async function getMailboxesForCurrentUser(): Promise<Mailbox[]> {
  return http.get<Mailbox[]>("/me/mailboxes");
}

// --- Admin ----------------------------------------------------------------------

const box = (mailboxId: string) => `/mailboxes/${encodeURIComponent(mailboxId)}`;

const done = <T>(result: ActionResult<T>) => {
  if (result.ok) {
    revalidatePath("/admin/mailboxes");
    revalidatePath("/admin/users");
  }
  return result;
};

export async function getMailboxConnections(): Promise<AdminMailbox[]> {
  return http.get("/mailboxes");
}

/**
 * Alta de la casilla y pedido del link de Google. La conexión se completa en
 * el navegador: hay que ir a `authUrl` para que la cuenta de la casilla
 * autorice el acceso; Google vuelve a /admin/mailboxes?connected=<id> (o
 * ?connectionError=<código>).
 */
export async function connectMailbox(
  values: ConnectMailboxFormValues
): Promise<ActionResult<{ authUrl: string }>> {
  const created = await http.action(() => http.post<AdminMailbox>("/mailboxes", values));
  if (!created.ok) return created;
  revalidatePath("/admin/mailboxes");
  return http.action(() => http.post<{ authUrl: string }>(`${box(created.data.id)}/reconnect`));
}

/** Link de Google para volver a autorizar una casilla (o completar una conexión que quedó a medias). */
export async function reconnectMailbox(
  mailboxId: string
): Promise<ActionResult<{ authUrl: string }>> {
  return http.action(() => http.post<{ authUrl: string }>(`${box(mailboxId)}/reconnect`));
}

export async function updateMailboxDisplayName(
  mailboxId: string,
  values: EditMailboxNameFormValues
): Promise<ActionResult<AdminMailbox>> {
  return done(await http.action(() => http.patch<AdminMailbox>(box(mailboxId), values)));
}

/** Revoca el permiso en Google y borra la casilla con sus permisos, programados y plantillas. */
export async function disconnectMailbox(mailboxId: string): Promise<ActionResult> {
  return done(await http.action(() => http.del(box(mailboxId))));
}

/** "Ver usuarios con acceso". */
export async function getMailboxAccessList(
  mailboxId: string
): Promise<{ user: AdminUser; access: MailboxAccessSummary }[]> {
  return http.get(`${box(mailboxId)}/access`);
}
