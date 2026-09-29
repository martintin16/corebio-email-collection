export interface ScheduledMessage {
  id: string;
  mailboxId: string;
  to: string;
  subject: string;
  // Texto plano corto para la lista — igual que MessageSummary, no hace
  // falta el HTML completo para mostrar la fila.
  bodyPreview: string;
  // HTML completo — lo necesita "Editar" para prellenar el editor de Redactar.
  body: string;
  // ISO 8601, en UTC.
  scheduledAt: string;
}
