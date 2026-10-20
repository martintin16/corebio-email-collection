"use server";

import * as http from "./http.server";
import type { ActionResult } from "./errors";
import type { DriveAccessResult, DriveItem } from "@/lib/types/drive";

/**
 * "Gestionar Drive" (módulo `drive-access` del backend), solo admin: qué
 * carpetas y archivos del Drive de la casilla se comparten con una persona.
 * Se comparte como Editor; Google le avisa por mail.
 */

const drive = (mailboxId: string) => `/mailboxes/${encodeURIComponent(mailboxId)}/drive`;

/** Contenido de una carpeta; `shared`/`inherited` según esa persona. */
export async function getDriveFolderContents(
  mailboxId: string,
  folderId: string,
  userId: string
): Promise<DriveItem[]> {
  const query = new URLSearchParams({ userId, folderId });
  return http.get(`${drive(mailboxId)}/items?${query.toString()}`);
}

/** Ids de lo compartido DIRECTAMENTE con la persona (para pre-tildar). */
export async function getDriveSharedItemIds(mailboxId: string, userId: string): Promise<string[]> {
  return http.get(`${drive(mailboxId)}/shared?${new URLSearchParams({ userId }).toString()}`);
}

export interface UpdateDriveAccessInput {
  mailboxId: string;
  userId: string;
  // La selección FINAL: lo que no está se deja de compartir.
  itemIds: string[];
}

/**
 * Comparte lo nuevo y quita lo destildado. Cada ítem va por separado: los que
 * fallan vuelven en `failed` con el motivo, y los que no hacía falta compartir
 * (ya cubiertos por una carpeta) en `skipped`.
 */
export async function updateDriveAccess(
  input: UpdateDriveAccessInput
): Promise<ActionResult<DriveAccessResult>> {
  return http.action(() =>
    http.put<DriveAccessResult>(
      `${drive(input.mailboxId)}/access/${encodeURIComponent(input.userId)}`,
      { itemIds: input.itemIds }
    )
  );
}
