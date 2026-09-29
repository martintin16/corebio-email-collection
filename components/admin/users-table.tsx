import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { ShieldIcon } from "@/components/icons";
import { UserRowActions } from "@/components/admin/user-row-actions";
import type { AdminUser, AdminMailbox, UserStatus } from "@/lib/types/admin";

const STATUS_TONE: Record<UserStatus, "success" | "warning" | "neutral"> = {
  active: "success",
  invited: "warning",
  inactive: "neutral",
};

const STATUS_LABEL: Record<UserStatus, string> = {
  active: "activo",
  invited: "invitado",
  inactive: "inactivo",
};

export function UsersTable({
  users,
  mailboxes,
}: {
  users: AdminUser[];
  mailboxes: AdminMailbox[];
}) {
  if (users.length === 0) {
    return (
      <EmptyState
        icon={ShieldIcon}
        title="Todavía no hay usuarios"
        description="Dá de alta a la primera persona para que pueda acceder a una casilla de Corebio."
      />
    );
  }

  return (
    <>
      {/* Mobile/tablet (<md): tarjetas apiladas, una por usuario.
          Se descartó comprimir la tabla en columnas ocultas: con nombre +
          rol + estado + menú de acciones conviviendo en ~360px de ancho,
          los badges y el botón de 3 puntos quedaban demasiado cerca entre
          sí — en una acción destructiva (eliminar usuario) ese apriete es
          justo lo que no queremos. Cada dato en su propia línea, con el
          menú de acciones en una esquina fija, prioriza que nadie toque
          "Eliminar" por error antes que ahorrar espacio vertical. */}
      <ul className="flex flex-col gap-2.5 md:hidden">
        {users.map((user) => (
          <li key={user.id} className="rounded-md border border-gray-200 bg-white p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate font-medium text-gray-900">{user.name}</p>
                <p className="truncate text-xs text-gray-400">{user.email}</p>
              </div>
              <UserRowActions user={user} mailboxes={mailboxes} />
            </div>

            <dl className="mt-3 flex flex-col gap-1.5 border-t border-gray-100 pt-3 text-xs">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-gray-500">Rol</dt>
                <dd>
                  <Badge tone={user.role === "admin" ? "primary" : "neutral"}>{user.role}</Badge>
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-gray-500">Estado</dt>
                <dd>
                  <Badge tone={STATUS_TONE[user.status]}>{STATUS_LABEL[user.status]}</Badge>
                </dd>
              </div>
              <div className="flex items-start justify-between gap-3">
                <dt className="shrink-0 text-gray-500">Casillas</dt>
                <dd className="text-right text-gray-600">
                  {user.mailboxAccess.map((m) => m.email).join(", ") || "Sin casillas"}
                </dd>
              </div>
            </dl>
          </li>
        ))}
      </ul>

      {/* Desktop/tablet ancho (md+): tabla completa, ya hay lugar de sobra
          para todas las columnas sin apretar nada. */}
      <div className="hidden overflow-x-auto rounded-md border border-gray-200 md:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-left text-xs font-medium text-gray-500">
              <th className="px-4 py-2.5">Nombre</th>
              <th className="px-4 py-2.5">Rol</th>
              <th className="px-4 py-2.5">Casillas</th>
              <th className="px-4 py-2.5">Estado</th>
              <th className="px-4 py-2.5">
                <span className="sr-only">Acciones</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-t border-gray-200">
                <td className="px-4 py-3">
                  <p className="font-medium text-gray-900">{user.name}</p>
                  <p className="text-xs text-gray-400">{user.email}</p>
                </td>
                <td className="px-4 py-3">
                  <Badge tone={user.role === "admin" ? "primary" : "neutral"}>{user.role}</Badge>
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {user.mailboxAccess.map((m) => m.email).join(", ") || "—"}
                </td>
                <td className="px-4 py-3">
                  <Badge tone={STATUS_TONE[user.status]}>{STATUS_LABEL[user.status]}</Badge>
                </td>
                <td className="px-4 py-3 text-right">
                  <UserRowActions user={user} mailboxes={mailboxes} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
