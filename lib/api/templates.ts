"use server";

import * as http from "./http.server";
import type { ActionResult } from "./errors";
import type { MessageTemplate, TemplateInput } from "@/lib/types/template";
import { normalizeText } from "@/lib/recipients";

/**
 * Plantillas de una casilla (módulo `templates` del backend). Las usa y las
 * gestiona cualquiera con permiso de envío en la casilla.
 * Nombre repetido (sin distinguir mayúsculas ni tildes) → error con
 * `code: "TEMPLATE_NAME_TAKEN"`.
 */

const base = (mailboxId: string) => `/mailboxes/${encodeURIComponent(mailboxId)}/templates`;

export async function getTemplatesForMailbox(mailboxId: string): Promise<MessageTemplate[]> {
  return http.get(base(mailboxId));
}

export async function createTemplate(
  mailboxId: string,
  input: TemplateInput
): Promise<ActionResult<MessageTemplate>> {
  return http.action(() => http.post<MessageTemplate>(base(mailboxId), input));
}

export async function updateTemplate(
  mailboxId: string,
  templateId: string,
  input: Partial<TemplateInput>
): Promise<ActionResult<MessageTemplate>> {
  return http.action(() =>
    http.patch<MessageTemplate>(`${base(mailboxId)}/${encodeURIComponent(templateId)}`, input)
  );
}

export async function deleteTemplate(mailboxId: string, templateId: string): Promise<ActionResult> {
  return http.action(() => http.del(`${base(mailboxId)}/${encodeURIComponent(templateId)}`));
}

/**
 * "Copia de X", y si ya existe, "Copia de X (2)", "(3)"…: es un alta común con
 * el nombre ya resuelto (el backend no necesita un endpoint propio).
 */
export async function duplicateTemplate(
  mailboxId: string,
  source: MessageTemplate
): Promise<ActionResult<MessageTemplate>> {
  return http.action(async () => {
    const existing = await http.get<MessageTemplate[]>(base(mailboxId));
    const taken = new Set(existing.map((t) => normalizeText(t.name.trim())));
    const copyBase = `Copia de ${source.name}`.slice(0, 60);
    let name = copyBase;
    for (let n = 2; taken.has(normalizeText(name)); n += 1) {
      const suffix = ` (${n})`;
      name = `${copyBase.slice(0, 60 - suffix.length)}${suffix}`;
    }
    return http.post<MessageTemplate>(base(mailboxId), {
      name,
      body: source.body,
      subject: source.subject,
    });
  });
}
