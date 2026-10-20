"use server";

import * as http from "./http.server";
import type { Contact, ContactGroup } from "@/lib/types/contact";

/**
 * Contactos y grupos (etiquetas de Google Contacts) de una casilla, solo
 * lectura. Piden permiso de envío en la casilla. El backend los guarda 5
 * minutos: un contacto recién agregado en Google puede tardar en aparecer.
 */

const box = (mailboxId: string) => `/mailboxes/${encodeURIComponent(mailboxId)}`;

export async function getContactGroups(mailboxId: string): Promise<ContactGroup[]> {
  return http.get(`${box(mailboxId)}/contact-groups`);
}

/** Solo los que tienen email (pueden ser menos que `memberCount`). */
export async function getContactGroupMembers(
  mailboxId: string,
  groupId: string
): Promise<Contact[]> {
  return http.get(`${box(mailboxId)}/contact-groups/${encodeURIComponent(groupId)}/members`);
}

/**
 * Sin `q`: todos los de "Mis contactos" (con eso se arma el autocompletado).
 * Con `q`: busca también en "Otros contactos" (a quienes la casilla ya les escribió).
 */
export async function searchContacts(mailboxId: string, q = ""): Promise<Contact[]> {
  const query = q.trim();
  return http.get(`${box(mailboxId)}/contacts${query ? `?q=${encodeURIComponent(query)}` : ""}`);
}
