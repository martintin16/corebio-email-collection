"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";
import { LoadingOverlay } from "@/components/ui/loading-overlay";
import { useToast } from "@/components/ui/toast/toast-context";
import { connectMailbox } from "@/lib/actions/mailboxes";
import {
  connectMailboxSchema,
  type ConnectMailboxFormValues,
} from "@/lib/validations/admin";

interface ConnectMailboxDialogProps {
  open: boolean;
  onClose: () => void;
}

export function ConnectMailboxDialog({ open, onClose }: ConnectMailboxDialogProps) {
  const { showToast } = useToast();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ConnectMailboxFormValues>({
    resolver: zodResolver(connectMailboxSchema),
    defaultValues: { email: "", displayName: "" },
  });

  function handleClose() {
    reset();
    setFormError(null);
    onClose();
  }

  async function onSubmit(values: ConnectMailboxFormValues) {
    setFormError(null);
    // TODO: acá va la redirección real a Google OAuth (ver TODO en
    // lib/actions/mailboxes.ts). Por ahora se simula la conexión directamente.
    const result = await connectMailbox(values);
    if (!result.ok) {
      setFormError("No pudimos conectar la casilla. Intentá de nuevo.");
      return;
    }
    showToast("success", `${values.email} conectada.`);
    handleClose();
  }

  return (
    <Dialog
      open={open}
      title="Conectar casilla"
      onClose={handleClose}
      preventClose={isSubmitting}
    >
      <LoadingOverlay active={isSubmitting} label="Conectando con Google…" />

      <p className="mb-4 text-xs leading-relaxed text-gray-500">
        La persona dueña de la casilla va a tener que autorizar el acceso desde Google.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        {formError && (
          <div
            role="alert"
            className="mb-3.5 rounded-md border border-red-200 bg-danger-bg px-3 py-2 text-xs text-danger-text"
          >
            {formError}
          </div>
        )}

        <FormField id="email" label="Dirección de la casilla" error={errors.email?.message}>
          <Input
            id="email"
            type="email"
            placeholder="secretaria@corebio.org"
            aria-invalid={!!errors.email}
            {...register("email")}
          />
        </FormField>

        <FormField id="displayName" label="Nombre visible" error={errors.displayName?.message}>
          <Input
            id="displayName"
            placeholder="Secretaría Corebio"
            aria-invalid={!!errors.displayName}
            {...register("displayName")}
          />
        </FormField>

        <Button
          type="submit"
          variant="secondary"
          isLoading={isSubmitting}
          className="mb-2.5 w-full justify-center gap-2"
        >
          Continuar con Google
        </Button>

        <p className="text-center text-[11px] text-gray-400">
          Nunca guardamos la contraseña de la casilla
        </p>
      </form>
    </Dialog>
  );
}
