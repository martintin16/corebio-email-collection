"use client";

/**
 * Línea arriba de los resultados: qué se está mostrando ("Resultados de
 * "banco" en Bancos") y cómo volver a la lista normal.
 */
export function ListStatusBar({
  query,
  labelName,
  onClear,
}: {
  query: string;
  labelName?: string;
  onClear: () => void;
}) {
  const what = query ? `Resultados de "${query}"` : "Mensajes";
  return (
    <p role="status" className="flex flex-wrap items-center gap-x-1 border-b border-gray-200 px-4 py-2 text-[11px] text-gray-400">
      <span className="min-w-0 truncate">
        {what}
        {labelName ? ` en ${labelName}` : ""}
      </span>
      ·
      <button type="button" onClick={onClear} className="text-primary-700 hover:underline">
        {query ? "Quitar búsqueda" : "Quitar filtro"}
      </button>
    </p>
  );
}
