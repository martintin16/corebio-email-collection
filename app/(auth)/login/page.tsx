import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/login-form";
import { MailGlyph } from "@/components/icons";

export const metadata: Metadata = {
  title: "Iniciar sesión",
};

// Server Component por defecto: solo el <LoginForm /> necesita
// interactividad (RHF, estado del ojito), así que es el único
// pedazo marcado "use client".
export default function LoginPage() {
  return (
    <div className="w-full max-w-[340px] rounded-lg border border-gray-200 bg-white p-7 shadow-sm">
      <div className="mb-1 flex items-center gap-2">
        <div className="flex h-[22px] w-[22px] items-center justify-center rounded-md bg-primary-700">
          <MailGlyph className="h-3 w-3 text-white" />
        </div>
        <span className="text-sm font-medium text-gray-900">corebio mail</span>
      </div>
      <p className="mb-6 text-xs text-gray-500">
        Acceso para miembros de la comisión
      </p>

      <LoginForm />
    </div>
  );
}
