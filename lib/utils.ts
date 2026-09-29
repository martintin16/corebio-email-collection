import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combina clases condicionalmente (clsx) y resuelve conflictos entre
 * utilidades de Tailwind que pisan la misma propiedad (tailwind-merge) —
 * necesario porque Button/Input/etc. aceptan un `className` externo que
 * puede pisar clases de la base (ej. una altura distinta a la default).
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * El editor de texto enriquecido (Tiptap) guarda el mensaje como HTML — un
 * campo "vacío" en los hechos sigue siendo un string no-vacío como
 * "<p></p>". Esto extrae el texto plano para poder validar "¿escribió
 * algo?" contra lo que la persona realmente ve, no contra el markup.
 * No es un sanitizador de seguridad (eso se hace en el backend antes de
 * mandar el mail) — es solo para la validación del lado del cliente.
 */
export function htmlToPlainText(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}
