// Skeleton del PANEL DE DETALLE únicamente (no de la lista) — se usa desde
// loading.tsx en [messageId] y en sent/[sentId]. La lista de la izquierda
// (MailboxListPanel) la renderiza el layout.tsx del mailbox, no {children},
// así que un Suspense/loading acá nunca la toca ni tiene por qué: sigue
// mostrando lo que ya cargó antes, tal como está, mientras el detalle
// nuevo carga al lado.
export function MessageDetailSkeleton() {
  return (
    <div className="flex h-full flex-col p-6" aria-hidden="true">
      <div className="mb-2 h-5 w-2/3 animate-pulse rounded bg-gray-200" />
      <div className="mb-4 h-3 w-2/5 animate-pulse rounded bg-gray-100" />

      <div className="mb-5 border-t border-gray-200" />

      <div className="space-y-2">
        <div className="h-3 w-full animate-pulse rounded bg-gray-100" />
        <div className="h-3 w-full animate-pulse rounded bg-gray-100" />
        <div className="h-3 w-4/5 animate-pulse rounded bg-gray-100" />
        <div className="h-3 w-full animate-pulse rounded bg-gray-100" />
        <div className="h-3 w-3/5 animate-pulse rounded bg-gray-100" />
      </div>

      <div className="mt-8 h-24 w-full animate-pulse rounded-md bg-gray-100" />
    </div>
  );
}
