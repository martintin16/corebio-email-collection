import type { Metadata } from "next";
import { getMailboxesForCurrentUser, getSentMessageById } from "@/lib/api/mail";
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
    <div className="mx-auto max-w-[480px] p-6">
      <p className="mb-4 text-sm font-medium text-gray-900">{title}</p>
      <ComposeForm mailboxes={mailboxes} mode="page" initialValues={initialValues} />
    </div>
  );
}
