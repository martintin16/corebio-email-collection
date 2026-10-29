"use client";

import { useEffect, useRef, useState } from "react";
import type { ActionResult } from "@/lib/api/errors";
import type { MessagePage } from "@/lib/types/mail";

/**
 * Primera página de una búsqueda o filtro (la pide el navegador, no el layout).
 *
 * - `key` distinto (otra búsqueda u otra etiqueta): se vacía y se pide de nuevo
 *   (`loading` = true mientras tanto).
 * - `refreshSignal` distinto (el refresco de cada minuto trajo la primera página
 *   normal de nuevo): se repite la misma búsqueda, pero lo que ya se ve queda a
 *   la vista hasta que llega lo nuevo (sin parpadeos).
 */
export function useSearchPage<T>({
  active,
  key,
  refreshSignal,
  fetchPage,
}: {
  active: boolean;
  key: string;
  refreshSignal: unknown;
  fetchPage: () => Promise<ActionResult<MessagePage<T>>>;
}) {
  const [page, setPage] = useState<MessagePage<T> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fetchRef = useRef(fetchPage);
  fetchRef.current = fetchPage;
  const lastKey = useRef<string | null>(null);

  useEffect(() => {
    if (!active) {
      setPage(null);
      setError(null);
      setLoading(false);
      lastKey.current = null;
      return;
    }
    const newSearch = lastKey.current !== key;
    lastKey.current = key;
    if (newSearch) {
      setPage(null);
      setLoading(true);
    }
    setError(null);
    let cancelled = false;
    fetchRef
      .current()
      .then((result) => {
        if (cancelled) return;
        if (result.ok) setPage(result.data);
        else setError(result.error.message);
      })
      .catch(() => {
        if (!cancelled) setError("No pudimos buscar. Intentá de nuevo.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [active, key, refreshSignal]);

  return { page, loading, error };
}
