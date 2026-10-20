import type { Metadata } from "next";
import { getMailboxesForCurrentUser } from "@/lib/api/mailboxes";
import { getSentMessageById } from "@/lib/api/messages";
import { getScheduledMessageById } from "@/lib/api/scheduled-messages";
import { buildForwardSubject, buildForwardBody } from "@/lib/forward";
import { ComposeForm } from "@/components/compose/compose-form";

export const metadata: Metadata = {
  title: "Redactar",
};

export default async function ComposePage({
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
    <div className="mx-auto max-w-[480px] p-6">
      <p className="mb-4 text-sm font-medium text-gray-900">{title}</p>
      <ComposeForm
        mailboxes={mailboxes}
        mode="page"
        initialValues={initialValues}
        editingScheduledId={editing?.id}
        carriedAttachments={carriedAttachments}
      />
    </div>
  );
}
