"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import type { MessagePage, MessageSummary } from "@/lib/types/mail";
import { listMessages } from "@/lib/api/messages";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { InboxIcon, SearchIcon } from "@/components/icons";
import { useMailboxLabels } from "@/components/inbox/mailbox-labels-provider";
import { useListQuery } from "@/components/inbox/list-query-provider";
import { usePagedList } from "@/components/inbox/use-paged-list";
import { useSearchPage } from "@/components/inbox/use-search-page";
import { LoadMoreButton } from "@/components/inbox/load-more-button";
import { ListStatusBar } from "@/components/inbox/list-status-bar";
import { ListLoading } from "@/components/inbox/list-loading";
import { MessageRow } from "@/components/inbox/message-row";

interface MessageListProps {
  mailboxId: string;
  /** Primera página normal de Recibidos (la trae el layout y se refresca sola). */
  firstPage: MessagePage<MessageSummary>;
}

const EMPTY_PAGE: MessagePage<MessageSummary> = { items: [], nextPageToken: null };

/**
 * Lista de Recibidos. Sin búsqueda ni filtro muestra la primera página del
 * layout; con búsqueda (MailboxSearch) o una etiqueta (InboxLabelFilter) pide
 * los resultados a Gmail desde el navegador. En los dos casos, "Cargar más".
 */
export function MessageList({ mailboxId, firstPage }: MessageListProps) {
  const params = useParams<{ messageId?: string }>();
  const { labelsById, getLabelIds, filterId, clearFilter } = useMailboxLabels();
  const { query, setQuery } = useListQuery();

  const filtering = query !== "" || filterId !== null;
  const searchKey = `${query}|${filterId ?? ""}`;
  const listParams = { q: query || undefined, labelId: filterId ?? undefined };
  const search = useSearchPage({
    active: filtering,
    key: searchKey,
    refreshSignal: firstPage,
    fetchPage: () => listMessages(mailboxId, listParams),
  });
  const paged = usePagedList(
    filtering ? (search.page ?? EMPTY_PAGE) : firstPage,
    (pageToken) => listMessages(mailboxId, { ...listParams, pageToken }),
    filtering ? searchKey : ""
  );
  const messages = paged.items;

  // Abiertos en esta pantalla: el backend los marca leídos al abrirlos, pero
  // la lista no se vuelve a pedir al abrir un mail. Se marcan acá al momento.
  const [openedIds, setOpenedIds] = useState<ReadonlySet<string>>(new Set());
  // El que está abierto también (por ejemplo, si se entró directo por URL).
  const isUnread = (message: MessageSummary) =>
    message.unread && !openedIds.has(message.id) && params.messageId !== message.id;

  function clearAll() {
    setQuery("");
    clearFilter();
  }

  const labelName = filterId ? labelsById.get(filterId)?.name : undefined;
  const statusBar = filtering && (
    <ListStatusBar query={query} labelName={labelName} onClear={query ? () => setQuery("") : clearAll} />
  );

  if (filtering && search.loading) {
    return (
      <>
        {statusBar}
        <ListLoading />
      </>
    );
  }

  if (filtering && search.error && messages.length === 0) {
    return (
      <>
        {statusBar}
        <p role="alert" className="px-4 py-6 text-center text-xs text-danger">
          {search.error}
        </p>
      </>
    );
  }

  if (messages.length === 0) {
    return filtering ? (
      <>
        {statusBar}
        <EmptyState
          icon={SearchIcon}
          title="No hay mails que coincidan"
          description={
            query
              ? "Probá con otras palabras o sacá el filtro de etiqueta."
              : "Ningún mail tiene esta etiqueta todavía."
          }
          action={
            <Button type="button" variant="secondary" onClick={clearAll}>
              {query ? "Quitar búsqueda" : "Quitar filtro"}
            </Button>
          }
        />
      </>
    ) : (
      <EmptyState
        icon={InboxIcon}
        title="No hay mensajes"
        description="Todavía no llegó ningún mail a esta casilla."
      />
    );
  }

  return (
    <>
      {statusBar}
      <ul aria-label="Mensajes" className="divide-y divide-gray-200">
        {messages.map((message) => (
          <MessageRow
            key={message.id}
            mailboxId={mailboxId}
            message={message}
            unread={isUnread(message)}
            active={params.messageId === message.id}
            labels={getLabelIds(message.id, message.labelIds)
              .map((id) => labelsById.get(id))
              .filter((label): label is NonNullable<typeof label> => label !== undefined)}
            onOpen={() => setOpenedIds((prev) => new Set(prev).add(message.id))}
          />
        ))}
      </ul>
      {paged.hasMore && (
        <LoadMoreButton loading={paged.loading} error={paged.error} onClick={() => void paged.load()} />
      )}
    </>
  );
}
