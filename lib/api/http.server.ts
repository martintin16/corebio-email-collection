import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { apiUrl } from "./config";
import { ApiError, apiErrorFrom, networkError, type ActionResult } from "./errors";

/**
 * Pedidos al backend desde el servidor de Next (pages y acciones de
 * `lib/api/*.ts`). El token sale de la sesión de Supabase (cookies): nunca
 * pasa por el navegador.
 *
 * Uso interno: las pages y componentes llaman a las funciones de cada entidad
 * (`getUsers()`, `getMessages()`…), no a esto.
 */

type Method = "GET" | "POST" | "PATCH" | "PUT" | "DELETE";

async function accessToken(): Promise<string | null> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.access_token ?? null;
}

async function request<T>(method: Method, path: string, body?: unknown): Promise<T> {
  const token = await accessToken();
  let res: Response;
  try {
    res = await fetch(apiUrl(path), {
      method,
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      // Siempre datos frescos: son mails y permisos, no algo para cachear.
      cache: "no-store",
    });
  } catch {
    throw networkError();
  }
  if (!res.ok) throw await apiErrorFrom(res);
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

/**
 * Lecturas: devuelven los datos o lanzan ApiError. Si la sesión venció (401),
 * van directo al login.
 */
export async function get<T>(path: string): Promise<T> {
  try {
    return await request<T>("GET", path);
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) redirect("/login");
    throw err;
  }
}

/** Escrituras: lanzan ApiError (las acciones lo convierten con `action`). */
export const post = <T>(path: string, body?: unknown) => request<T>("POST", path, body ?? {});
export const patch = <T>(path: string, body: unknown) => request<T>("PATCH", path, body);
export const put = <T>(path: string, body: unknown) => request<T>("PUT", path, body);
export const del = (path: string) => request<void>("DELETE", path);

/**
 * Envuelve una escritura para que devuelva `{ ok, data }` / `{ ok: false, error }`
 * en vez de lanzar (ver ActionResult). Otros errores (ej. un `redirect`) siguen
 * de largo.
 */
export async function action<T>(run: () => Promise<T>): Promise<ActionResult<T>> {
  try {
    return { ok: true, data: await run() };
  } catch (err) {
    if (err instanceof ApiError) return { ok: false, error: err.info };
    throw err;
  }
}
