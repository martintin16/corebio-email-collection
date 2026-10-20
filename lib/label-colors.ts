import type { MailLabel } from "@/lib/types/label";

// Si Gmail no le definió color a una etiqueta, se le asigna uno de esta
// paleta fija — siempre el mismo para la misma etiqueta (se elige por un
// hash del nombre, no al azar), así no cambia de color entre visitas.
const FALLBACK_PALETTE = ["#0F766E", "#92400E", "#5B21B6", "#1E40AF", "#991B1B"];

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

function hashName(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  }
  return hash;
}

export interface LabelColors {
  // Punto de color sólido — el color "real" de la etiqueta.
  dot: string;
  // Fondo del chip: el mismo color, muy suave (12 % de opacidad) para que
  // el texto oscuro siga siendo legible sea cual sea el color de Gmail.
  background: string;
}

export function getLabelColors(label: Pick<MailLabel, "name" | "color">): LabelColors {
  const base =
    label.color && HEX_COLOR.test(label.color)
      ? label.color
      : FALLBACK_PALETTE[hashName(label.name) % FALLBACK_PALETTE.length]!;
  return { dot: base, background: `${base}1F` };
}
