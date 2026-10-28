import { z } from "zod";

// El campo "Para" se guarda como un solo string de direcciones separadas por
// coma ("a@mail.com, b@mail.com") — el mismo formato del header To de un
// mail, y compatible con todo lo que ya existe (mensajes enviados,
// programados, reenviar) sin cambiarle el tipo a `to: string`.

const emailSchema = z.string().email();

export function isValidEmail(value: string): boolean {
  return emailSchema.safeParse(value).success;
}

// Parte por coma, punto y coma, espacios o saltos de línea — así también
// sirve pegar una lista copiada de una planilla o de otro mail.
export function parseRecipients(value: string): string[] {
  return value
    .split(/[,;\s]+/)
    .map((part) => part.replace(/^<|>$/g, "").trim())
    .filter((part) => part.length > 0);
}

// Quita repetidos sin distinguir mayúsculas (los emails no las distinguen)
// y respeta el orden en que aparecieron.
export function uniqueEmails(emails: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const email of emails) {
    const key = email.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(email);
  }
  return result;
}

export function serializeRecipients(emails: string[]): string {
  return uniqueEmails(emails).join(", ");
}

// Para buscar contactos/grupos sin que importen mayúsculas ni tildes
// ("lucia" encuentra "Lucía").
export function normalizeText(value: string): string {
  return value.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

/**
 * Parte un header de direcciones ("Ana <a@x.com>, "Pérez, Juan" <j@y.com>")
 * por las comas que separan direcciones, no por las que van dentro de un
 * nombre entre comillas o de un <email>. Para mostrar, no para validar.
 */
export function splitAddressList(value: string): string[] {
  const parts: string[] = [];
  let current = "";
  let inQuotes = false;
  let inAngle = false;
  for (const char of value) {
    if (char === '"') inQuotes = !inQuotes;
    else if (char === "<") inAngle = true;
    else if (char === ">") inAngle = false;
    if (char === "," && !inQuotes && !inAngle) {
      if (current.trim()) parts.push(current.trim());
      current = "";
      continue;
    }
    current += char;
  }
  if (current.trim()) parts.push(current.trim());
  return parts;
}
