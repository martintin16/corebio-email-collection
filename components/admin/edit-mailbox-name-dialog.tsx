"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";
import { useToast } from "@/components/ui/toast/toast-context";
import { updateMailboxDisplayName } from "@/lib/actions/mailboxes";
import {
  editMailboxNameSchema,
  type EditMailboxNameFormValues,
} from "@/lib/validations/admin";
import type { AdminMailbox } from "@/lib/types/admin";

interface EditMailboxNameDialogProps {
  open: boolean;
  onClose: () => void;
  mailbox: AdminMailbox;
}

// La dirección real (secretaria@corebio.org) no se edita acá: es la
// identidad de la casilla en Google, cambiarla implicaría reconectarla
// desde cero. Lo único que tiene sentido editar es el nombre visible que
// usan las demás pantallas (switcher del inbox, tarjetas de esta tabla).
export function EditMailboxNameDialog({ open, onClose, mailbox }: EditMailboxNameDialogProps) {
  const { showToast } = useToast();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EditMailboxNameFormValues>({
    resolver: zodResolver(editMailboxNameSchema),
    defaultValues: { displayName: mailbox.displayName },
  });

  function handleClose() {
    reset();
    setFormError(null);
    onClose();
  }

  async function onSubmit(values: EditMailboxNameFormValues) {
    setFormError(null);
    const result = await updateMailboxDisplayName(mailbox.id, values);
    if (!result.ok) {
      setFormError("No pudimos guardar el cambio. Intentá de nuevo.");
      return;
    }
    showToast("success", "Nombre visible actualizado.");
    handleClose();
  }

  return (
    <Dialog
      open={open}
      title="Editar nombre visible"
      onClose={handleClose}
      maxWidthClassName="max-w-[360px]"
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

        <p className="mb-3.5 text-xs text-gray-500">{mailbox.email}</p>

        <FormField id="displayName" label="Nombre visible" error={errors.displayName?.message}>
          <Input
            id="displayName"
            placeholder="Secretaría Corebio"
            aria-invalid={!!errors.displayName}
            {...register("displayName")}
          />
        </FormField>

        <Button type="submit" isLoading={isSubmitting} className="w-full justify-center">
          Guardar cambios
        </Button>
      </form>
    </Dialog>
  );
}
