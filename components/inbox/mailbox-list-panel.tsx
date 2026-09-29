"use client";

import { usePathname } from "next/navigation";
import { MailboxSwitcher } from "@/components/inbox/mailbox-switcher";
import { MessageList } from "@/components/inbox/message-list";
import { SentMessageList } from "@/components/inbox/sent-message-list";
import { ScheduledMessageList } from "@/components/inbox/scheduled-message-list";
import { MailboxTabs } from "@/components/inbox/mailbox-tabs";
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
      <div className="border-b border-gray-200 px-4 py-3">
        <MailboxSwitcher mailboxes={mailboxes} current={mailbox} />
      </div>
      <MailboxTabs mailboxId={mailbox.id} scheduledCount={scheduled.length} />
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
