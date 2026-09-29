"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createClient } from "@/lib/supabase/client";
import {
  forgotPasswordSchema,
  type ForgotPasswordFormValues,
} from "@/lib/validations/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";
import { ArrowLeftIcon, CheckIcon } from "@/components/icons";

export function ForgotPasswordCard() {
  // Guarda el email ya enviado en vez de un simple boolean: la confirmación
  // necesita mostrarlo ("te enviamos un enlace a maria@gmail.com").
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  async function onSubmit(values: ForgotPasswordFormValues) {
    setFormError(null);
    const supabase = createClient();

    // Supabase devuelve éxito genérico aunque el email no exista en el
    // sistema (evita filtrar qué mails están registrados). Solo tratamos
    // como error los fallos reales de la llamada (red, rate limit, etc).
    const { error } = await supabase.auth.resetPasswordForEmail(
      values.email,
      { redirectTo: `${window.location.origin}/reset-password` }
    );

    if (error) {
      setFormError("No pudimos enviar el enlace. Intentá de nuevo en unos minutos.");
      return;
    }

    setSentTo(values.email);
  }

  if (sentTo) {
    return (
      <div className="w-full max-w-[340px] rounded-lg border border-gray-200 bg-white p-7 text-center shadow-sm">
        <div className="mx-auto mb-3.5 flex h-9 w-9 items-center justify-center rounded-full bg-primary-100">
          <CheckIcon className="h-4 w-4 text-primary-700" />
        </div>
        <p className="mb-1 text-sm font-medium text-gray-900">Revisá tu correo</p>
        <p className="text-xs leading-relaxed text-gray-500">
          Te enviamos un enlace a <span className="text-gray-700">{sentTo}</span>{" "}
          para elegir una nueva contraseña.
        </p>
        <Link
          href="/login"
          className="mt-5 inline-block text-xs text-gray-400 transition-colors hover:text-gray-600"
        >
          Volver al login
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[340px] rounded-lg border border-gray-200 bg-white p-7 shadow-sm">
      <Link
        href="/login"
        className="mb-4 inline-flex items-center gap-1.5 text-xs text-gray-500 transition-colors hover:text-gray-700"
      >
        <ArrowLeftIcon className="h-3.5 w-3.5" />
        Volver al login
      </Link>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        {formError && (
          <div
            role="alert"
            className="mb-4 rounded-md border border-red-200 bg-danger-bg px-3 py-2 text-xs text-danger-text"
          >
            {formError}
          </div>
        )}

        <FormField id="email" label="Email" error={errors.email?.message}>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="nombre@tumail.com"
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? "email-error" : undefined}
            {...register("email")}
          />
        </FormField>

        <Button
          type="submit"
          isLoading={isSubmitting}
          className="w-full justify-center"
        >
          Enviar enlace
        </Button>
      </form>
    </div>
  );
}
