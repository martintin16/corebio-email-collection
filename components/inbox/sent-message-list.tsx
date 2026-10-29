"use client";

import { useParams, useRouter } from "next/navigation";
import type { MessagePage, SentMessageSummary } from "@/lib/types/mail";
import { listSentMessages } from "@/lib/api/messages";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { SearchIcon, SentIcon } from "@/components/icons";
import { useListQuery } from "@/components/inbox/list-query-provider";
import { usePagedList } from "@/components/inbox/use-paged-list";
import { useSearchPage } from "@/components/inbox/use-search-page";
import { LoadMoreButton } from "@/components/inbox/load-more-button";
import { ListStatusBar } from "@/components/inbox/list-status-bar";
import { ListLoading } from "@/components/inbox/list-loading";
import { SentMessageRow } from "@/components/inbox/sent-message-row";

interface SentMessageListProps {
  mailboxId: string;
  firstPage: MessagePage<SentMessageSummary>;
  /** Con permiso de envío, la lista vacía ofrece "Redactar" desde esta casilla. */
  canSend?: boolean;
}

const EMPTY_PAGE: MessagePage<SentMessageSummary> = { items: [], nextPageToken: null };

// Mismo patrón que MessageList (Recibidos): primera página del layout, o con
// búsqueda, los resultados que se piden a Gmail. Sin etiquetas.
export function SentMessageList({ mailboxId, firstPage, canSend = false }: SentMessageListProps) {
  const params = useParams<{ sentId?: string }>();
  const router = useRouter();
  const { query, setQuery } = useListQuery();

  const searching = query !== "";
  const search = useSearchPage({
    active: searching,
    key: query,
    refreshSignal: firstPage,
    fetchPage: () => listSentMessages(mailboxId, { q: query }),
  });
  const paged = usePagedList(
    searching ? (search.page ?? EMPTY_PAGE) : firstPage,
    (pageToken) => listSentMessages(mailboxId, { q: query || undefined, pageToken }),
    query
  );
  const messages = paged.items;
  const statusBar = searching && <ListStatusBar query={query} onClear={() => setQuery("")} />;

  if (searching && search.loading) {
    return (
      <>
        {statusBar}
        <ListLoading />
      </>
    );
  }

  if (searching && search.error && messages.length === 0) {
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
    return searching ? (
      <>
        {statusBar}
        <EmptyState
          icon={SearchIcon}
          title="No hay mails que coincidan"
          description="Probá con otras palabras."
          action={
            <Button type="button" variant="secondary" onClick={() => setQuery("")}>
              Quitar búsqueda
            </Button>
          }
        />
      </>
    ) : (
      <EmptyState
        icon={SentIcon}
        title="No hay mensajes enviados"
        description="Los mails enviados desde esta casilla van a aparecer acá."
        action={
          canSend ? (
            // Misma intercepting route que "Redactar" del menú, con esta casilla en "De".
            <Button type="button" variant="secondary" onClick={() => router.push(`/compose?mailbox=${mailboxId}`)}>
              Redactar
            </Button>
          ) : undefined
        }
      />
    );
  }

  return (
    <>
      {statusBar}
      <ul aria-label="Mensajes enviados" className="divide-y divide-gray-200">
        {messages.map((message) => (
          <SentMessageRow
            key={message.id}
            mailboxId={mailboxId}
            message={message}
            active={params.sentId === message.id}
          />
        ))}
      </ul>
      {paged.hasMore && (
        <LoadMoreButton loading={paged.loading} error={paged.error} onClick={() => void paged.load()} />
      )}
    </>
  );
}
