export function formatMessageDate(iso: string): string {
  const date = new Date(iso);
  const now = new Date();

  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
  }

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) {
    return "Ayer";
  }

  return date.toLocaleDateString("es-AR", { day: "2-digit", month: "short" });
}

const AR_TIME_ZONE = "America/Argentina/Buenos_Aires";

/**
 * Fecha completa para el encabezado de un mensaje y el texto reenviado:
 * "lunes 26 de octubre, 10:32" (con el año si no es el actual). Siempre en
 * horario de Argentina: estas fechas también se arman en el servidor, que
 * en Vercel corre en UTC.
 */
export function formatFullDate(iso: string): string {
  const date = new Date(iso);
  const yearOf = (d: Date) =>
    new Intl.DateTimeFormat("es-AR", { year: "numeric", timeZone: AR_TIME_ZONE }).format(d);
  const day = new Intl.DateTimeFormat("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    ...(yearOf(date) !== yearOf(new Date()) ? { year: "numeric" as const } : {}),
    timeZone: AR_TIME_ZONE,
  }).format(date);
  const time = new Intl.DateTimeFormat("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone: AR_TIME_ZONE,
  }).format(date);
  return `${day.replace(",", "")}, ${time}`;
}
