"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { getSyncState } from "@/lib/api/sync";
import type { MailboxSyncState } from "@/lib/types/sync";
import { RefreshIcon } from "@/components/icons";
import { cn } from "@/lib/utils";
import { useUnreadTitle } from "@/components/inbox/use-unread-title";

/** Cada cuánto se pregunta si hay novedades (solo con la pestaña visible). */
const SYNC_INTERVAL_MS = 60_000;
/**
 * Mínimo entre dos chequeos automáticos. Al volver a la pestaña se chequea
 * enseguida, pero ir y venir entre pestañas no dispara un pedido por vez, y
 * el chequeo del minuto se saltea si recién hubo uno por volver.
 */
const MIN_GAP_MS = 15_000;

const fingerprint = (state: MailboxSyncState) => `${state.historyId}|${state.scheduledVersion}`;

/**
 * Mantiene la bandeja al día sin recargar, y el botón "Actualizar".
 *
 * Cada minuto (y al volver a la pestaña) pide el estado de la casilla, que es
 * barato. Recién si cambió hace router.refresh(), que vuelve a pedir las
 * listas del layout. router.refresh() no pierde lo que se está escribiendo en
 * Redactar o en una respuesta: solo reemplaza los datos del servidor.
 */
export function MailboxRefresh({ mailboxId }: { mailboxId: string }) {
  const router = useRouter();
  const [isRefreshing, startTransition] = useTransition();
  const [checkingByHand, setCheckingByHand] = useState(false);
  // Última huella vista; null = todavía no hay contra qué comparar.
  const last = useRef<string | null>(null);
  const inFlight = useRef(false);
  const lastCheckAt = useRef(0);
  // No leídos de Recibidos, del mismo chequeo: "(3) Corebio Mail" en la pestaña.
  const [unread, setUnread] = useState<number | null>(null);
  useUnreadTitle(unread);

  const refresh = useCallback(() => startTransition(() => router.refresh()), [router]);

  /** Pide el estado y devuelve si cambió desde la última vez (la primera, nunca). */
  const pollChanged = useCallback(async (): Promise<boolean> => {
    if (inFlight.current) return false;
    inFlight.current = true;
    lastCheckAt.current = Date.now();
    try {
      const state = await getSyncState(mailboxId);
      if (!state) return false;
      setUnread(state.inboxUnread);
      const next = fingerprint(state);
      const changed = last.current !== null && last.current !== next;
      last.current = next;
      return changed;
    } catch {
      // Sin conexión, por ejemplo: se reintenta en la próxima vuelta.
      return false;
    } finally {
      inFlight.current = false;
    }
  }, [mailboxId]);

  useEffect(() => {
    last.current = null;
    const check = async () => {
      if (document.visibilityState !== "visible") return;
      if (Date.now() - lastCheckAt.current < MIN_GAP_MS) return;
      if (await pollChanged()) refresh();
    };
    void check(); // la primera vuelta solo toma la huella de lo que se está viendo
    const timer = setInterval(() => void check(), SYNC_INTERVAL_MS);
    const onVisible = () => void check();
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
    };
  }, [pollChanged, refresh]);

  async function handleClick() {
    setCheckingByHand(true);
    // Primero la huella nueva, así la próxima vuelta no vuelve a refrescar
    // por lo mismo. Se refresca siempre: quien toca "Actualizar" quiere verlo.
    await pollChanged();
    setCheckingByHand(false);
    refresh();
  }

  const busy = isRefreshing || checkingByHand;

  return (
    <button
      type="button"
      onClick={() => void handleClick()}
      disabled={busy}
      aria-label={busy ? "Actualizando la bandeja" : "Actualizar la bandeja"}
      title="Actualizar"
      className="shrink-0 rounded-md p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 disabled:cursor-default disabled:hover:bg-transparent"
    >
      <RefreshIcon className={cn("h-3.5 w-3.5", busy && "animate-spin")} />
    </button>
  );
}
