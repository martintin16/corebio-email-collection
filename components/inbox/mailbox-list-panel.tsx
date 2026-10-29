"use client";

import { MailboxSwitcher } from "@/components/inbox/mailbox-switcher";
import { MailboxRefresh } from "@/components/inbox/mailbox-refresh";
import { useMailboxPath } from "@/components/inbox/use-mailbox-path";
import { MessageList } from "@/components/inbox/message-list";
import { SentMessageList } from "@/components/inbox/sent-message-list";
import { ScheduledMessageList } from "@/components/inbox/scheduled-message-list";
import { MailboxTabs } from "@/components/inbox/mailbox-tabs";
import { InboxLabelFilter } from "@/components/inbox/inbox-label-filter";
import { MailboxSearch } from "@/components/inbox/mailbox-search";
import type { Mailbox, MessagePage, MessageSummary, SentMessageSummary } from "@/lib/types/mail";
import type { ScheduledMessage } from "@/lib/types/scheduled-message";

interface MailboxListPanelProps {
  mailboxes: Mailbox[];
  mailbox: Mailbox;
  /** Primeras páginas (25); "Cargar más" pide las siguientes desde cada lista. */
  messages: MessagePage<MessageSummary>;
  sent: MessagePage<SentMessageSummary>;
  scheduled: ScheduledMessage[];
}

// El layout del [mailboxId] pide las tres listas una sola vez (es Server
// Component) y este wrapper cliente decide cuál mostrar según la pestaña
// activa — así no hace falta que el layout sepa de rutas.
export function MailboxListPanel({ mailboxes, mailbox, messages, sent, scheduled }: MailboxListPanelProps) {
  const { tab } = useMailboxPath();

  return (
    <>
      <div className="flex shrink-0 items-center gap-2 border-b border-gray-200 px-4 py-3">
        <div className="min-w-0 flex-1">
          <MailboxSwitcher mailboxes={mailboxes} current={mailbox} />
        </div>
        {/* key: al cambiar de casilla arranca de cero (otra huella). */}
        <MailboxRefresh key={mailbox.id} mailboxId={mailbox.id} />
      </div>
      <MailboxTabs mailboxId={mailbox.id} scheduledCount={scheduled.length} />
      {/* Programados es una lista corta: no necesita buscador. */}
      {tab === "inbox" && <MailboxSearch placeholder="Buscar en Recibidos" />}
      {tab === "sent" && <MailboxSearch placeholder="Buscar en Enviados" />}
      {/* Las etiquetas son de las conversaciones recibidas — Enviados y
          Programados no tienen nada para filtrar por etiqueta. */}
      {tab === "inbox" && <InboxLabelFilter />}
      {/* Encabezado fijo arriba; solo esto scrollea. `relative`: los textos
          ocultos para lectores de pantalla (sr-only, position:absolute) de
          las filas se ubican contra esta columna; si no, estiraban la página. */}
      <div className="relative min-h-0 flex-1 overflow-y-auto">
        {tab === "sent" ? (
          <SentMessageList mailboxId={mailbox.id} firstPage={sent} canSend={mailbox.canSend} />
        ) : tab === "scheduled" ? (
          <ScheduledMessageList mailboxId={mailbox.id} initialItems={scheduled} />
        ) : (
          <MessageList mailboxId={mailbox.id} firstPage={messages} />
        )}
      </div>
    </>
  );
}
