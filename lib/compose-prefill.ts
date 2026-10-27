import { getMailboxesForCurrentUser } from "@/lib/api/mailboxes";
import { getMessage, getSentMessageById } from "@/lib/api/messages";
import { getScheduledMessageById } from "@/lib/api/scheduled-messages";
import { buildForwardBody, buildForwardSubject, plainTextToHtml } from "@/lib/forward";
import type { CarriedAttachments } from "@/components/compose/compose-form";
import type { Mailbox } from "@/lib/types/mail";

/**
 * Lo que Redactar necesita según la URL (solo en el servidor: lo llaman las pages). Lo usan las dos páginas de Compose
 * (modal y página completa), que antes repetían esta lógica:
 * - `?edit=<id>`: editar un envío programado.
 * - `?forward=<id>`: reenviar un ENVIADO (se busca en las casillas de la persona).
 * - `?forward=<id>&mailbox=<casilla>`: reenviar un RECIBIDO de esa casilla.
 */
export interface ComposeSearchParams {
  edit?: string;
  forward?: string;
  mailbox?: string;
}

export interface ComposePrefill {
  /** Solo las casillas con permiso de envío. */
  mailboxes: Mailbox[];
  title: string;
  initialValues?: {
    mailboxId: string;
    to: string;
    cc?: string;
    bcc?: string;
    subject: string;
    body: string;
  };
  editingScheduledId?: string;
  carriedAttachments?: CarriedAttachments;
}

export async function loadComposePrefill(params: ComposeSearchParams): Promise<ComposePrefill> {
  const [allMailboxes, editing, forwardSent, forwardReceived] = await Promise.all([
    getMailboxesForCurrentUser(),
    params.edit ? getScheduledMessageById(params.edit) : Promise.resolve(null),
    !params.edit && params.forward && !params.mailbox
      ? getSentMessageById(params.forward)
      : Promise.resolve(null),
    !params.edit && params.forward && params.mailbox
      ? getMessage(params.mailbox, params.forward)
      : Promise.resolve(null),
  ]);
  const mailboxes = allMailboxes.filter((m) => m.canSend);

  if (editing) {
    return {
      mailboxes,
      title: "Editar envío programado",
      initialValues: {
        mailboxId: editing.mailboxId,
        to: editing.to,
        cc: editing.cc,
        bcc: editing.bcc,
        subject: editing.subject,
        body: editing.body,
      },
      editingScheduledId: editing.id,
      // Los adjuntos que ya tiene el programado.
      carriedAttachments: { kind: "keep", attachments: editing.attachments },
    };
  }

  // Al reenviar, los adjuntos del original se vuelven a adjuntar desde Gmail,
  // sin subirlos de nuevo.
  if (forwardReceived && params.mailbox) {
    const from = forwardReceived.from.name
      ? `${forwardReceived.from.name} <${forwardReceived.from.email}>`
      : forwardReceived.from.email;
    return {
      mailboxes,
      title: "Reenviar mensaje",
      initialValues: {
        mailboxId: params.mailbox,
        to: "",
        subject: buildForwardSubject(forwardReceived.subject),
        body: buildForwardBody({
          from,
          date: forwardReceived.receivedAt,
          to: forwardReceived.to,
          cc: forwardReceived.cc,
          subject: forwardReceived.subject,
          bodyHtml: plainTextToHtml(forwardReceived.body),
        }),
      },
      carriedAttachments: {
        kind: "forward",
        messageId: forwardReceived.id,
        attachments: forwardReceived.attachments,
      },
    };
  }

  if (forwardSent) {
    const mailbox = allMailboxes.find((m) => m.id === forwardSent.mailboxId);
    // Mismo formato que el "De" de un recibido: "Nombre <email>".
    const from = mailbox
      ? mailbox.displayName
        ? `${mailbox.displayName} <${mailbox.email}>`
        : mailbox.email
      : "";
    return {
      mailboxes,
      title: "Reenviar mensaje",
      initialValues: {
        mailboxId: forwardSent.mailboxId,
        to: "",
        subject: buildForwardSubject(forwardSent.subject),
        body: buildForwardBody({
          from,
          date: forwardSent.sentAt,
          to: forwardSent.to,
          cc: forwardSent.cc,
          subject: forwardSent.subject,
          bodyHtml: forwardSent.body,
        }),
      },
      carriedAttachments: {
        kind: "forward",
        messageId: forwardSent.id,
        attachments: forwardSent.attachments,
      },
    };
  }

  return { mailboxes, title: "Nuevo mensaje" };
}
