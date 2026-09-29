"use client";

import { useEffect, useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { getMailboxAccessList } from "@/lib/actions/mailboxes";
import type { AdminMailbox } from "@/lib/types/admin";

interface MailboxUsersDialogProps {
  open: boolean;
  onClose: () => void;
  mailbox: AdminMailbox;
}

interface AccessRow {
  userId: string;
  name: string;
  email: string;
  role: "user" | "admin";
  canSend: boolean;
  canRead: boolean;
}

// Solo lectura — no hay nada que editar acá, para eso ya está "Editar
// permisos" en cada usuario. Esta vista es puramente informativa: "¿quién
// puede tocar esta casilla ahora mismo?", que es la pregunta que motivó
// todo el proyecto en primer lugar.
export function MailboxUsersDialog({ open, onClose, mailbox }: MailboxUsersDialogProps) {
  const [state, setState] = useState<"idle" | "loading" | "error" | "success">("idle");
  const [rows, setRows] = useState<AccessRow[]>([]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setState("loading");
    getMailboxAccessList(mailbox.id)
      .then((entries) => {
        if (cancelled) return;
        setRows(
          entries.map(({ user, access }) => ({
            userId: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            canSend: access.canSend,
            canRead: access.canRead,
          }))
        );
        setState("success");
      })
      .catch(() => {
        if (!cancelled) setState("error");
      });
    return () => {
      cancelled = true;
    };
  }, [open, mailbox.id]);

  return (
    <Dialog
      open={open}
      title={`Usuarios con acceso a ${mailbox.displayName}`}
      onClose={onClose}
      maxWidthClassName="max-w-[420px]"
    >
      {state === "loading" && (
        <div className="flex flex-col items-center gap-2 py-6 text-xs text-gray-500">
          <span
            aria-hidden="true"
            className="h-5 w-5 animate-spin rounded-full border-[2.5px] border-gray-200 border-t-primary-700"
          />
          Cargando usuarios…
        </div>
      )}

      {state === "error" && (
        <div role="alert" className="rounded-md border border-red-200 bg-danger-bg px-3 py-2 text-xs text-danger-text">
          No pudimos cargar los usuarios de esta casilla. Cerrá esta ventana e intentá de nuevo.
        </div>
      )}

      {state === "success" && rows.length === 0 && (
        <p className="py-6 text-center text-xs text-gray-500">
          Todavía nadie tiene acceso a esta casilla.
        </p>
      )}

      {state === "success" && rows.length > 0 && (
        <ul className="divide-y divide-gray-200">
          {rows.map((row) => (
            <li key={row.userId} className="flex items-center justify-between gap-3 py-2.5">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-gray-900">{row.name}</p>
                <p className="truncate text-xs text-gray-400">{row.email}</p>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                <Badge tone={row.role === "admin" ? "primary" : "neutral"}>{row.role}</Badge>
                <Badge tone={row.canSend ? "success" : "neutral"}>
                  {row.canSend ? "Enviar" : "Sin enviar"}
                </Badge>
                <Badge tone={row.canRead ? "success" : "neutral"}>
                  {row.canRead ? "Leer" : "Sin leer"}
                </Badge>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Dialog>
  );
}
