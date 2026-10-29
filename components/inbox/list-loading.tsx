/** Mientras llega la primera página de una búsqueda o filtro. */
export function ListLoading({ label = "Buscando…" }: { label?: string }) {
  return (
    <div role="status" className="flex items-center justify-center gap-2 px-4 py-8 text-xs text-gray-500">
      <span
        aria-hidden="true"
        className="h-4 w-4 animate-spin rounded-full border-2 border-gray-200 border-t-primary-700"
      />
      {label}
    </div>
  );
}
