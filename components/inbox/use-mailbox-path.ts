"use client";

import { useRef } from "react";
import { usePathname } from "next/navigation";

export type MailboxTab = "inbox" | "sent" | "scheduled";

/**
 * Lo que viene después de /inbox/[mailboxId] en la URL (["sent", id], [messageId]…)
 * y la pestaña que corresponde.
 *
 * Redactar, Reenviar y Editar se abren como modal sobre la bandeja, pero la
 * URL pasa a /compose: si se leyera la URL tal cual, la lista de atrás saltaría
 * a "Recibidos". Mientras la URL no es de la bandeja, se sigue mostrando lo
 * último que sí lo era.
 */
export function useMailboxPath(): { rest: string[]; tab: MailboxTab } {
  const pathname = usePathname() ?? "";
  const segments = pathname.split("/").filter(Boolean);
  const last = useRef<string[]>([]);
  if (segments[0] === "inbox" && segments.length >= 2) {
    last.current = segments.slice(2);
  }
  const rest = last.current;
  const tab: MailboxTab = rest[0] === "sent" ? "sent" : rest[0] === "scheduled" ? "scheduled" : "inbox";
  return { rest, tab };
}
