import { formatFullDate } from "@/lib/format";

// Compartido por los dos page.tsx de Compose (modal y página completa), vía
// lib/compose-prefill.ts: arma el asunto y el cuerpo prellenados al apretar
// "Reenviar" en el detalle de un recibido o de un enviado.

/** Lo que hace falta del mensaje original para citarlo. */
export interface ForwardOriginal {
  /** "Nombre <email>" o solo el email. */
  from: string;
  /** ISO. */
  date: string;
  to: string;
  cc?: string;
  subject: string;
  /**
   * Cuerpo ya listo para el editor. En un recibido llega en texto plano:
   * pasarlo por `plainTextToHtml`. En un enviado ya es HTML sanitizado.
   */
  bodyHtml: string;
}

export function buildForwardSubject(subject: string): string {
  return subject.toLowerCase().startsWith("fwd:") ? subject : `Fwd: ${subject}`;
}

/**
 * Mismo bloque que Gmail: separador y De, Fecha, Asunto, Para (y Cc) del
 * original. Todo lo que viene del mail se escapa: el asunto y los nombres los
 * escribe quien lo mandó, que en un recibido es un tercero.
 */
export function buildForwardBody(original: ForwardOriginal): string {
  const line = (label: string, value: string) => `<p>${label}: ${escapeHtml(value)}</p>`;
  return [
    "<p></p>",
    "<p>---------- Mensaje reenviado ----------</p>",
    line("De", original.from),
    line("Fecha", formatFullDate(original.date)),
    line("Asunto", original.subject),
    line("Para", original.to),
    original.cc ? line("Cc", original.cc) : "",
    "<p></p>",
    original.bodyHtml,
  ].join("");
}

/** Texto plano → párrafos HTML (escapado), respetando los saltos de línea. */
export function plainTextToHtml(text: string): string {
  return text
    .split(/\n{2,}/)
    .map((block) => `<p>${escapeHtml(block).replace(/\n/g, "<br>")}</p>`)
    .join("");
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
