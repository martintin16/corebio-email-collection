"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
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

type LinkType = "invite" | "recovery";

/**
 * Estado del link con el que se llegó a esta página:
 * - "none": no vino `token_hash` en la URL → flujo de siempre (PKCE: el
 *   cliente de Supabase canjea solo el `?code=` que deja "olvidé mi contraseña").
 * - "verifying" / "ready" / "invalid": vino `?token_hash=...&type=...`
 *   (plantillas de email de Supabase) y hay que validarlo con verifyOtp.
 */
type LinkStatus = "none" | "verifying" | "ready" | "invalid";

function readTokenFromUrl(): { tokenHash: string; type: LinkType } | null {
  const params = new URLSearchParams(window.location.search);
  const tokenHash = params.get("token_hash");
  const type = params.get("type");
  if (!tokenHash || (type !== "invite" && type !== "recovery")) return null;
  return { tokenHash, type };
}

const COPY: Record<LinkType, { title: string; subtitle: string; expired: string }> = {
  invite: {
    title: "Creá tu contraseña",
    subtitle: "Para activar tu cuenta, elegí una contraseña de al menos 8 caracteres.",
    expired:
      "El enlace de invitación venció o ya se usó. Pedile a un administrador que te reenvíe la invitación.",
  },
  recovery: {
    title: "Elegí una nueva contraseña",
    subtitle: "Tiene que tener al menos 8 caracteres.",
    expired: "El enlace venció o ya se usó. Pedí uno nuevo desde \"olvidé mi contraseña\".",
  },
};

export function ResetPasswordForm() {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const [linkType, setLinkType] = useState<LinkType>("recovery");
  const [linkStatus, setLinkStatus] = useState<LinkStatus>("none");
  // El token es de un solo uso: en desarrollo React (StrictMode) ejecuta los
  // efectos dos veces, y el segundo verifyOtp fallaría por token ya usado.
  const verifyStarted = useRef(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  useEffect(() => {
    if (verifyStarted.current) return;
    const token = readTokenFromUrl();
    if (!token) return;
    verifyStarted.current = true;

    setLinkType(token.type);
    setLinkStatus("verifying");

    // Se valida en el navegador (no en una ruta de servidor) a propósito:
    // 1. El middleware manda a /inbox a cualquiera con sesión que entre a una
    //    ruta de auth, así que si la sesión se creara del lado del servidor
    //    el usuario nunca llegaría a ver este formulario.
    // 2. Los escáneres de links de los clientes de correo no ejecutan JS, así
    //    que no pueden "gastar" el token antes que la persona.
    createClient()
      .auth.verifyOtp({ token_hash: token.tokenHash, type: token.type })
      .then(({ error }) => setLinkStatus(error ? "invalid" : "ready"))
      .catch(() => setLinkStatus("invalid"))
      .finally(() => {
        // Saca el token de la URL (historial, barra de direcciones, capturas).
        window.history.replaceState(null, "", window.location.pathname);
      });
  }, []);

  const copy = COPY[linkType];

  async function onSubmit(values: ResetPasswordFormValues) {
    setFormError(null);
    const supabase = createClient();

    // Llegar acá ya implica una sesión válida: la crea el link del mail (sea
    // el `?code=` de recuperación o el `token_hash` validado arriba); por eso
    // alcanza con updateUser, sin pedir la contraseña vieja.
    const { error } = await supabase.auth.updateUser({
      password: values.password,
    });

    if (error) {
      setFormError(copy.expired);
      return;
    }

    router.push("/login");
  }

  if (linkStatus === "verifying") {
    return (
      <div className="w-full max-w-[340px] rounded-lg border border-gray-200 bg-white p-7 text-center shadow-sm">
        <p role="status" className="text-sm text-gray-500">
          Validando el enlace…
        </p>
      </div>
    );
  }

  if (linkStatus === "invalid") {
    return (
      <div className="w-full max-w-[340px] rounded-lg border border-gray-200 bg-white p-7 shadow-sm">
        <div
          role="alert"
          className="rounded-md border border-red-200 bg-danger-bg px-3 py-2 text-xs text-danger-text"
        >
          {copy.expired}
        </div>
        <Link
          href={linkType === "invite" ? "/login" : "/forgot-password"}
          className="mt-5 inline-block text-xs text-gray-400 transition-colors hover:text-gray-600"
        >
          {linkType === "invite" ? "Ir al login" : "Pedir un enlace nuevo"}
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[340px] rounded-lg border border-gray-200 bg-white p-7 shadow-sm">
      <p className="mb-1 text-sm font-medium text-gray-900">{copy.title}</p>
      <p className="mb-6 text-xs text-gray-500">{copy.subtitle}</p>

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
