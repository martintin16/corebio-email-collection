"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ForwardIcon } from "@/components/icons";

// Un <Link> envuelto en <Button> anidaría un <button> dentro de un <a> —
// HTML inválido y confunde el foco/click. Un botón real que navega con
// router.push evita eso, mismo resultado (misma intercepting route que
// "Redactar" del sidebar).
//
// Con `mailboxId` reenvía un RECIBIDO de esa casilla; sin él, un ENVIADO
// (Redactar lo busca en las casillas de la persona). Ver lib/compose-prefill.ts.
export function ForwardButton({ messageId, mailboxId }: { messageId: string; mailboxId?: string }) {
  const router = useRouter();
  const query = new URLSearchParams({ forward: messageId });
  if (mailboxId) query.set("mailbox", mailboxId);
  return (
    <Button type="button" variant="secondary" onClick={() => router.push(`/compose?${query}`)}>
      <ForwardIcon className="h-3.5 w-3.5" />
      Reenviar
    </Button>
  );
}
