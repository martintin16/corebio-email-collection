"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import type { MessagePage, MessageSummary } from "@/lib/types/mail";
import { loadMoreMessages } from "@/lib/api/messages";
import { usePagedList } from "@/components/inbox/use-paged-list";
import { LoadMoreButton } from "@/components/inbox/load-more-button";
import { formatMessageDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { InboxIcon } from "@/components/icons";
import { LabelChip } from "@/components/inbox/label-chip";
import { useMailboxLabels } from "@/components/inbox/mailbox-labels-provider";

interface MessageListProps {
  mailboxId: string;
  firstPage: MessagePage<MessageSummary>;
}

// Cuántos chips de etiqueta caben en una fila de la lista antes de resumir
// el resto como "+N" — el panel es angosto (280px), más de tres no entran.
const MAX_CHIPS_PER_ROW = 3;

export function MessageList({ mailboxId, firstPage }: MessageListProps) {
  const params = useParams<{ messageId?: string }>();
  const paged = usePagedList(firstPage, (token) => loadMoreMessages(mailboxId, token));
  const messages = paged.items;
  const { labelsById, getLabelIds, filterIds, clearFilter } = useMailboxLabels();
  // Abiertos en esta pantalla: el backend los marca leídos al abrirlos, pero
  // la lista viene del layout, que Next no vuelve a pedir al abrir un mail.
  // Se marcan acá al momento. No se vacía al llegar una lista nueva: lo
  // cargado con "Cargar más" no se vuelve a pedir, y un mail abierto ya
  // quedó leído en Gmail.
  const [openedIds, setOpenedIds] = useState<ReadonlySet<string>>(new Set());
  // El que está abierto también (por ejemplo, si se entró directo por URL).
  const isUnread = (message: MessageSummary) =>
    message.unread && !openedIds.has(message.id) && params.messageId !== message.id;

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
          const unread = isUnread(message);
          const messageLabels = getLabelIds(message.id, message.labelIds)
            .map((id) => labelsById.get(id))
            .filter((label): label is NonNullable<typeof label> => label !== undefined);
          return (
            <li key={message.id}>
              <Link
                href={`/inbox/${mailboxId}/${message.id}`}
                onClick={() => setOpenedIds((prev) => new Set(prev).add(message.id))}
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
                      className={cn(
                        "truncate text-sm",
                        unread ? "font-medium text-gray-900" : "text-gray-600"
                      )}
                    >
                      {message.from.name}
                      {unread && <span className="sr-only"> (no leído)</span>}
                    </span>
                    <span className="shrink-0 text-[11px] text-gray-400">
                      {formatMessageDate(message.receivedAt)}
                    </span>
                  </div>
                  <p
                    className={cn(
                      "truncate text-xs",
                      unread ? "font-medium text-gray-800" : "text-gray-500"
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
      {paged.hasMore && (
        <LoadMoreButton loading={paged.loading} error={paged.error} onClick={() => void paged.load()} />
      )}
    </>
  );
}
