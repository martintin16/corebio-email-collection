"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";
import { useToast } from "@/components/ui/toast/toast-context";
import { createUser } from "@/lib/actions/users";
import { newUserSchema, type NewUserFormValues } from "@/lib/validations/admin";
import type { AdminMailbox } from "@/lib/types/admin";
import { cn } from "@/lib/utils";

interface NewUserDialogProps {
  open: boolean;
  onClose: () => void;
  mailboxes: AdminMailbox[];
}

export function NewUserDialog({ open, onClose, mailboxes }: NewUserDialogProps) {
  const { showToast } = useToast();
  const [formError, setFormError] = useState<string | null>(null);

  const defaultAccess = Object.fromEntries(
    mailboxes.map((m) => [m.id, { canSend: false, canRead: false }])
  );

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<NewUserFormValues>({
    resolver: zodResolver(newUserSchema),
    defaultValues: { name: "", email: "", role: "user", access: defaultAccess },
  });

  function handleClose() {
    reset();
    setFormError(null);
    onClose();
  }

  async function onSubmit(values: NewUserFormValues) {
    setFormError(null);
    const result = await createUser(values);
    if (!result.ok) {
      setFormError("No pudimos invitar al usuario. Intentá de nuevo.");
      return;
    }
    showToast("success", `Invitación enviada a ${values.email}.`);
    handleClose();
  }

  return (
    <Dialog open={open} title="Nuevo usuario" onClose={handleClose} maxWidthClassName="max-w-[400px]">
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        {formError && (
          <div
            role="alert"
            className="mb-3.5 rounded-md border border-red-200 bg-danger-bg px-3 py-2 text-xs text-danger-text"
          >
            {formError}
          </div>
        )}

        <FormField id="name" label="Nombre completo" error={errors.name?.message}>
          <Input
            id="name"
            placeholder="Lucía Fernández"
            aria-invalid={!!errors.name}
            {...register("name")}
          />
        </FormField>

        <FormField id="email" label="Email personal" error={errors.email?.message}>
          <Input
            id="email"
            type="email"
            placeholder="lucia.fer@gmail.com"
            aria-invalid={!!errors.email}
            {...register("email")}
          />
        </FormField>

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
              {mailboxes.map((mailbox) => (
                <div key={mailbox.id} className="flex items-center justify-between py-2">
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
              ))}
            </div>
          </div>
        )}

        <Button type="submit" isLoading={isSubmitting} className="mt-4 w-full justify-center">
          Enviar invitación
        </Button>
      </form>
    </Dialog>
  );
}
