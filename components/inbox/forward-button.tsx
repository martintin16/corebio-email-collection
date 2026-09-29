"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ForwardIcon } from "@/components/icons";

// Un <Link> envuelto en <Button> anidaría un <button> dentro de un <a> —
// HTML inválido y confunde el foco/click. Un botón real que navega con
// router.push evita eso, mismo resultado (misma intercepting route que
// "Redactar" del sidebar).
export function ForwardButton({ sentId }: { sentId: string }) {
  const router = useRouter();
  return (
    <Button type="button" variant="secondary" onClick={() => router.push(`/compose?forward=${sentId}`)}>
      <ForwardIcon className="h-3.5 w-3.5" />
      Reenviar
    </Button>
  );
}
