"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useMailboxPath } from "@/components/inbox/use-mailbox-path";

interface ListQueryContextValue {
  /** Búsqueda activa de la pestaña (la de Gmail). "" = sin búsqueda. */
  query: string;
  setQuery: (query: string) => void;
}

const ListQueryContext = createContext<ListQueryContextValue | null>(null);

export function useListQuery(): ListQueryContextValue {
  const ctx = useContext(ListQueryContext);
  if (!ctx) throw new Error("useListQuery() tiene que usarse dentro de <ListQueryProvider>");
  return ctx;
}

/**
 * La búsqueda de la lista de la casilla. Vive en el layout de la casilla (lo
 * monta con key={mailboxId}: otra casilla, sin búsqueda) y la comparten el
 * buscador (MailboxSearch) y las listas. Cambiar de pestaña la limpia: cada
 * pestaña busca en lo suyo.
 */
export function ListQueryProvider({ children }: { children: ReactNode }) {
  const [query, setQuery] = useState("");
  const { tab } = useMailboxPath();
  useEffect(() => setQuery(""), [tab]);
  return <ListQueryContext.Provider value={{ query, setQuery }}>{children}</ListQueryContext.Provider>;
}
