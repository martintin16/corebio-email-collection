"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { getLabelsForMailbox } from "@/lib/api/messages";
import type { MailLabel } from "@/lib/types/label";

type LabelsStatus = "loading" | "loaded" | "error";

interface MailboxLabelsContextValue {
  labels: MailLabel[];
  labelsById: Map<string, MailLabel>;
  status: LabelsStatus;
  reload: () => void;
  // Etiquetas de un mensaje: el cambio local (si la persona ya asignó/sacó
  // alguna) tiene prioridad sobre lo que vino del servidor.
  getLabelIds: (messageId: string, fallback: string[]) => string[];
  setLabelIds: (messageId: string, ids: string[]) => void;
  // Filtro de Recibidos: la etiqueta elegida (una por vez; la lista la pide a
  // Gmail, ver MessageList). null = sin filtro.
  filterId: string | null;
  toggleFilter: (labelId: string) => void;
  clearFilter: () => void;
}

const MailboxLabelsContext = createContext<MailboxLabelsContextValue | null>(null);

export function useMailboxLabels(): MailboxLabelsContextValue {
  const ctx = useContext(MailboxLabelsContext);
  if (!ctx) {
    throw new Error("useMailboxLabels() tiene que usarse dentro de <MailboxLabelsProvider>");
  }
  return ctx;
}

// Vive en el layout de cada casilla (no se desmonta al pasar de un mensaje
// a otro), así la lista de la izquierda y el detalle de la derecha —que son
// dos árboles distintos— comparten las etiquetas y el filtro sin pedirlos
// dos veces. El layout lo monta con key={mailboxId}: al cambiar de casilla
// se vuelve a empezar de cero (otro catálogo de etiquetas, otro filtro).
export function MailboxLabelsProvider({
  mailboxId,
  children,
}: {
  mailboxId: string;
  children: ReactNode;
}) {
  const [labels, setLabels] = useState<MailLabel[]>([]);
  const [status, setStatus] = useState<LabelsStatus>("loading");
  const [reloadToken, setReloadToken] = useState(0);
  const [overrides, setOverrides] = useState<Record<string, string[]>>({});
  const [filterId, setFilterId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    getLabelsForMailbox(mailboxId)
      .then((data) => {
        if (cancelled) return;
        setLabels(data);
        setStatus("loaded");
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, [mailboxId, reloadToken]);

  const reload = useCallback(() => setReloadToken((n) => n + 1), []);

  const getLabelIds = useCallback(
    (messageId: string, fallback: string[]) => overrides[messageId] ?? fallback,
    [overrides]
  );

  const setLabelIds = useCallback((messageId: string, ids: string[]) => {
    setOverrides((prev) => ({ ...prev, [messageId]: ids }));
  }, []);

  // Tocar otra etiqueta cambia el filtro; tocar la elegida lo saca.
  const toggleFilter = useCallback((labelId: string) => {
    setFilterId((prev) => (prev === labelId ? null : labelId));
  }, []);

  const clearFilter = useCallback(() => setFilterId(null), []);

  const labelsById = useMemo(() => new Map(labels.map((l) => [l.id, l] as const)), [labels]);

  const value = useMemo<MailboxLabelsContextValue>(
    () => ({
      labels,
      labelsById,
      status,
      reload,
      getLabelIds,
      setLabelIds,
      filterId,
      toggleFilter,
      clearFilter,
    }),
    [labels, labelsById, status, reload, getLabelIds, setLabelIds, filterId, toggleFilter, clearFilter]
  );

  return <MailboxLabelsContext.Provider value={value}>{children}</MailboxLabelsContext.Provider>;
}
