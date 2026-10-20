import type { AttachmentInfo } from "@/lib/types/mail";

export type ScheduledMessageStatus = "pending" | "sending" | "sent" | "failed";

export interface ScheduledMessage {
  id: string;
  mailboxId: string;
  // Emails separados por coma, como en Redactar ("" si no hay).
  to: string;
  cc: string;
  bcc: string;
  subject: string;
  // Texto plano corto para la lista — igual que MessageSummary, no hace
  // falta el HTML completo para mostrar la fila.
  bodyPreview: string;
  // HTML completo — lo necesita "Editar" para prellenar el editor de Redactar.
  body: string;
  // ISO 8601, en UTC.
  scheduledAt: string;
  // pending: espera su hora · sending: saliendo ahora · failed: no salió (ver lastError).
  // Los enviados no aparecen en la lista (están en Enviados).
  status: ScheduledMessageStatus;
  lastError: string | null;
  // Los adjuntos que ya tiene (se guardan en un borrador de Gmail de la casilla).
  attachments: AttachmentInfo[];
  // Si es una respuesta programada: el mensaje al que responde.
  replyToMessageId: string | null;
  sentAt: string | null;
}
