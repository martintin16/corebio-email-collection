export interface Mailbox {
  id: string;
  email: string;
  displayName: string;
}

export interface MessageSummary {
  id: string;
  from: { name: string; email: string };
  subject: string;
  snippet: string;
  receivedAt: string; // ISO
  unread: boolean;
}

export interface MessageDetail extends MessageSummary {
  body: string;
  to: string;
}

export interface SentMessageSummary {
  id: string;
  to: string;
  subject: string;
  snippet: string;
  sentAt: string; // ISO
}

export interface SentMessageDetail extends SentMessageSummary {
  mailboxId: string;
  body: string; // HTML — viene del editor enriquecido (Redactar/Responder)
}
