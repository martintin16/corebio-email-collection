import { MessageDetailSkeleton } from "@/components/inbox/message-detail-skeleton";

// Antes no existía este archivo, así que al pasar de un mensaje a otro el
// boundary más cercano era el de [mailboxId]/loading.tsx — pensado para
// cuando la casilla entera todavía no cargó (la lista tampoco existe
// todavía), no para navegar entre mensajes de una casilla ya abierta. Ese
// loading.tsx de arriba dibuja de nuevo una lista falsa adentro del panel
// de detalle (por eso el detalle "cargaba como si fuera la sidebar"), y
// como la lista real la renderiza el layout (no {children}), nunca pasaba
// a skeleton. Con este archivo, al pasar de un mensaje a otro Next usa
// este boundary — más específico — en vez del de la casilla.
export default function MessageLoading() {
  return <MessageDetailSkeleton />;
}
