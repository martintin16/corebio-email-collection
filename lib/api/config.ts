/**
 * URL del backend (NestJS). `NEXT_PUBLIC_` porque también la usa el navegador
 * para lo que lleva archivos (ver http.browser.ts).
 */
export function apiUrl(path: string): string {
  const base = process.env.NEXT_PUBLIC_API_URL;
  if (!base) {
    throw new Error(
      "Falta NEXT_PUBLIC_API_URL (la URL del backend) en el .env",
    );
  }
  return `${base.replace(/\/+$/, "")}${path}`;
}
