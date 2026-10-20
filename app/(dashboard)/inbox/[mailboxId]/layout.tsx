import { notFound } from "next/navigation";
import { getMailboxesForCurrentUser } from "@/lib/api/mailboxes";
import { getMessages, getSentMessages } from "@/lib/api/messages";
import { getScheduledMessages } from "@/lib/api/scheduled-messages";
import { ApiError, isReconnectError } from "@/lib/api/errors";
import { MailboxListPanel } from "@/components/inbox/mailbox-list-panel";
import { MailboxSplitView } from "@/components/inbox/mailbox-split-view";
import { MailboxLabelsProvider } from "@/components/inbox/mailbox-labels-provider";
import { MailboxUnavailable } from "@/components/inbox/mailbox-unavailable";

export default async function MailboxLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { mailboxId: string };
}) {
  const mailboxes = await getMailboxesForCurrentUser();
  const mailbox = mailboxes.find((m) => m.id === params.mailboxId);

  // Si el mailboxId no está entre las casillas asignadas a esta persona,
  // para ella directamente no existe — mismo resultado que una URL inválida.
  if (!mailbox) notFound();

  // Con permiso solo de envío no hay bandeja para mostrar (el backend daría 403).
  if (!mailbox.canRead) {
    return (
      <div className="flex h-full items-center justify-center">
        <MailboxUnavailable reason="send_only" />
      </div>
    );
  }

  // Las tres listas se piden una sola vez acá (Server Component) — cuál se
  // muestra depende de la pestaña activa, que decide MailboxListPanel del
  // lado del cliente (necesita usePathname()).
  let lists;
  try {
    lists = await Promise.all([
      getMessages(mailbox.id),
      getSentMessages(mailbox.id),
      getScheduledMessages(mailbox.id),
    ]);
  } catch (err) {
    if (!(err instanceof ApiError)) throw err;
    return (
      <div className="flex h-full items-center justify-center">
        <MailboxUnavailable
          reason={isReconnectError(err) ? "reconnect" : "error"}
          message={err.message}
        />
      </div>
    );
  }
  const [messages, sent, scheduled] = lists;

  // key={mailbox.id}: al cambiar de casilla el proveedor de etiquetas se
  // monta de cero (otro catálogo de etiquetas, el filtro vuelve a "Todas").
  return (
    <MailboxLabelsProvider key={mailbox.id} mailboxId={mailbox.id}>
      <MailboxSplitView
        listPanel={
          <MailboxListPanel
            mailboxes={mailboxes}
            mailbox={mailbox}
            messages={messages}
            sent={sent}
            scheduled={scheduled}
          />
        }
      >
        {children}
      </MailboxSplitView>
    </MailboxLabelsProvider>
  );
}
