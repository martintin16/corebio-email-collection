"use client";

import { CheckIcon } from "@/components/icons";
import { useMailboxLabels } from "@/components/inbox/mailbox-labels-provider";
import { getLabelColors } from "@/lib/label-colors";
import { cn } from "@/lib/utils";

// Fila de chips arriba de la lista de Recibidos para filtrar por etiqueta.
// Una etiqueta por vez: la lista trae de Gmail todos los mails de esa
// etiqueta (no solo los ya cargados) y se combina con la búsqueda. Tocar la
// elegida, o "Todas", saca el filtro. No se muestra si la casilla no tiene
// etiquetas, ni mientras todavía cargan.
export function InboxLabelFilter() {
  const { labels, status, filterId, toggleFilter, clearFilter } = useMailboxLabels();

  if (status !== "loaded" || labels.length === 0) return null;

  const noFilter = filterId === null;

  return (
    // Una sola línea con scroll horizontal: con muchas etiquetas, en varias
    // líneas le comían el lugar a la lista (este encabezado no scrollea).
    <div
      role="group"
      aria-label="Filtrar por etiqueta"
      className="flex shrink-0 gap-1.5 overflow-x-auto border-b border-gray-200 px-4 py-2.5 [scrollbar-width:thin]"
    >
      <button
        type="button"
        onClick={clearFilter}
        aria-pressed={noFilter}
        className={cn(
          "shrink-0 whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11px] font-medium transition-colors",
          noFilter ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
        )}
      >
        Todas
      </button>
      {labels.map((label) => {
        const selected = filterId === label.id;
        const colors = getLabelColors(label);
        return (
          <button
            key={label.id}
            type="button"
            onClick={() => toggleFilter(label.id)}
            aria-pressed={selected}
            style={{ backgroundColor: colors.background }}
            className={cn(
              "inline-flex max-w-[160px] shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-medium text-gray-700 transition-shadow",
              selected ? "ring-2 ring-gray-800" : "hover:ring-1 hover:ring-gray-300"
            )}
          >
            {selected ? (
              <CheckIcon className="h-2.5 w-2.5 shrink-0" />
            ) : (
              <span
                aria-hidden="true"
                className="h-1.5 w-1.5 shrink-0 rounded-full"
                style={{ backgroundColor: colors.dot }}
              />
            )}
            <span className="truncate">{label.name}</span>
          </button>
        );
      })}
    </div>
  );
}
