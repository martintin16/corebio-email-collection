import { getMailboxesForCurrentUser } from "@/lib/api/mailboxes";
import { getSentMessageById } from "@/lib/api/messages";
import { getScheduledMessageById } from "@/lib/api/scheduled-messages";
import { buildForwardSubject, buildForwardBody } from "@/lib/forward";
import { ComposeModalShell } from "@/components/compose/compose-modal-shell";
import { ComposeForm } from "@/components/compose/compose-form";

export default async function ComposeModalPage({
  searchParams,
}: {
  searchParams: { edit?: string; forward?: string };
}) {
  const [allMailboxes, editing, forwarding] = await Promise.all([
    getMailboxesForCurrentUser(),
    searchParams.edit ? getScheduledMessageById(searchParams.edit) : Promise.resolve(null),
    !searchParams.edit && searchParams.forward
      ? getSentMessageById(searchParams.forward)
      : Promise.resolve(null),
  ]);
  // Solo se puede redactar desde casillas con permiso de envío.
  const mailboxes = allMailboxes.filter((m) => m.canSend);

  const title = editing ? "Editar envío programado" : forwarding ? "Reenviar mensaje" : "Nuevo mensaje";
  const initialValues = editing
    ? {
        mailboxId: editing.mailboxId,
        to: editing.to,
        cc: editing.cc,
        bcc: editing.bcc,
        subject: editing.subject,
        body: editing.body,
      }
    : forwarding
      ? {
          mailboxId: forwarding.mailboxId,
          to: "",
          subject: buildForwardSubject(forwarding.subject),
          body: buildForwardBody(forwarding),
        }
      : undefined;
  // Los adjuntos que ya tiene el programado, o los del mensaje que se reenvía
  // (se vuelven a adjuntar desde Gmail, sin subirlos de nuevo).
  const carriedAttachments = editing
    ? { kind: "keep" as const, attachments: editing.attachments }
    : forwarding
      ? { kind: "forward" as const, messageId: forwarding.id, attachments: forwarding.attachments }
      : undefined;

  return (
    <ComposeModalShell title={title}>
      <ComposeForm
        mailboxes={mailboxes}
        mode="modal"
        initialValues={initialValues}
        editingScheduledId={editing?.id}
        carriedAttachments={carriedAttachments}
      />
    </ComposeModalShell>
  );
}
