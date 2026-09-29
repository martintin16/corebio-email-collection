"use client";

import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast/toast-context";
import { updateUserPermissions } from "@/lib/actions/users";
import { editPermissionsSchema, type EditPermissionsFormValues } from "@/lib/validations/admin";
import type { AdminUser, AdminMailbox } from "@/lib/types/admin";
import { cn } from "@/lib/utils";
import { ManageDriveDialog } from "@/components/admin/manage-drive-dialog";
import { DriveIcon } from "@/components/icons";

interface EditPermissionsDialogProps {
  open: boolean;
  onClose: () => void;
  user: AdminUser;
  mailboxes: AdminMailbox[];
}

// A diferencia de NewUserDialog, acá no se tocan nombre ni email — esta
// persona ya existe, lo único editable es su rol y a qué casillas puede
// entrar. Por eso es un diálogo propio y no "NewUserDialog en modo edición"
// con esos dos campos deshabilitados: mostrar campos que no se pueden tocar
// solo agrega ruido a una tarea que ya es puntual.
export function EditPermissionsDialog({
  open,
  onClose,
  user,
  mailboxes,
}: EditPermissionsDialogProps) {
  const { showToast } = useToast();
  const [formError, setFormError] = useState<string | null>(null);

  const defaultAccess = Object.fromEntries(
    mailboxes.map((mailbox) => {
      const existing = user.mailboxAccess.find((a) => a.mailboxId === mailbox.id);
      return [
        mailbox.id,
        { canSend: existing?.canSend ?? false, canRead: existing?.canRead ?? false },
      ];
    })
  );

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { isSubmitting },
  } = useForm<EditPermissionsFormValues>({
    resolver: zodResolver(editPermissionsSchema),
    defaultValues: { role: user.role, access: defaultAccess },
  });

  // Para saber, en vivo, a qué casillas quedaría con acceso esta persona —
  // "Gestionar Drive" se habilita según eso, no según lo que ya estaba
  // guardado antes de abrir el diálogo.
  const accessValues = useWatch({ control, name: "access" });
  const [driveMailbox, setDriveMailbox] = useState<AdminMailbox | null>(null);

  function handleClose() {
    reset();
    setFormError(null);
    onClose();
  }

  async function onSubmit(values: EditPermissionsFormValues) {
    setFormError(null);
    const result = await updateUserPermissions(user.id, values);
    if (!result.ok) {
      setFormError("No pudimos guardar los cambios. Intentá de nuevo.");
      return;
    }
    showToast("success", `Permisos de ${user.name} actualizados.`);
    handleClose();
  }

  return (
    <Dialog
      open={open}
      title={`Editar permisos de ${user.name}`}
      onClose={handleClose}
      maxWidthClassName="max-w-[400px]"
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        {formError && (
          <div
            role="alert"
            className="mb-3.5 rounded-md border border-red-200 bg-danger-bg px-3 py-2 text-xs text-danger-text"
          >
            {formError}
          </div>
        )}

        <fieldset className="mb-3.5">
          <legend className="mb-1.5 block text-sm text-gray-600">Rol</legend>
          <div className="flex gap-2" role="radiogroup">
            {(["user", "admin"] as const).map((roleOption) => (
              <label
                key={roleOption}
                className={cn(
                  "flex-1 cursor-pointer rounded-md border px-3 py-1.5 text-center text-sm font-medium transition-colors",
                  "has-[:checked]:border-primary-700 has-[:checked]:bg-primary-100 has-[:checked]:text-primary-700",
                  "has-[:checked]:font-medium border-gray-300 text-gray-600"
                )}
              >
                <input
                  type="radio"
                  value={roleOption}
                  className="sr-only"
                  {...register("role")}
                />
                {roleOption === "user" ? "Usuario" : "Admin"}
              </label>
            ))}
          </div>
        </fieldset>

        {mailboxes.length > 0 && (
          <div className="border-t border-gray-200 pt-3.5">
            <p className="mb-2 text-sm text-gray-600">Permisos por casilla</p>
            <div className="divide-y divide-gray-200">
              {mailboxes.map((mailbox) => {
                const hasAccess = Boolean(
                  accessValues?.[mailbox.id]?.canSend || accessValues?.[mailbox.id]?.canRead
                );
                return (
                  <div key={mailbox.id} className="py-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-800">{mailbox.email}</span>
                      <div className="flex gap-3.5 text-xs text-gray-600">
                        <label className="flex items-center gap-1.5">
                          <input type="checkbox" {...register(`access.${mailbox.id}.canSend`)} />
                          Enviar
                        </label>
                        <label className="flex items-center gap-1.5">
                          <input type="checkbox" {...register(`access.${mailbox.id}.canRead`)} />
                          Leer
                        </label>
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={!hasAccess}
                      onClick={() => setDriveMailbox(mailbox)}
                      title={
                        hasAccess
                          ? undefined
                          : "Necesita acceso de envío o lectura a esta casilla primero"
                      }
                      className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-gray-500 transition-colors hover:text-primary-700 disabled:cursor-not-allowed disabled:text-gray-300 disabled:hover:text-gray-300"
                    >
                      <DriveIcon className="h-3.5 w-3.5" />
                      Gestionar Drive
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <Button type="submit" isLoading={isSubmitting} className="mt-4 w-full justify-center">
          Guardar cambios
        </Button>
      </form>

      {driveMailbox && (
        <ManageDriveDialog
          open={driveMailbox !== null}
          onClose={() => setDriveMailbox(null)}
          mailbox={driveMailbox}
          user={user}
        />
      )}
    </Dialog>
  );
}
