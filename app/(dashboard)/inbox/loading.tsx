function SkeletonRow() {
  return (
    <div className="space-y-1.5 px-4 py-3">
      <div className="h-2.5 w-2/3 animate-pulse rounded bg-gray-200" />
      <div className="h-2.5 w-1/2 animate-pulse rounded bg-gray-100" />
    </div>
  );
}

/**
 * Mientras se carga una casilla (o se cambia de casilla), todavía no hay
 * lista real: se muestra una lista "fantasma" en su lugar.
 *
 * Va acá, en /inbox, y no en /inbox/[mailboxId]: un loading.tsx se muestra
 * DENTRO del layout de su carpeta. En [mailboxId] quedaba en el panel de
 * detalle, al lado de la lista real, y se veían dos listas.
 */
export default function InboxLoading() {
  return (
    <div className="flex h-full">
      <div className="w-full max-w-[280px] shrink-0 divide-y divide-gray-200 border-r border-gray-200">
        {Array.from({ length: 5 }).map((_, i) => (
          <SkeletonRow key={i} />
        ))}
      </div>
      <div className="flex-1" />
    </div>
  );
}
