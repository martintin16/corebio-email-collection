"use client";

import Link from "next/link";
import type { SentMessageSummary } from "@/lib/types/mail";
import { formatMessageDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { AttachmentClip } from "@/components/inbox/attachment-clip";

/** Una fila de Enviados: "Para", fecha (con clip si lleva adjuntos), asunto y comienzo del texto. */
export function SentMessageRow({
  mailboxId,
  message,
  active,
}: {
  mailboxId: string;
  message: SentMessageSummary;
  active: boolean;
}) {
  return (
    <li>
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
            <span className="flex shrink-0 items-center gap-1 text-[11px] text-gray-400">
              {message.hasAttachments && <AttachmentClip />}
              {formatMessageDate(message.sentAt)}
            </span>
          </div>
          <p className="truncate text-xs text-gray-800">{message.subject}</p>
          <p className="truncate text-xs text-gray-400">{message.snippet}</p>
        </div>
      </Link>
    </li>
  );
}
