"use server";

export interface UpdateDriveAccessInput {
  mailboxId: string;
  userId: string;
  itemIds: string[];
}

/**
 * TODO: en producción esto llama a `permissions.create`/`permissions.delete`
 * de la Drive API por cada carpeta/archivo que cambió de estado (agregado o
 * sacado), actuando como la casilla institucional vía domain-wide
 * delegation — no algo que exista hasta que ese backend esté armado. Acá se
 * simula el resultado final, mismo patrón que el resto de las acciones
 * mockeadas del proyecto.
 */
export async function updateDriveAccess(_input: UpdateDriveAccessInput): Promise<{ ok: true }> {
  await new Promise((resolve) => setTimeout(resolve, 700));
  return { ok: true };
}
