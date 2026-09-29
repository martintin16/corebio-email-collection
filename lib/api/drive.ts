import type { DriveItem } from "@/lib/types/drive";

/**
 * TODO: reemplazar por la Drive API real (domain-wide delegation), una vez
 * que el backend pueda actuar en nombre de la casilla institucional. Alcance
 * de esta ronda: elegir qué carpetas/archivos se comparten con una persona
 * — no un explorador completo de Drive (sin subir/renombrar/eliminar).
 */

const MOCK_DRIVE: Record<string, DriveItem[]> = {
  mbx_1: [
    { id: "root", name: "Mi unidad", type: "folder", parentId: null, shared: false },
    { id: "f_balances", name: "Balances 2026", type: "folder", parentId: "root", shared: false },
    { id: "f_comprobantes", name: "Comprobantes", type: "folder", parentId: "f_balances", shared: false },
    { id: "f_rendiciones", name: "Rendiciones trimestrales", type: "folder", parentId: "f_balances", shared: true },
    { id: "file_marzo", name: "Balance marzo 2026.xlsx", type: "file", parentId: "f_balances", shared: false },
    { id: "file_abril", name: "Balance abril 2026.xlsx", type: "file", parentId: "f_balances", shared: true },
    { id: "f_actas", name: "Actas de comisión", type: "folder", parentId: "root", shared: false },
    { id: "file_acta_marzo", name: "Acta marzo 2026.pdf", type: "file", parentId: "f_actas", shared: false },
  ],
  mbx_2: [
    { id: "root", name: "Mi unidad", type: "folder", parentId: null, shared: false },
    { id: "f_cuotas", name: "Cuotas societarias", type: "folder", parentId: "root", shared: true },
    { id: "file_cuotas_2026", name: "Cuotas 2026.xlsx", type: "file", parentId: "f_cuotas", shared: false },
  ],
};

function delay<T>(value: T, ms = 350): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

export function getDriveRootFolder(): { id: string; name: string } {
  return { id: "root", name: "Mi unidad" };
}

// Simula una carga que falla la primera vez que se abre "Comprobantes" —
// deja mostrar el estado de error + reintentar sin depender de que un
// backend real falle justo cuando hace falta revisarlo.
const failedOnce = new Set<string>();

export async function getDriveFolderContents(
  mailboxId: string,
  folderId: string
): Promise<DriveItem[]> {
  await new Promise((resolve) => setTimeout(resolve, 400));
  const key = `${mailboxId}:${folderId}`;
  if (folderId === "f_comprobantes" && !failedOnce.has(key)) {
    failedOnce.add(key);
    throw new Error("No pudimos cargar el contenido de esta carpeta.");
  }
  const tree = MOCK_DRIVE[mailboxId] ?? [];
  return tree.filter((item) => item.parentId === folderId);
}

// Todo lo que ya está compartido en la casilla, sin importar en qué carpeta
// — sirve para pre-tildar la selección al abrir el explorador, sin tener
// que navegar carpeta por carpeta primero para descubrirlo.
export async function getDriveSharedItemIds(mailboxId: string): Promise<string[]> {
  const tree = MOCK_DRIVE[mailboxId] ?? [];
  return delay(tree.filter((item) => item.shared).map((item) => item.id));
}
