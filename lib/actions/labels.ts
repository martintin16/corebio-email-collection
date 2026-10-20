"use server";

export interface UpdateMessageLabelsInput {
  mailboxId: string;
  messageId: string;
  // Ids de etiqueta (MailLabel.id) a agregar / sacar de la conversación.
  add: string[];
  remove: string[];
}

/**
 * TODO: reemplazar por PATCH real a
 * /mailboxes/:mailboxId/messages/:messageId/labels en el backend (que por
 * detrás llama a users.threads.modify de la Gmail API con addLabelIds /
 * removeLabelIds). Gmail aplica la etiqueta al thread entero, así que las
 * respuestas nuevas dentro de la misma conversación la heredan solas.
 *
 * Igual que el resto de las acciones simuladas del proyecto, esta no
 * persiste nada: la bandeja guarda el cambio en su propio estado local
 * (optimista) y lo revierte si esto falla.
 */
export async function updateMessageLabels(_input: UpdateMessageLabelsInput): Promise<{ ok: true }> {
  await new Promise((resolve) => setTimeout(resolve, 400));
  return { ok: true };
}
