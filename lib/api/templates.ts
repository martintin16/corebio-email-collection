import type { MessageTemplate } from "@/lib/types/template";

/**
 * TODO: igual que el resto de lib/api/* — reemplazar por fetch real al
 * backend cuando exista. Alcance de esta ronda: plantillas de solo
 * lectura, fijas por casilla. Un CRUD para crear/editarlas (¿quién puede
 * hacerlo, admin o cualquier usuario?) queda para una iteración futura.
 */

const MOCK_TEMPLATES: Record<string, MessageTemplate[]> = {
  mbx_1: [
    {
      id: "tpl_1",
      name: "Confirmación de reunión",
      preview: "Hola, confirmamos la reunión para…",
      body:
        "<p>Hola,</p><p>Confirmamos la reunión de comisión directiva para el <strong>[fecha]</strong> a las <strong>[hora]</strong>.</p><p>Saludos,<br>Secretaría Corebio</p>",
    },
    {
      id: "tpl_2",
      name: "Convenio de práctica",
      preview: "Nos gustaría coordinar un convenio de práctica…",
      body:
        "<p>Buenas,</p><p>Nos gustaría coordinar un convenio de práctica para residentes con la comisión directiva de Corebio.</p><p>Quedamos atentos, saludos.</p>",
    },
  ],
  mbx_2: [
    {
      id: "tpl_3",
      name: "Recordatorio de pago",
      preview: "Te recordamos que la cuota vence…",
      body:
        "<p>Hola,</p><p>Te recordamos que la cuota de este mes vence el <strong>[fecha]</strong>.</p><p>Saludos,<br>Tesorería Corebio</p>",
    },
  ],
};

function delay<T>(value: T, ms = 300): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

export async function getTemplatesForMailbox(mailboxId: string): Promise<MessageTemplate[]> {
  return delay(MOCK_TEMPLATES[mailboxId] ?? []);
}
