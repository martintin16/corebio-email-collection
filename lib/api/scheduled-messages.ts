import type { ScheduledMessage } from "@/lib/types/scheduled-message";

/**
 * TODO: igual que el resto de lib/api/* — reemplazar por fetch real al
 * backend. Es un mock de solo lectura, independiente de lib/actions/schedule.ts:
 * programar un envío nuevo desde Redactar/Responder no agrega una fila acá
 * (ver la nota en el README, sección "Programar envío") — esta lista es un
 * ejemplo fijo para poder construir y mostrar la vista "Programados" antes
 * de que exista un backend real que una las dos puntas.
 */

function hoursFromNow(hours: number): string {
  return new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
}

const MOCK_SCHEDULED_MESSAGES: Record<string, ScheduledMessage[]> = {
  mbx_1: [
    {
      id: "sch_1",
      mailboxId: "mbx_1",
      to: "comision@corebio.org",
      subject: "Recordatorio: reunión de comisión directiva",
      bodyPreview: "Les recordamos que la reunión de comisión directiva es este jueves a las 18:00.",
      body: "<p>Les recordamos que la reunión de comisión directiva es este jueves a las 18:00.</p><p>Saludos,<br>Secretaría Corebio</p>",
      scheduledAt: hoursFromNow(18),
    },
    {
      id: "sch_2",
      mailboxId: "mbx_1",
      to: "residencianorte@gmail.com",
      subject: "Convenio de práctica — próximos pasos",
      bodyPreview: "Buenas, les compartimos los próximos pasos para avanzar con el convenio...",
      body: "<p>Buenas,</p><p>Les compartimos los próximos pasos para avanzar con el convenio de práctica para residentes.</p><p>Quedamos atentos, saludos.</p>",
      scheduledAt: hoursFromNow(64),
    },
  ],
};

function delay<T>(value: T, ms = 300): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

export async function getScheduledMessages(mailboxId: string): Promise<ScheduledMessage[]> {
  const items = (MOCK_SCHEDULED_MESSAGES[mailboxId] ?? [])
    .slice()
    .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt));
  return delay(items);
}

export async function getScheduledMessageById(id: string): Promise<ScheduledMessage | null> {
  const all = Object.values(MOCK_SCHEDULED_MESSAGES).flat();
  return delay(all.find((m) => m.id === id) ?? null);
}
