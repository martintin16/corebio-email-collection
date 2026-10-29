"use client";

import Link from "next/link";
import type { MessageSummary } from "@/lib/types/mail";
import type { MailLabel } from "@/lib/types/label";
import { formatMessageDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { LabelChip } from "@/components/inbox/label-chip";
import { AttachmentClip } from "@/components/inbox/attachment-clip";

// Cuántos chips de etiqueta caben en una fila de la lista antes de resumir
// el resto como "+N" — el panel es angosto (280px), más de tres no entran.
const MAX_CHIPS_PER_ROW = 3;

/** Una fila de Recibidos: remitente, fecha (con clip si trae adjuntos), asunto y etiquetas. */
export function MessageRow({
  mailboxId,
  message,
  unread,
  active,
  labels,
  onOpen,
}: {
  mailboxId: string;
  message: MessageSummary;
  unread: boolean;
  active: boolean;
  labels: MailLabel[];
  onOpen: () => void;
}) {
  return (
    <li>
      <Link
        href={`/inbox/${mailboxId}/${message.id}`}
        onClick={onOpen}
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
            unread ? "bg-primary-600" : "bg-transparent"
          )}
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <span
              className={cn("truncate text-sm", unread ? "font-medium text-gray-900" : "text-gray-600")}
            >
              {message.from.name}
              {unread && <span className="sr-only"> (no leído)</span>}
            </span>
            <span className="flex shrink-0 items-center gap-1 text-[11px] text-gray-400">
              {message.hasAttachments && <AttachmentClip />}
              {formatMessageDate(message.receivedAt)}
            </span>
          </div>
          <p className={cn("truncate text-xs", unread ? "font-medium text-gray-800" : "text-gray-500")}>
            {message.subject}
          </p>
          {labels.length > 0 && (
            <div className="mt-1 flex flex-wrap items-center gap-1">
              {labels.slice(0, MAX_CHIPS_PER_ROW).map((label) => (
                <LabelChip key={label.id} label={label} />
              ))}
              {labels.length > MAX_CHIPS_PER_ROW && (
                <span className="text-[11px] text-gray-400">+{labels.length - MAX_CHIPS_PER_ROW}</span>
              )}
            </div>
          )}
        </div>
      </Link>
    </li>
  );
}
