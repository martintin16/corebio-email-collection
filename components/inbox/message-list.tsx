"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import type { MessageSummary } from "@/lib/types/mail";
import { formatMessageDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { InboxIcon } from "@/components/icons";
import { LabelChip } from "@/components/inbox/label-chip";
import { useMailboxLabels } from "@/components/inbox/mailbox-labels-provider";

interface MessageListProps {
  mailboxId: string;
  messages: MessageSummary[];
}

// Cuántos chips de etiqueta caben en una fila de la lista antes de resumir
// el resto como "+N" — el panel es angosto (280px), más de tres no entran.
const MAX_CHIPS_PER_ROW = 3;

export function MessageList({ mailboxId, messages }: MessageListProps) {
  const params = useParams<{ messageId?: string }>();
  const { labelsById, getLabelIds, filterIds, clearFilter } = useMailboxLabels();

  if (messages.length === 0) {
    return (
      <EmptyState
        icon={InboxIcon}
        title="No hay mensajes"
        description="Todavía no llegó ningún mail a esta casilla."
      />
    );
  }

  // Filtro por etiqueta: OR entre las elegidas (alcanza con tener una).
  const visible =
    filterIds.length === 0
      ? messages
      : messages.filter((m) => getLabelIds(m.id, m.labelIds).some((id) => filterIds.includes(id)));

  if (visible.length === 0) {
    return (
      <EmptyState
        icon={InboxIcon}
        title={filterIds.length === 1 ? "No hay mensajes con esa etiqueta" : "No hay mensajes con esas etiquetas"}
        description="Probá con otra etiqueta o volvé a ver todos los mensajes."
        action={
          <Button type="button" variant="secondary" onClick={clearFilter}>
            Quitar filtro
          </Button>
        }
      />
    );
  }

  const filterNames = filterIds
    .map((id) => labelsById.get(id)?.name)
    .filter((name): name is string => name !== undefined)
    .join(" o ");

  return (
    <>
      {filterIds.length > 0 && (
        <p role="status" className="border-b border-gray-200 px-4 py-2 text-[11px] text-gray-400">
          {visible.length === 1 ? "1 mensaje" : `${visible.length} mensajes`} con {filterNames}
        </p>
      )}
      <ul aria-label="Mensajes" className="divide-y divide-gray-200">
        {visible.map((message) => {
          const active = params.messageId === message.id;
          const messageLabels = getLabelIds(message.id, message.labelIds)
            .map((id) => labelsById.get(id))
            .filter((label): label is NonNullable<typeof label> => label !== undefined);
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
                  {messageLabels.length > 0 && (
                    <div className="mt-1 flex flex-wrap items-center gap-1">
                      {messageLabels.slice(0, MAX_CHIPS_PER_ROW).map((label) => (
                        <LabelChip key={label.id} label={label} />
                      ))}
                      {messageLabels.length > MAX_CHIPS_PER_ROW && (
                        <span className="text-[11px] text-gray-400">
                          +{messageLabels.length - MAX_CHIPS_PER_ROW}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </>
  );
}
