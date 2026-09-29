import Link from "next/link";
import { redirect } from "next/navigation";
import { getMailboxesForCurrentUser } from "@/lib/api/mail";
import { EmptyState } from "@/components/ui/empty-state";
import { MailOffIcon, InboxIcon } from "@/components/icons";

export default async function InboxPage() {
  const mailboxes = await getMailboxesForCurrentUser();

  if (mailboxes.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <EmptyState
          icon={MailOffIcon}
          title="Todavía no tenés casillas asignadas"
          description="Pedile a un administrador que te dé acceso a una casilla de Corebio para poder ver tus mails."
        />
      </div>
    );
  }

  if (mailboxes.length === 1) {
    redirect(`/inbox/${mailboxes[0]!.id}`);
  }

  return (
    <div className="mx-auto max-w-sm p-8">
      <p className="mb-4 text-sm font-medium text-gray-900">
        Elegí una casilla
      </p>
      <ul className="space-y-1.5">
        {mailboxes.map((mailbox) => (
          <li key={mailbox.id}>
            <Link
              href={`/inbox/${mailbox.id}`}
              className="flex items-center gap-2.5 rounded-md border border-gray-200 px-3.5 py-2.5 text-sm text-gray-700 transition-colors hover:bg-gray-50"
            >
              <InboxIcon className="h-4 w-4 text-gray-400" />
              {mailbox.email}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
