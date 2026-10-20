import { createClient } from "@/lib/supabase/client";
import { apiUrl } from "./config";
import {
  ApiError,
  apiErrorFrom,
  networkError,
  type ActionResult,
} from "./errors";

/**
 * Pedidos al backend DESDE EL NAVEGADOR. Solo para lo que lleva archivos
 * (enviar, responder y programar con adjuntos; descargar un adjunto): Vercel
 * corta en 4,5 MB lo que pasa por el servidor de Next, y los adjuntos pueden
 * llegar a 20 MB. Todo lo demás va por `http.server.ts`.
 *
 * Usa el token de la sesión de Supabase que el navegador ya tiene para el login.
 * Uso interno de los archivos `lib/api/*.browser.ts`.
 */

async function authHeader(): Promise<Record<string, string>> {
  const {
    data: { session },
  } = await createClient().auth.getSession();
  return session ? { Authorization: `Bearer ${session.access_token}` } : {};
}

async function send(
  method: "POST" | "PATCH",
  path: string,
  form: FormData,
): Promise<Response> {
  let res: Response;
  try {
    // Sin Content-Type: el navegador lo arma con el boundary del multipart.
    res = await fetch(apiUrl(path), {
      method,
      headers: await authHeader(),
      body: form,
    });
  } catch {
    throw networkError();
  }
  if (res.status === 401) window.location.assign("/login");
  if (!res.ok) throw await apiErrorFrom(res);
  return res;
}

/** POST/PATCH multipart. Devuelve `{ ok, data }` / `{ ok: false, error }`. */
export async function sendForm<T>(
  method: "POST" | "PATCH",
  path: string,
  form: FormData,
): Promise<ActionResult<T>> {
  try {
    const res = await send(method, path, form);
    return {
      ok: true,
      data: (res.status === 204 ? undefined : await res.json()) as T,
    };
  } catch (err) {
    if (err instanceof ApiError) return { ok: false, error: err.info };
    throw err;
  }
}

/**
 * Arma el multipart: los campos de texto tal cual, las listas y objetos como
 * JSON (el backend los acepta así), y los archivos en `attachments`.
 * Los `undefined` no se mandan.
 */
export function toFormData(
  fields: Record<string, unknown>,
  files: File[] = [],
): FormData {
  const form = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    if (value === undefined) continue;
    form.append(key, typeof value === "string" ? value : JSON.stringify(value));
  }
  for (const file of files) form.append("attachments", file, file.name);
  return form;
}

/** Baja un archivo del backend y lo guarda con su nombre original. */
export async function downloadFile(path: string): Promise<ActionResult> {
  let res: Response;
  try {
    res = await fetch(apiUrl(path), { headers: await authHeader() });
  } catch {
    return { ok: false, error: networkError().info };
  }
  if (res.status === 401) window.location.assign("/login");
  if (!res.ok) return { ok: false, error: (await apiErrorFrom(res)).info };

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download =
    filenameFrom(res.headers.get("Content-Disposition")) ?? "adjunto";
  document.body.appendChild(link);
  link.click();
  link.remove();
  // Se libera después: algunos navegadores todavía están leyendo el blob.
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
  return { ok: true, data: undefined };
}

/** `filename*=UTF-8''…` (con tildes) o, si no está, `filename="…"`. */
export function filenameFrom(disposition: string | null): string | null {
  if (!disposition) return null;
  const star = /filename\*=UTF-8''([^;]+)/i.exec(disposition)?.[1];
  if (star) {
    try {
      return decodeURIComponent(star.trim());
    } catch {
      // Mal codificado: se prueba con el otro.
    }
  }
  return /filename="?([^";]+)"?/i.exec(disposition)?.[1]?.trim() ?? null;
}
