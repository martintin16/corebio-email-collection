import { EmptyState } from "@/components/ui/empty-state";
import { InboxIcon } from "@/components/icons";

export default function MailboxPage() {
  return (
    <div className="flex h-full items-center justify-center">
      <EmptyState
        icon={InboxIcon}
        title="Elegí un mensaje"
        description="Seleccioná un mail de la lista para verlo acá."
      />
    </div>
  );
}
