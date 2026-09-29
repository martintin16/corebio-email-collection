"use server";

export interface ScheduleMessageInput {
  mailboxId: string;
  to: string;
  subject: string;
  body: string;
  // ISO 8601, en UTC — la vista siempre lo formatea en horario de Argentina.
  scheduledAt: string;
}

/**
 * TODO: reemplazar por la mutación real al backend. Falta ahí un mecanismo
 * propio para el envío programado: la Gmail API no tiene un "send later"
 * nativo, así que hace falta guardar el mensaje con su fecha y un job
 * periódico (ver README) que lo dispare cuando corresponda.
 *
 * Igual que el resto de las acciones simuladas del proyecto (crear
 * usuario, reconectar casilla, etc.), esta no persiste en ningún lado
 * todavía — la vista "Programados" (próxima etapa) va a mostrar su propio
 * listado de ejemplo, no lo que se programó acá. Se une con la etapa 4
 * cuando el backend exista de verdad.
 */
export async function scheduleMessage(_input: ScheduleMessageInput): Promise<{ ok: true }> {
  await new Promise((resolve) => setTimeout(resolve, 600));
  return { ok: true };
}

/**
 * Igual que scheduleMessage: simula el viaje de ida y vuelta, no borra nada
 * de verdad — la vista "Programados" saca la fila de su propio estado local
 * (optimista) cuando esto resuelve bien.
 */
export async function cancelScheduledMessage(_id: string): Promise<{ ok: true }> {
  await new Promise((resolve) => setTimeout(resolve, 500));
  return { ok: true };
}
