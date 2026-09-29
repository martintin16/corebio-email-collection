"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createClient } from "@/lib/supabase/client";
import { loginSchema, type LoginFormValues } from "@/lib/validations/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { FormField } from "@/components/ui/form-field";

export function LoginForm() {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: LoginFormValues) {
    setFormError(null);
    const supabase = createClient();

    const { error } = await supabase.auth.signInWithPassword(values);

    if (error) {
      // Mensaje genérico a propósito: no confirmamos si el email existe
      // o no, para no filtrar esa información.
      setFormError("Email o contraseña incorrectos.");
      return;
    }

    router.push("/inbox");
    router.refresh();
  }

  return (
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

      <FormField id="password" label="Contraseña" error={errors.password?.message}>
        <PasswordInput
          id="password"
          autoComplete="current-password"
          placeholder="••••••••"
          aria-invalid={!!errors.password}
          aria-describedby={errors.password ? "password-error" : undefined}
          {...register("password")}
        />
      </FormField>

      <Button
        type="submit"
        isLoading={isSubmitting}
        className="mt-1 w-full justify-center"
      >
        Iniciar sesión
      </Button>

      <div className="mt-3.5 text-center">
        <Link
          href="/forgot-password"
          className="text-xs text-gray-400 transition-colors hover:text-gray-600"
        >
          ¿Olvidaste tu contraseña?
        </Link>
      </div>
    </form>
  );
}
