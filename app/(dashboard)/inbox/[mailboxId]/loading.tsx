/**
 * Se muestra en el panel de detalle (la lista ya está al lado, la pone el
 * layout): por eso va vacío. La lista fantasma de la primera carga está en
 * app/(dashboard)/inbox/loading.tsx.
 */
export default function MailboxDetailLoading() {
  return <div className="h-full" aria-busy="true" />;
}
