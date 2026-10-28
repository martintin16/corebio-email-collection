"use client";

import { useEffect, useRef, useState } from "react";
import type { ActionResult } from "@/lib/api/errors";
import type { MessagePage } from "@/lib/types/mail";

/**
 * Lista con "Cargar más" sobre la primera página que trae el servidor.
 *
 * La primera página se vuelve a pedir sola (refresco automático, enviar,
 * etc.) y llega como `firstPage` nuevo; lo que se cargó con "Cargar más" se
 * conserva. Si un mail nuevo empuja al último de la primera página a la
 * segunda, no se pierde: lo que se dejó de ver en la primera pasa adelante
 * de lo cargado después.
 */
export function usePagedList<T extends { id: string }>(
  firstPage: MessagePage<T>,
  loadMore: (pageToken: string) => Promise<ActionResult<MessagePage<T>>>
) {
  // Lo cargado con "Cargar más" (sin lo que ya está en la primera página).
  const [more, setMore] = useState<T[]>([]);
  // undefined = todavía no se cargó nada: manda el token de la primera página.
  const [moreToken, setMoreToken] = useState<string | null | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const previousFirst = useRef(firstPage);

  useEffect(() => {
    const before = previousFirst.current;
    previousFirst.current = firstPage;
    if (before === firstPage) return;
    setMore((current) => {
      if (current.length === 0) return current;
      const inFirst = new Set(firstPage.items.map((item) => item.id));
      const carried = [...before.items, ...current].filter((item) => !inFirst.has(item.id));
      return dedupe(carried);
    });
  }, [firstPage]);

  const nextToken = moreToken === undefined ? firstPage.nextPageToken : moreToken;

  async function load() {
    if (!nextToken || loading) return;
    setLoading(true);
    setError(null);
    try {
      const result = await loadMore(nextToken);
      if (!result.ok) {
        setError(result.error.message);
        return;
      }
      const inFirst = new Set(firstPage.items.map((item) => item.id));
      setMore((current) => dedupe([...current, ...result.data.items]).filter((i) => !inFirst.has(i.id)));
      setMoreToken(result.data.nextPageToken);
    } catch {
      setError("No pudimos cargar más mensajes. Intentá de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return {
    items: more.length === 0 ? firstPage.items : [...firstPage.items, ...more],
    hasMore: nextToken !== null,
    loading,
    error,
    load,
  };
}

function dedupe<T extends { id: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  return items.filter((item) => (seen.has(item.id) ? false : (seen.add(item.id), true)));
}
