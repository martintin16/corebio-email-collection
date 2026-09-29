import type { Metadata } from "next";
import { getUsers, getMailboxConnections } from "@/lib/api/admin";
import { UsersTable } from "@/components/admin/users-table";
import { NewUserButton } from "@/components/admin/new-user-button";

export const metadata: Metadata = {
  title: "Usuarios",
};

export default async function AdminUsersPage() {
  // Se piden en paralelo: la tabla necesita los usuarios, el formulario de
  // alta necesita la lista de casillas para armar los checkboxes de permisos.
  const [users, mailboxes] = await Promise.all([getUsers(), getMailboxConnections()]);

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-lg font-medium text-gray-900">Usuarios</p>
          <p className="text-xs text-gray-500">{users.length} personas con acceso</p>
        </div>
        <NewUserButton mailboxes={mailboxes} />
      </div>

      <UsersTable users={users} mailboxes={mailboxes} />
    </div>
  );
}
