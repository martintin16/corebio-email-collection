// Opciones rápidas del menú "Programar envío", calculadas según el momento
// del día — igual que Gmail, para no obligar a abrir el selector de fecha
// en el caso más común (mandar "mañana a primera hora", etc).

export interface QuickScheduleOption {
  id: string;
  label: string;
  getDate: () => Date;
}

function atTime(base: Date, hours: number, minutes = 0): Date {
  const d = new Date(base);
  d.setHours(hours, minutes, 0, 0);
  return d;
}

function addDays(base: Date, days: number): Date {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d;
}

const WEEKDAY_LABELS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];

export function getQuickScheduleOptions(now: Date = new Date()): QuickScheduleOption[] {
  const options: QuickScheduleOption[] = [];

  const thisAfternoon = atTime(now, 15, 0);
  if (thisAfternoon.getTime() > now.getTime() + 5 * 60 * 1000) {
    options.push({
      id: "this-afternoon",
      label: `Esta tarde, ${formatTime(thisAfternoon)}`,
      getDate: () => thisAfternoon,
    });
  }

  const thisEvening = atTime(now, 20, 0);
  if (thisEvening.getTime() > now.getTime() + 5 * 60 * 1000) {
    options.push({
      id: "this-evening",
      label: `Esta noche, ${formatTime(thisEvening)}`,
      getDate: () => thisEvening,
    });
  }

  const tomorrow = atTime(addDays(now, 1), 8, 0);
  options.push({
    id: "tomorrow-morning",
    label: `Mañana, ${formatTime(tomorrow)}`,
    getDate: () => tomorrow,
  });

  // Próximo lunes a las 8: si hoy ya es lunes, salta a la semana siguiente.
  const dayOfWeek = now.getDay(); // 0 = domingo
  const daysUntilMonday = ((1 - dayOfWeek + 7) % 7) || 7;
  const nextMonday = atTime(addDays(now, daysUntilMonday), 8, 0);
  options.push({
    id: "next-monday",
    label: `El lunes, ${formatTime(nextMonday)}`,
    getDate: () => nextMonday,
  });

  return options;
}

export function formatTime(date: Date): string {
  return date.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
}

export function formatScheduledAt(date: Date): string {
  const now = new Date();
  const sameYear = date.getFullYear() === now.getFullYear();
  const datePart = sameYear
    ? date.toLocaleDateString("es-AR", { day: "2-digit", month: "long" })
    : date.toLocaleDateString("es-AR", { day: "2-digit", month: "long", year: "numeric" });
  return `el ${datePart} a las ${formatTime(date)}`;
}

export function weekdayLabel(date: Date): string {
  return WEEKDAY_LABELS[date.getDay()];
}

// Mínimo 5 minutos en el futuro — ni "en el pasado" (imposible de cumplir)
// ni "ahora mismo" (para eso está el botón "Enviar").
export const MIN_SCHEDULE_LEAD_MS = 5 * 60 * 1000;

export function isValidScheduleTime(date: Date, now: Date = new Date()): boolean {
  return date.getTime() >= now.getTime() + MIN_SCHEDULE_LEAD_MS;
}
