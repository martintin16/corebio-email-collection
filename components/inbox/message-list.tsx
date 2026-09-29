"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import type { MessageSummary } from "@/lib/types/mail";
import { formatMessageDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/ui/empty-state";
import { InboxIcon } from "@/components/icons";

interface MessageListProps {
  mailboxId: string;
  messages: MessageSummary[];
}

export function MessageList({ mailboxId, messages }: MessageListProps) {
  const params = useParams<{ messageId?: string }>();

  if (messages.length === 0) {
    return (
      <EmptyState
        icon={InboxIcon}
        title="No hay mensajes"
        description="Todavía no llegó ningún mail a esta casilla."
      />
    );
  }

  return (
    <ul aria-label="Mensajes" className="divide-y divide-gray-200">
      {messages.map((message) => {
        const active = params.messageId === message.id;
        return (
          <li key={message.id}>
            <Link
              href={`/inbox/${mailboxId}/${message.id}`}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex gap-2.5 px-4 py-2.5 transition-colors",
                active ? "bg-gray-100" : "hover:bg-gray-50"
              )}
            >
              <span
                aria-hidden="true"
                className={cn(
                  "mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full",
                  message.unread ? "bg-primary-600" : "bg-transparent"
                )}
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <span
                    className={cn(
                      "truncate text-sm",
                      message.unread ? "font-medium text-gray-900" : "text-gray-600"
                    )}
                  >
                    {message.from.name}
                    {message.unread && <span className="sr-only"> (no leído)</span>}
                  </span>
                  <span className="shrink-0 text-[11px] text-gray-400">
                    {formatMessageDate(message.receivedAt)}
                  </span>
                </div>
                <p
                  className={cn(
                    "truncate text-xs",
                    message.unread ? "font-medium text-gray-800" : "text-gray-500"
                  )}
                >
                  {message.subject}
                </p>
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
