import { EmptyState } from "@/components/ui/empty-state";
import { ClockIcon } from "@/components/icons";

// Análogo a inbox/[mailboxId]/page.tsx ("Elegí un mensaje") pero para la
// pestaña Programados: acá no hay un "detalle" por ítem — las acciones
// (Editar/Cancelar) ya están en la fila de la lista, así que el panel
// derecho solo explica eso en vez de quedar vacío sin motivo.
export default function ScheduledPage() {
  return (
    <div className="flex h-full items-center justify-center">
      <EmptyState
        icon={ClockIcon}
        title="Envíos programados"
        description="Editá o cancelá un envío desde las acciones (⋮) de la lista."
      />
    </div>
  );
}
