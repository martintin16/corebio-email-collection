import { createBrowserClient } from "@supabase/ssr";

/**
 * Cliente de Supabase para uso en Client Components (navegador).
 * Se usa únicamente para Auth (login, logout, refresh de sesión) — nunca
 * para leer/escribir las tablas de negocio, eso vive detrás del backend.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
