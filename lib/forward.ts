import type { SentMessageDetail } from "@/lib/types/mail";

// Compartido por los dos page.tsx de Compose (modal y página completa) —
// arma el asunto/cuerpo prellenados al apretar "Reenviar" desde el detalle
// de un mensaje enviado.

export function buildForwardSubject(subject: string): string {
  return subject.toLowerCase().startsWith("fwd:") ? subject : `Fwd: ${subject}`;
}

export function buildForwardBody(message: SentMessageDetail): string {
  return [
    "<p></p>",
    "<p>---------- Mensaje reenviado ----------</p>",
    `<p>Para: ${message.to}</p>`,
    `<p>Asunto: ${message.subject}</p>`,
    message.body,
  ].join("");
}
