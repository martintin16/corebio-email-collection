import type { MailLabel } from "@/lib/types/label";
import { getLabelColors } from "@/lib/label-colors";

// Pill chico de solo lectura: el punto lleva el color real de la etiqueta
// en Gmail y el fondo es ese mismo color muy suave, con texto siempre
// oscuro para que se lea sea cual sea el color. Asignar/sacar etiquetas no
// se hace tocando el chip sino desde LabelPicker.
export function LabelChip({ label }: { label: Pick<MailLabel, "name" | "color"> }) {
  const colors = getLabelColors(label);
  return (
    <span
      className="inline-flex max-w-full items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium text-gray-700"
      style={{ backgroundColor: colors.background }}
    >
      <span
        aria-hidden="true"
        className="h-1.5 w-1.5 shrink-0 rounded-full"
        style={{ backgroundColor: colors.dot }}
      />
      <span className="truncate">{label.name}</span>
    </span>
  );
}
