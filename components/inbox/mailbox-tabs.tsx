"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface MailboxTabsProps {
  mailboxId: string;
  scheduledCount: number;
}

// Pestañas "Recibidos" / "Enviados" / "Programados" dentro del panel de
// lista de cada casilla. El segmento que sigue al mailboxId en la URL dice
// en qué pestaña se está: nada o un messageId → Recibidos, "sent" (con o
// sin [sentId] adentro) → Enviados, "scheduled" → Programados.
export function MailboxTabs({ mailboxId, scheduledCount }: MailboxTabsProps) {
  const pathname = usePathname();
  const segments = (pathname ?? "").split("/").filter(Boolean);
  // segments = ["inbox", mailboxId, ...resto]
  const sub = segments[2];
  const active: "inbox" | "sent" | "scheduled" =
    sub === "sent" ? "sent" : sub === "scheduled" ? "scheduled" : "inbox";

  function tabClass(tab: typeof active) {
    return cn(
      "flex-1 border-b-2 px-2 py-2 text-center text-xs font-medium transition-colors",
      active === tab
        ? "border-primary-600 text-primary-700"
        : "border-transparent text-gray-500 hover:text-gray-700"
    );
  }

  return (
    <div role="tablist" aria-label="Vista de la casilla" className="flex border-b border-gray-200">
      <Link href={`/inbox/${mailboxId}`} role="tab" aria-selected={active === "inbox"} className={tabClass("inbox")}>
        Recibidos
      </Link>
      <Link
        href={`/inbox/${mailboxId}/sent`}
        role="tab"
        aria-selected={active === "sent"}
        className={tabClass("sent")}
      >
        Enviados
      </Link>
      <Link
        href={`/inbox/${mailboxId}/scheduled`}
        role="tab"
        aria-selected={active === "scheduled"}
        className={tabClass("scheduled")}
      >
        Programados{scheduledCount > 0 ? ` (${scheduledCount})` : ""}
      </Link>
    </div>
  );
}
