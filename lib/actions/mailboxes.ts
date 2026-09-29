"use server";

import { revalidatePath } from "next/cache";
import { getUsers } from "@/lib/api/admin";
import type { ConnectMailboxFormValues, EditMailboxNameFormValues } from "@/lib/validations/admin";

// TODO: ver nota en lib/actions/users.ts — mismo patrón, backend pendiente.
// "Reconectar" en producción abre el consentimiento de Google (browser,
// no server action); acá se deja mockeado hasta que armemos esa vista.

export async function disconnectMailbox(mailboxId: string) {
  await new Promise((resolve) => setTimeout(resolve, 400));
  revalidatePath("/admin/mailboxes");
  return { ok: true as const };
}

/**
 * TODO: en producción, este paso solo guarda email + nombre visible; el
 * "Continuar con Google" real es una navegación del navegador al
 * consentimiento OAuth (no algo que resuelva una server action), y recién
 * ahí el backend guarda el refresh_token de esa casilla. Acá se simula el
 * resultado final para poder ver el estado "conectada" en la tabla.
 */
export async function connectMailbox(values: ConnectMailboxFormValues) {
  await new Promise((resolve) => setTimeout(resolve, 500));
  revalidatePath("/admin/mailboxes");
  return { ok: true as const };
}

export async function updateMailboxDisplayName(
  mailboxId: string,
  values: EditMailboxNameFormValues
) {
  await new Promise((resolve) => setTimeout(resolve, 400));
  revalidatePath("/admin/mailboxes");
  return { ok: true as const };
}

/**
 * En producción esto redirige de nuevo al consentimiento de Google (igual
 * que connectMailbox) para renovar el permiso vencido — no hay nada que una
 * server action pueda "arreglar" del lado del backend sin esa autorización
 * del dueño de la casilla. Acá se simula el resultado final.
 */
export async function reconnectMailbox(mailboxId: string) {
  await new Promise((resolve) => setTimeout(resolve, 700));
  revalidatePath("/admin/mailboxes");
  return { ok: true as const };
}

/**
 * Para "Ver usuarios con acceso": no hace falta un endpoint propio, es un
 * filtro sobre la misma lista de usuarios que ya usa Admin → Usuarios. En el
 * backend real esto probablemente sea un query param (?mailboxId=) sobre
 * GET /users en vez de traer todo y filtrar acá, pero el resultado para la
 * vista es el mismo.
 */
export async function getMailboxAccessList(mailboxId: string) {
  await new Promise((resolve) => setTimeout(resolve, 350));
  const users = await getUsers();
  return users
    .map((user) => ({
      user,
      access: user.mailboxAccess.find((a) => a.mailboxId === mailboxId),
    }))
    .filter((entry): entry is { user: typeof entry.user; access: NonNullable<typeof entry.access> } =>
      Boolean(entry.access)
    );
}
