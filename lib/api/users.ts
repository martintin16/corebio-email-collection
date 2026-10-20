"use server";

import { revalidatePath } from "next/cache";
import * as http from "./http.server";
import type { ActionResult } from "./errors";
import type { AdminUser } from "@/lib/types/admin";
import type { EditPermissionsFormValues, NewUserFormValues } from "@/lib/validations/admin";

/**
 * Usuarios (módulo `users` del backend), solo admin. Después de cada cambio
 * se revalida /admin/users para que la tabla se actualice.
 * Al quitarle una casilla a alguien (o desactivarlo/borrarlo) el backend
 * también le quita lo compartido en el Drive de esa casilla.
 */

const done = <T>(result: ActionResult<T>) => {
  if (result.ok) revalidatePath("/admin/users");
  return result;
};

export async function getUsers(): Promise<AdminUser[]> {
  return http.get("/users");
}

/** Invita por mail (Supabase). Email ya registrado → error 409. */
export async function createUser(values: NewUserFormValues): Promise<ActionResult<AdminUser>> {
  return done(await http.action(() => http.post<AdminUser>("/users", values)));
}

/** Reemplaza rol y TODOS los permisos por casilla. */
export async function updateUserPermissions(
  userId: string,
  values: EditPermissionsFormValues
): Promise<ActionResult<AdminUser>> {
  return done(
    await http.action(() =>
      http.patch<AdminUser>(`/users/${encodeURIComponent(userId)}/permissions`, values)
    )
  );
}

export async function deactivateUser(userId: string): Promise<ActionResult<AdminUser>> {
  return done(
    await http.action(() =>
      http.patch<AdminUser>(`/users/${encodeURIComponent(userId)}/deactivate`, {})
    )
  );
}

export async function deleteUser(userId: string): Promise<ActionResult> {
  return done(await http.action(() => http.del(`/users/${encodeURIComponent(userId)}`)));
}

/** Solo para quien todavía no aceptó la invitación. */
export async function resendInvite(userId: string): Promise<ActionResult> {
  return http.action(() => http.post<void>(`/users/${encodeURIComponent(userId)}/resend-invite`));
}
