"use server";

import { revalidatePath } from "next/cache";

/**
 * Avisa a Next que cambió algo de las bandejas (Recibidos, Enviados,
 * Programados y sus contadores). Hace falta porque enviar, responder,
 * programar y editar van directo del navegador al backend (*.browser.ts),
 * sin pasar por el servidor de Next, que si no seguiría mostrando lo que
 * tenía en caché.
 *
 * En Next 14, revalidatePath dentro de una Server Action también vacía el
 * caché del router del navegador: la próxima pantalla que se abra (por
 * ejemplo, al volver con router.back()) se pide de nuevo.
 */
export async function revalidateInbox(): Promise<void> {
  revalidatePath("/inbox", "layout");
}
