"use client";

import { useState } from "react";
import type { ThreadMessage } from "@/lib/types/mail";
import { formatMessageDate } from "@/lib/format";
import { MessageMeta } from "@/components/inbox/message-meta";
import { AttachmentList } from "@/components/inbox/attachment-list";
import { AttachmentClip } from "@/components/inbox/attachment-clip";

/**
 * Un mensaje anterior (o posterior) de la conversación. Colapsado: una línea
 * con quién, el comienzo del texto y la fecha corta. Al tocarlo se despliega
 * con su texto y sus adjuntos; tocar el encabezado lo vuelve a colapsar.
 */
export function ThreadMessageItem({
  mailboxId,
  message,
}: {
  mailboxId: string;
  message: ThreadMessage;
}) {
  const [open, setOpen] = useState(false);
  const name = message.from.name || message.from.email;

  return (
    <li className="rounded-md border border-gray-200">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-baseline justify-between gap-3 px-3 py-2 text-left text-xs hover:bg-gray-50"
      >
        <span className="min-w-0 truncate">
          <span className="font-medium text-gray-900">{name}</span>
          {!open && <span className="text-gray-400"> — {message.snippet}</span>}
        </span>
        <span className="flex shrink-0 items-center gap-1 text-[11px] text-gray-400">
          {message.attachments.length > 0 && <AttachmentClip />}
          {formatMessageDate(message.date)}
        </span>
      </button>
      {open && (
        <div className="border-t border-gray-100 px-3 pb-3 pt-2">
          <MessageMeta from={message.from} to={message.to} cc={message.cc} date={message.date} />
          <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-gray-800 [overflow-wrap:anywhere]">
            {message.body}
          </p>
          <AttachmentList
            source={{ kind: "message", mailboxId, messageId: message.id }}
            attachments={message.attachments}
          />
        </div>
      )}
    </li>
  );
}
