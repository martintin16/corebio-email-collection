import { createClient } from "@/lib/supabase/server";

export type AppRole = "user" | "admin";

export interface CurrentUser {
  id: string;
  email: string;
  role: AppRole;
}

/**
 * Único punto de lectura del rol de la persona logueada. Asume el custom
 * claim "role" inyectado por un Auth Hook de Supabase en app_metadata
 * (se configura en el proyecto de base de datos, no en este repo). Si el
 * mecanismo final termina siendo otro, este es el único archivo a tocar.
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const role = (user.app_metadata as { role?: AppRole } | undefined)?.role ?? "user";

  return { id: user.id, email: user.email ?? "", role };
}
