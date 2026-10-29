// Tipos de la API del backend (mensajes de Gmail de cada casilla).

export interface Mailbox {
  id: string;
  email: string;
  displayName: string;
  // Lo que la persona puede hacer en esa casilla: leer (Recibidos, Enviados,
  // Programados) y enviar (Redactar, Responder, Plantillas, Contactos).
  canRead: boolean;
  canSend: boolean;
}

// Un adjunto de un mensaje; se baja con downloadMessageAttachment().
export interface AttachmentInfo {
  // Id del adjunto dentro del mensaje (el `partId` de Gmail, ej. "1").
  id: string;
  filename: string;
  mimeType: string;
  size: number; // bytes
}

export interface MessageSummary {
  id: string;
  from: { name: string; email: string };
  subject: string;
  snippet: string;
  receivedAt: string; // ISO
  unread: boolean;
  // Ids de las etiquetas de Gmail aplicadas a la conversación (ver MailLabel).
  labelIds: string[];
  // Si trae adjuntos (el clip de la fila).
  hasAttachments: boolean;
}

export interface MessageDetail extends MessageSummary {
  // Texto plano (se muestra como texto, no como HTML).
  body: string;
  to: string;
  // Header Cc tal cual ("" si no hay). En un recibido no existe el Bcc.
  cc: string;
  attachments: AttachmentInfo[];
}

export interface SentMessageSummary {
  id: string;
  to: string;
  subject: string;
  snippet: string;
  sentAt: string; // ISO
  hasAttachments: boolean;
}

export interface SentMessageDetail extends SentMessageSummary {
  mailboxId: string;
  body: string; // HTML ya sanitizado por el backend
  cc: string;
  bcc: string;
  attachments: AttachmentInfo[];
}

/**
 * Una página de Recibidos o Enviados (25). `nextPageToken` pide la siguiente
 * ("Cargar más"); null = no hay más.
 */
export interface MessagePage<T> {
  items: T[];
  nextPageToken: string | null;
}

/**
 * Un mensaje de la conversación (GET .../messages/:id/thread). El cuerpo va en
 * texto plano (en un hilo hay mensajes de terceros).
 */
export interface ThreadMessage {
  id: string;
  from: { name: string; email: string };
  to: string;
  cc: string;
  date: string; // ISO
  snippet: string;
  body: string;
  attachments: AttachmentInfo[];
  // Mandado desde la casilla.
  sent: boolean;
}
