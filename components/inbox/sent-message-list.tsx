"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import type { SentMessageSummary } from "@/lib/types/mail";
import { formatMessageDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/ui/empty-state";
import { SentIcon } from "@/components/icons";

interface SentMessageListProps {
  mailboxId: string;
  messages: SentMessageSummary[];
}

// Mismo patrón visual que MessageList (Recibidos), pero mostrando "Para"
// en vez de remitente y sin punto de no-leído — un enviado no tiene ese
// estado.
export function SentMessageList({ mailboxId, messages }: SentMessageListProps) {
  const params = useParams<{ sentId?: string }>();

  if (messages.length === 0) {
    return (
      <EmptyState
        icon={SentIcon}
        title="No hay mensajes enviados"
        description="Los mails que mandes desde esta casilla van a aparecer acá."
      />
    );
  }

  return (
    <ul aria-label="Mensajes enviados" className="divide-y divide-gray-200">
      {messages.map((message) => {
        const active = params.sentId === message.id;
        return (
          <li key={message.id}>
            <Link
              href={`/inbox/${mailboxId}/sent/${message.id}`}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex gap-2.5 px-4 py-2.5 transition-colors",
                active ? "bg-gray-100" : "hover:bg-gray-50"
              )}
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="truncate text-sm text-gray-600">Para: {message.to}</span>
                  <span className="shrink-0 text-[11px] text-gray-400">
                    {formatMessageDate(message.sentAt)}
                  </span>
                </div>
                <p className="truncate text-xs text-gray-800">{message.subject}</p>
                <p className="truncate text-xs text-gray-400">{message.snippet}</p>
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
