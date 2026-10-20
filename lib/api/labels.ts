import type { MailLabel } from "@/lib/types/label";

/**
 * TODO: igual que el resto de lib/api/* — reemplazar por fetch real al
 * backend: GET /mailboxes/:mailboxId/labels (que por detrás llama a
 * users.labels.list de la Gmail API). Alcance de esta ronda: solo ver las
 * etiquetas que ya existen en la casilla — crearlas/editarlas/borrarlas se
 * hace desde Gmail, no desde esta app.
 */

const MOCK_LABELS: Record<string, MailLabel[]> = {
  mbx_1: [
    { id: "lbl_salud", name: "Salud", color: "#0F766E" },
    { id: "lbl_urgente", name: "Urgente", color: "#92400E" },
    { id: "lbl_convenios", name: "Convenios", color: "#5B21B6" },
    // Sin color definido en Gmail → el frontend le asigna uno de su paleta.
    { id: "lbl_donantes", name: "Donantes", color: null },
  ],
  mbx_2: [
    { id: "lbl_pagos", name: "Pagos", color: "#1E40AF" },
    { id: "lbl_proveedores", name: "Proveedores", color: "#991B1B" },
  ],
};

function delay<T>(value: T, ms = 300): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

export async function getLabelsForMailbox(mailboxId: string): Promise<MailLabel[]> {
  return delay(MOCK_LABELS[mailboxId] ?? []);
}
