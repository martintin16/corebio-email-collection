"use client";

import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface MailboxSplitViewProps {
  listPanel: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Arma el layout de dos paneles del inbox, con el "drill-down" que pide el
 * responsive spec: en desktop siempre se ven lista y detalle juntos; en
 * mobile/tablet se ve UNO solo por vez.
 *
 * Se decide leyendo los segmentos de la URL después de /inbox/[mailboxId]
 * en vez de un solo param con useParams() — con "Enviados" el detalle
 * vive en /sent/[sentId] (un param llamado sentId, no messageId), así que
 * un solo nombre de param ya no alcanza para cubrir Recibidos + Enviados +
 * Programados a la vez.
 */
export function MailboxSplitView({ listPanel, children }: MailboxSplitViewProps) {
  const pathname = usePathname();
  const rest = (pathname ?? "").split("/").filter(Boolean).slice(2); // después de "inbox", "[mailboxId]"
  // rest = []                  → /inbox/mbx_1            → Recibidos, sin selección
  // rest = [messageId]         → /inbox/mbx_1/msg_1       → Recibidos, mensaje abierto
  // rest = ["sent"]            → /inbox/mbx_1/sent        → Enviados, sin selección
  // rest = ["sent", sentId]    → /inbox/mbx_1/sent/sent_1 → Enviados, mensaje abierto
  // rest = ["scheduled"]       → /inbox/mbx_1/scheduled   → Programados (no tiene detalle por ítem)
  const hasSelection =
    rest.length > 0 && rest[0] !== "scheduled" && !(rest[0] === "sent" && rest.length === 1);

  return (
    <div className="flex h-full">
      <div
        className={cn(
          "w-full flex-col border-r border-gray-200 md:flex md:w-full md:max-w-[280px] md:shrink-0",
          hasSelection ? "hidden" : "flex"
        )}
      >
        {listPanel}
      </div>

      <div className={cn("min-w-0 flex-1 md:block", hasSelection ? "block" : "hidden")}>
        {children}
      </div>
    </div>
  );
}
