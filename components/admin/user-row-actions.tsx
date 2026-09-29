"use client";

import { useState } from "react";
import { ActionsMenu, ActionsMenuItem } from "@/components/ui/actions-menu";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EditPermissionsDialog } from "@/components/admin/edit-permissions-dialog";
import { useToast } from "@/components/ui/toast/toast-context";
import { deactivateUser, deleteUser, resendInvite } from "@/lib/actions/users";
import { ShieldIcon, ForwardIcon, UserOffIcon, TrashIcon } from "@/components/icons";
import type { AdminUser, AdminMailbox } from "@/lib/types/admin";

export function UserRowActions({
  user,
  mailboxes,
}: {
  user: AdminUser;
  mailboxes: AdminMailbox[];
}) {
  const { showToast } = useToast();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [pending, setPending] = useState<"deactivate" | "delete" | "resend" | null>(null);

  async function handleDeactivate() {
    setPending("deactivate");
    await deactivateUser(user.id);
    setPending(null);
    showToast("success", `${user.name} fue desactivado.`);
  }

  async function handleResend() {
    setPending("resend");
    await resendInvite(user.id);
    setPending(null);
    showToast("success", `Invitación reenviada a ${user.email}.`);
  }

  async function handleDelete() {
    setPending("delete");
    const result = await deleteUser(user.id);
    setPending(null);
    setConfirmOpen(false);
    if (result.ok) {
      showToast("success", `${user.name} fue eliminado.`);
    } else {
      showToast("error", "No pudimos eliminar el usuario. Intentá de nuevo.");
    }
  }

  return (
    <>
      <ActionsMenu label={`Acciones para ${user.name}`}>
        <ActionsMenuItem icon={ShieldIcon} onClick={() => setEditOpen(true)}>
          Editar permisos
        </ActionsMenuItem>
        {user.status === "invited" && (
          <ActionsMenuItem icon={ForwardIcon} disabled={pending === "resend"} onClick={handleResend}>
            Reenviar invitación
          </ActionsMenuItem>
        )}
        {user.status !== "inactive" && (
          <ActionsMenuItem icon={UserOffIcon} disabled={pending === "deactivate"} onClick={handleDeactivate}>
            Desactivar usuario
          </ActionsMenuItem>
        )}
        <div className="my-1 h-px bg-gray-200" />
        <ActionsMenuItem icon={TrashIcon} danger onClick={() => setConfirmOpen(true)}>
          Eliminar usuario
        </ActionsMenuItem>
      </ActionsMenu>

      <ConfirmDialog
        open={confirmOpen}
        title={`Eliminar a ${user.name}`}
        description="Va a perder acceso a todas las casillas asignadas y no va a poder volver a iniciar sesión. Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        isLoading={pending === "delete"}
        onConfirm={handleDelete}
        onCancel={() => setConfirmOpen(false)}
      />

      <EditPermissionsDialog
        open={editOpen}
        onClose={() => setEditOpen(false)}
        user={user}
        mailboxes={mailboxes}
      />
    </>
  );
}
