import type { Metadata } from "next";
import { ForgotPasswordCard } from "@/components/auth/forgot-password-card";

export const metadata: Metadata = {
  title: "Recuperar contraseña",
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordCard />;
}
