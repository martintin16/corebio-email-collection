"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createClient } from "@/lib/supabase/client";
import {
  resetPasswordSchema,
  type ResetPasswordFormValues,
} from "@/lib/validations/auth";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/ui/password-input";
import { FormField } from "@/components/ui/form-field";

export function ResetPasswordForm() {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  async function onSubmit(values: ResetPasswordFormValues) {
    setFormError(null);
    const supabase = createClient();

    // Llegar acá ya implica una sesión de recuperación válida (el link del
    // mail la crea); por eso alcanza con updateUser, sin pedir la contraseña vieja.
    const { error } = await supabase.auth.updateUser({
      password: values.password,
    });

    if (error) {
      setFormError(
        "El enlace venció o ya se usó. Pedí uno nuevo desde \"olvidé mi contraseña\"."
      );
      return;
    }

    router.push("/login");
  }

  return (
    <div className="w-full max-w-[340px] rounded-lg border border-gray-200 bg-white p-7 shadow-sm">
      <p className="mb-1 text-sm font-medium text-gray-900">Elegí una nueva contraseña</p>
      <p className="mb-6 text-xs text-gray-500">Tiene que tener al menos 8 caracteres.</p>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        {formError && (
          <div
            role="alert"
            className="mb-4 rounded-md border border-red-200 bg-danger-bg px-3 py-2 text-xs text-danger-text"
          >
            {formError}
          </div>
        )}

        <FormField id="password" label="Contraseña nueva" error={errors.password?.message}>
          <PasswordInput
            id="password"
            autoComplete="new-password"
            placeholder="••••••••"
            aria-invalid={!!errors.password}
            aria-describedby={errors.password ? "password-error" : undefined}
            {...register("password")}
          />
        </FormField>

        <FormField
          id="confirmPassword"
          label="Confirmar contraseña"
          error={errors.confirmPassword?.message}
        >
          <PasswordInput
            id="confirmPassword"
            autoComplete="new-password"
            placeholder="••••••••"
            aria-invalid={!!errors.confirmPassword}
            aria-describedby={
              errors.confirmPassword ? "confirmPassword-error" : undefined
            }
            {...register("confirmPassword")}
          />
        </FormField>

        <Button
          type="submit"
          isLoading={isSubmitting}
          className="w-full justify-center"
        >
          Guardar contraseña
        </Button>
      </form>
    </div>
  );
}
