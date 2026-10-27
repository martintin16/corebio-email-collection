"use client";

import { usePathname } from "next/navigation";
import { MailboxSwitcher } from "@/components/inbox/mailbox-switcher";
import { MailboxRefresh } from "@/components/inbox/mailbox-refresh";
import { MessageList } from "@/components/inbox/message-list";
import { SentMessageList } from "@/components/inbox/sent-message-list";
import { ScheduledMessageList } from "@/components/inbox/scheduled-message-list";
import { MailboxTabs } from "@/components/inbox/mailbox-tabs";
import { InboxLabelFilter } from "@/components/inbox/inbox-label-filter";
import type { Mailbox, MessageSummary, SentMessageSummary } from "@/lib/types/mail";
import type { ScheduledMessage } from "@/lib/types/scheduled-message";

interface MailboxListPanelProps {
  mailboxes: Mailbox[];
  mailbox: Mailbox;
  messages: MessageSummary[];
  sent: SentMessageSummary[];
  scheduled: ScheduledMessage[];
}

// El layout del [mailboxId] pide las tres listas una sola vez (es Server
// Component) y este wrapper cliente decide cuál mostrar según la pestaña
// activa — así no hace falta que el layout sepa de rutas.
export function MailboxListPanel({ mailboxes, mailbox, messages, sent, scheduled }: MailboxListPanelProps) {
  const pathname = usePathname();
  const segments = (pathname ?? "").split("/").filter(Boolean);
  const sub = segments[2];

  return (
    <>
      <div className="flex items-center gap-2 border-b border-gray-200 px-4 py-3">
        <div className="min-w-0 flex-1">
          <MailboxSwitcher mailboxes={mailboxes} current={mailbox} />
        </div>
        {/* key: al cambiar de casilla arranca de cero (otra huella). */}
        <MailboxRefresh key={mailbox.id} mailboxId={mailbox.id} />
      </div>
      <MailboxTabs mailboxId={mailbox.id} scheduledCount={scheduled.length} />
      {/* Las etiquetas son de las conversaciones recibidas — Enviados y
          Programados no tienen nada para filtrar por etiqueta. */}
      {sub !== "sent" && sub !== "scheduled" && <InboxLabelFilter />}
      <div className="flex-1 overflow-y-auto">
        {sub === "sent" ? (
          <SentMessageList mailboxId={mailbox.id} messages={sent} />
        ) : sub === "scheduled" ? (
          <ScheduledMessageList mailboxId={mailbox.id} initialItems={scheduled} />
        ) : (
          <MessageList mailboxId={mailbox.id} messages={messages} />
        )}
      </div>
    </>
  );
}
