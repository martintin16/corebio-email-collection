"use client";

import { useState } from "react";
import { ActionsMenu, ActionsMenuItem } from "@/components/ui/actions-menu";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ReconnectMailboxDialog } from "@/components/admin/reconnect-mailbox-dialog";
import { EditMailboxNameDialog } from "@/components/admin/edit-mailbox-name-dialog";
import { MailboxUsersDialog } from "@/components/admin/mailbox-users-dialog";
import { useToast } from "@/components/ui/toast/toast-context";
import { disconnectMailbox } from "@/lib/actions/mailboxes";
import { PlugIcon, EditIcon, ShieldIcon, TrashIcon } from "@/components/icons";
import type { AdminMailbox } from "@/lib/types/admin";

export function MailboxRowActions({ mailbox }: { mailbox: AdminMailbox }) {
  const { showToast } = useToast();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [reconnectOpen, setReconnectOpen] = useState(false);
  const [editNameOpen, setEditNameOpen] = useState(false);
  const [usersOpen, setUsersOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDisconnect() {
    setDeleting(true);
    const result = await disconnectMailbox(mailbox.id);
    setDeleting(false);
    setConfirmOpen(false);
    if (result.ok) {
      showToast("success", `${mailbox.email} fue desconectada.`);
    } else {
      showToast("error", "No pudimos desconectar la casilla. Intentá de nuevo.");
    }
  }

  return (
    <>
      <ActionsMenu label={`Acciones para ${mailbox.email}`}>
        {mailbox.status === "needs_reconnect" && (
          <ActionsMenuItem icon={PlugIcon} onClick={() => setReconnectOpen(true)}>
            Reconectar
          </ActionsMenuItem>
        )}
        <ActionsMenuItem icon={EditIcon} onClick={() => setEditNameOpen(true)}>
          Editar nombre visible
        </ActionsMenuItem>
        <ActionsMenuItem icon={ShieldIcon} onClick={() => setUsersOpen(true)}>
          Ver usuarios con acceso
        </ActionsMenuItem>
        <div className="my-1 h-px bg-gray-200" />
        <ActionsMenuItem icon={TrashIcon} danger onClick={() => setConfirmOpen(true)}>
          Desconectar casilla
        </ActionsMenuItem>
      </ActionsMenu>

      <ConfirmDialog
        open={confirmOpen}
        title={`Desconectar ${mailbox.displayName}`}
        description="Todos los usuarios que tengan esta casilla asignada van a perder el acceso. Esta acción no se puede deshacer."
        confirmLabel="Desconectar"
        isLoading={deleting}
        onConfirm={handleDisconnect}
        onCancel={() => setConfirmOpen(false)}
      />

      <ReconnectMailboxDialog
        open={reconnectOpen}
        onClose={() => setReconnectOpen(false)}
        mailbox={mailbox}
      />

      <EditMailboxNameDialog
        open={editNameOpen}
        onClose={() => setEditNameOpen(false)}
        mailbox={mailbox}
      />

      <MailboxUsersDialog
        open={usersOpen}
        onClose={() => setUsersOpen(false)}
        mailbox={mailbox}
      />
    </>
  );
}
