"use client";

import { useRouter } from "next/navigation";
import { useMailboxPath } from "@/components/inbox/use-mailbox-path";
import type { Mailbox } from "@/lib/types/mail";

interface MailboxSwitcherProps {
  mailboxes: Mailbox[];
  current: Mailbox;
}

export function MailboxSwitcher({ mailboxes, current }: MailboxSwitcherProps) {
  const router = useRouter();
  // Al cambiar de casilla se queda en la misma pestaña (Enviados → Enviados).
  const { tab } = useMailboxPath();
  const tabPath = tab === "inbox" ? "" : `/${tab}`;

  // Con una sola casilla asignada no tiene sentido mostrar un selector
  // que no hace nada — es solo texto.
  if (mailboxes.length <= 1) {
    return <p className="truncate text-xs text-gray-400">{current.email}</p>;
  }

  return (
    <select
      value={current.id}
      onChange={(e) => router.push(`/inbox/${e.target.value}${tabPath}`)}
      aria-label="Cambiar de casilla"
      className="w-full truncate border-none bg-transparent p-0 text-xs text-gray-500 outline-none"
    >
      {mailboxes.map((mailbox) => (
        <option key={mailbox.id} value={mailbox.id}>
          {mailbox.email}
        </option>
      ))}
    </select>
  );
}
