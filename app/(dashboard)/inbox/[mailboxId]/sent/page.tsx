import { EmptyState } from "@/components/ui/empty-state";
import { SentIcon } from "@/components/icons";

// Análogo a inbox/[mailboxId]/page.tsx ("Elegí un mensaje"), pero para la
// pestaña Enviados: se ve mientras no hay ningún mensaje enviado abierto.
export default function SentPage() {
  return (
    <div className="flex h-full items-center justify-center">
      <EmptyState
        icon={SentIcon}
        title="Elegí un mensaje enviado"
        description="Seleccioná un mail de la lista para verlo acá."
      />
    </div>
  );
}
