import type {
  Mailbox,
  MessageSummary,
  MessageDetail,
  SentMessageSummary,
  SentMessageDetail,
} from "@/lib/types/mail";

/**
 * TODO: reemplazar el cuerpo de estas funciones por fetch real a
 * `${process.env.NEXT_PUBLIC_API_URL}/...` (NestJS) una vez que ese repo
 * exista, mandando el JWT de Supabase en el header Authorization. Las
 * firmas (async, mismo shape de retorno) ya están pensadas para eso —
 * las vistas que las consumen no deberían necesitar cambios.
 */

const MOCK_MAILBOXES: Mailbox[] = [
  { id: "mbx_1", email: "secretaria@corebio.org", displayName: "Secretaría Corebio" },
];

const MOCK_MESSAGES: Record<string, MessageDetail[]> = {
  mbx_1: [
    {
      id: "msg_1",
      from: { name: "María Gómez", email: "maria@gmail.com" },
      to: "secretaria@corebio.org",
      subject: "Reunión de comisión",
      snippet: "Buenas, quería confirmar la fecha de la próxima reunión...",
      body: "Buenas, quería confirmar la fecha de la próxima reunión de comisión directiva para coordinar la agenda con las residencias asociadas.\n\nQuedo atenta, saludos.",
      receivedAt: new Date().toISOString(),
      unread: true,
    },
    {
      id: "msg_2",
      from: { name: "Residencia Norte", email: "contacto@residencianorte.org" },
      to: "secretaria@corebio.org",
      subject: "Solicitud de convenio",
      snippet: "Nos gustaría coordinar un convenio de práctica...",
      body: "Nos gustaría coordinar un convenio de práctica para residentes con la comisión directiva de Corebio.",
      receivedAt: new Date(Date.now() - 86_400_000).toISOString(),
      unread: false,
    },
  ],
};

const MOCK_SENT_MESSAGES: Record<string, SentMessageDetail[]> = {
  mbx_1: [
    {
      id: "sent_1",
      mailboxId: "mbx_1",
      to: "tesoreria@corebio.org",
      subject: "Balance del mes",
      snippet: "Les paso el balance de este mes para la próxima reunión...",
      body: "<p>Les paso el balance de este mes para la próxima reunión.</p><p>Saludos,<br>Secretaría Corebio</p>",
      sentAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "sent_2",
      mailboxId: "mbx_1",
      to: "residencianorte@gmail.com",
      subject: "Re: Solicitud de convenio",
      snippet: "Buenas, confirmamos que podemos avanzar con el convenio...",
      body: "<p>Buenas,</p><p>Confirmamos que podemos avanzar con el convenio de práctica.</p><p>Saludos.</p>",
      sentAt: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(),
    },
  ],
};

function delay<T>(value: T, ms = 350): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

export async function getMailboxesForCurrentUser(): Promise<Mailbox[]> {
  return delay(MOCK_MAILBOXES);
}

export async function getMessages(mailboxId: string): Promise<MessageSummary[]> {
  return delay(MOCK_MESSAGES[mailboxId] ?? []);
}

export async function getMessage(
  mailboxId: string,
  messageId: string
): Promise<MessageDetail | null> {
  const messages = MOCK_MESSAGES[mailboxId] ?? [];
  return delay(messages.find((m) => m.id === messageId) ?? null);
}

export async function getSentMessages(mailboxId: string): Promise<SentMessageSummary[]> {
  const items = (MOCK_SENT_MESSAGES[mailboxId] ?? [])
    .slice()
    .sort((a, b) => b.sentAt.localeCompare(a.sentAt));
  return delay(items);
}

export async function getSentMessage(
  mailboxId: string,
  sentId: string
): Promise<SentMessageDetail | null> {
  const items = MOCK_SENT_MESSAGES[mailboxId] ?? [];
  return delay(items.find((m) => m.id === sentId) ?? null);
}

// Para "Reenviar" desde el detalle de un mensaje enviado — el mismo caso que
// getScheduledMessageById en lib/api/scheduled-messages.ts: Compose recibe
// el id sin saber de antemano en qué casilla vive.
export async function getSentMessageById(sentId: string): Promise<SentMessageDetail | null> {
  const all = Object.values(MOCK_SENT_MESSAGES).flat();
  return delay(all.find((m) => m.id === sentId) ?? null);
}
