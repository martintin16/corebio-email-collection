import { getMailboxesForCurrentUser, getSentMessageById } from "@/lib/api/mail";
import { getScheduledMessageById } from "@/lib/api/scheduled-messages";
import { buildForwardSubject, buildForwardBody } from "@/lib/forward";
import { ComposeModalShell } from "@/components/compose/compose-modal-shell";
import { ComposeForm } from "@/components/compose/compose-form";

export default async function ComposeModalPage({
  searchParams,
}: {
  searchParams: { edit?: string; forward?: string };
}) {
  const [mailboxes, editing, forwarding] = await Promise.all([
    getMailboxesForCurrentUser(),
    searchParams.edit ? getScheduledMessageById(searchParams.edit) : Promise.resolve(null),
    !searchParams.edit && searchParams.forward
      ? getSentMessageById(searchParams.forward)
      : Promise.resolve(null),
  ]);

  const title = editing ? "Editar envío programado" : forwarding ? "Reenviar mensaje" : "Nuevo mensaje";
  const initialValues = editing
    ? { mailboxId: editing.mailboxId, to: editing.to, subject: editing.subject, body: editing.body }
    : forwarding
      ? {
          mailboxId: forwarding.mailboxId,
          to: "",
          subject: buildForwardSubject(forwarding.subject),
          body: buildForwardBody(forwarding),
        }
      : undefined;

  return (
    <ComposeModalShell title={title}>
      <ComposeForm mailboxes={mailboxes} mode="modal" initialValues={initialValues} />
    </ComposeModalShell>
  );
}
