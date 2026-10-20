"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast/toast-context";

/** Lo que significa cada `?connectionError=` que devuelve el backend al volver de Google. */
const ERROR_MESSAGES: Record<string, string> = {
  access_denied: "Se canceló la autorización en Google. La casilla no se conectó.",
  wrong_account:
    "Se autorizó con otra cuenta de Google. Hay que entrar con la cuenta de la casilla.",
  missing_scopes:
    "Faltó tildar algún permiso en Google (Gmail o Drive). Volvé a intentarlo y aceptá todos.",
  no_refresh_token: "Google no entregó el permiso permanente. Volvé a intentarlo.",
  expired_state: "Pasó demasiado tiempo desde que se pidió la conexión. Volvé a intentarlo.",
  invalid_state: "El enlace de Google no es válido. Volvé a intentarlo desde acá.",
  mailbox_not_found: "La casilla ya no existe.",
};
const FALLBACK = "No pudimos conectar la casilla con Google. Intentá de nuevo.";

/**
 * Aviso al volver de Google (`?connected=<id>` o `?connectionError=<código>`):
 * muestra el toast una sola vez y limpia la URL para que no se repita al recargar.
 */
export function ConnectionResultNotice({
  connected,
  connectionError,
}: {
  connected?: string;
  connectionError?: string;
}) {
  const { showToast } = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const shown = useRef(false);

  useEffect(() => {
    if (shown.current || (!connected && !connectionError)) return;
    shown.current = true;
    if (connected) showToast("success", "La casilla quedó conectada con Google.");
    else showToast("error", ERROR_MESSAGES[connectionError ?? ""] ?? FALLBACK);
    router.replace(pathname);
  }, [connected, connectionError, pathname, router, showToast]);

  return null;
}
