"use server";

import * as http from "./http.server";
import type { Mailbox } from "@/lib/types/mail";

/** Casillas a las que la persona logueada tiene algún permiso, con lo que puede hacer en cada una. */
export async function getMailboxesForCurrentUser(): Promise<Mailbox[]> {
  return http.get<Mailbox[]>("/me/mailboxes");
}
