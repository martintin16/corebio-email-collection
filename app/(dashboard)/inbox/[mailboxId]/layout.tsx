import { notFound } from "next/navigation";
import { getMailboxesForCurrentUser, getMessages, getSentMessages } from "@/lib/api/mail";
import { getScheduledMessages } from "@/lib/api/scheduled-messages";
import { MailboxListPanel } from "@/components/inbox/mailbox-list-panel";
import { MailboxSplitView } from "@/components/inbox/mailbox-split-view";
import { MailboxLabelsProvider } from "@/components/inbox/mailbox-labels-provider";

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

  // Las tres listas se piden una sola vez acá (Server Component) — cuál se
  // muestra depende de la pestaña activa, que decide MailboxListPanel del
  // lado del cliente (necesita usePathname()).
  const [messages, sent, scheduled] = await Promise.all([
    getMessages(mailbox.id),
    getSentMessages(mailbox.id),
    getScheduledMessages(mailbox.id),
  ]);

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
