import { MessageDetailSkeleton } from "@/components/inbox/message-detail-skeleton";

// Mismo motivo que [messageId]/loading.tsx — sin este archivo, pasar de un
// enviado a otro caía en el loading.tsx de [mailboxId], que dibuja una
// lista falsa adentro del panel de detalle en vez de un skeleton del
// detalle en sí.
export default function SentMessageLoading() {
  return <MessageDetailSkeleton />;
}
