"use server";

import { revalidatePath } from "next/cache";
import type { NewUserFormValues, EditPermissionsFormValues } from "@/lib/validations/admin";

/**
 * TODO: reemplazar el cuerpo por la llamada real al backend (NestJS),
 * mandando el JWT de la sesión actual en el header Authorization. La
 * validación de permisos real vive ahí (RolesGuard); acá solo se dispara
 * la mutación y se revalida la ruta para que la tabla se actualice.
 */

export async function deactivateUser(userId: string) {
  await new Promise((resolve) => setTimeout(resolve, 400));
  revalidatePath("/admin/users");
  return { ok: true as const };
}

export async function deleteUser(userId: string) {
  await new Promise((resolve) => setTimeout(resolve, 400));
  revalidatePath("/admin/users");
  return { ok: true as const };
}

export async function resendInvite(userId: string) {
  await new Promise((resolve) => setTimeout(resolve, 400));
  return { ok: true as const };
}

export async function createUser(values: NewUserFormValues) {
  await new Promise((resolve) => setTimeout(resolve, 500));
  revalidatePath("/admin/users");
  return { ok: true as const };
}

export async function updateUserPermissions(userId: string, values: EditPermissionsFormValues) {
  await new Promise((resolve) => setTimeout(resolve, 500));
  revalidatePath("/admin/users");
  return { ok: true as const };
}
