import Link from "next/link";
import { EmptyState } from "@/components/ui/empty-state";
import { AlertIcon, PlugIcon } from "@/components/icons";

/**
 * Lo que se muestra en vez de la bandeja cuando no se puede leer la casilla:
 * solo tiene permiso de envío, la casilla perdió la conexión con Google, o
 * el backend falló. Es un Server Component: el mensaje llega tal cual.
 */
export function MailboxUnavailable({
  reason,
  message,
}: {
  reason: "send_only" | "reconnect" | "error";
  message?: string;
}) {
  if (reason === "send_only") {
    return (
      <EmptyState
        icon={AlertIcon}
        title="Solo podés enviar desde esta casilla"
        description="No tenés permiso para ver sus mensajes. Podés redactar un mail nuevo desde ella."
        action={
          <Link
            href="/compose"
            className="rounded-md border border-gray-300 px-3 py-1.5 text-xs text-gray-700 transition-colors hover:bg-gray-50"
          >
            Redactar
          </Link>
        }
      />
    );
  }
  if (reason === "reconnect") {
    return (
      <EmptyState
        icon={PlugIcon}
        title="La casilla necesita reconectarse"
        description="Google ya no acepta el permiso de esta casilla. Pedile a un administrador que la reconecte desde Admin → Casillas."
      />
    );
  }
  return (
    <EmptyState
      icon={AlertIcon}
      title="No pudimos cargar la casilla"
      description={message ?? "Intentá de nuevo en un rato."}
    />
  );
}
