import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { PlugIcon } from "@/components/icons";
import { MailboxRowActions } from "@/components/admin/mailbox-row-actions";
import type { AdminMailbox, MailboxConnectionStatus } from "@/lib/types/admin";

const STATUS_TONE: Record<MailboxConnectionStatus, "success" | "danger"> = {
  connected: "success",
  needs_reconnect: "danger",
};

const STATUS_LABEL: Record<MailboxConnectionStatus, string> = {
  connected: "conectada",
  needs_reconnect: "reconectar",
};

export function MailboxesTable({ mailboxes }: { mailboxes: AdminMailbox[] }) {
  if (mailboxes.length === 0) {
    return (
      <EmptyState
        icon={PlugIcon}
        title="Todavía no conectaste ninguna casilla"
        description="Conectá la primera casilla de Corebio para poder empezar a asignarle acceso a los usuarios."
      />
    );
  }

  return (
    <>
      {/* Mismo criterio que en UsersTable: en <md, tarjetas apiladas en vez
          de columnas ocultas, para que "Desconectar casilla" (destructiva)
          nunca quede a un dedo de distancia de otro elemento tocable. */}
      <ul className="flex flex-col gap-2.5 md:hidden">
        {mailboxes.map((mailbox) => (
          <li key={mailbox.id} className="rounded-md border border-gray-200 bg-white p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate font-medium text-gray-900">{mailbox.displayName}</p>
                <p className="truncate text-xs text-gray-400">{mailbox.email}</p>
              </div>
              <MailboxRowActions mailbox={mailbox} />
            </div>

            <dl className="mt-3 flex flex-col gap-1.5 border-t border-gray-100 pt-3 text-xs">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-gray-500">Estado</dt>
                <dd>
                  <Badge tone={STATUS_TONE[mailbox.status]}>{STATUS_LABEL[mailbox.status]}</Badge>
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-gray-500">Usuarios</dt>
                <dd className="text-gray-600">
                  {mailbox.connectedUsersCount} persona{mailbox.connectedUsersCount === 1 ? "" : "s"}
                </dd>
              </div>
            </dl>
          </li>
        ))}
      </ul>

      <div className="hidden overflow-x-auto rounded-md border border-gray-200 md:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-left text-xs font-medium text-gray-500">
              <th className="px-4 py-2.5">Casilla</th>
              <th className="px-4 py-2.5">Usuarios</th>
              <th className="px-4 py-2.5">Estado</th>
              <th className="px-4 py-2.5">
                <span className="sr-only">Acciones</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {mailboxes.map((mailbox) => (
              <tr key={mailbox.id} className="border-t border-gray-200">
                <td className="px-4 py-3">
                  <p className="font-medium text-gray-900">{mailbox.displayName}</p>
                  <p className="text-xs text-gray-400">{mailbox.email}</p>
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {mailbox.connectedUsersCount} persona{mailbox.connectedUsersCount === 1 ? "" : "s"}
                </td>
                <td className="px-4 py-3">
                  <Badge tone={STATUS_TONE[mailbox.status]}>{STATUS_LABEL[mailbox.status]}</Badge>
                </td>
                <td className="px-4 py-3 text-right">
                  <MailboxRowActions mailbox={mailbox} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
