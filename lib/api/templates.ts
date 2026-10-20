import type { MessageTemplate, TemplateInput } from "@/lib/types/template";
import { htmlToPlainText } from "@/lib/utils";
import { normalizeText } from "@/lib/recipients";

/**
 * TODO: igual que el resto de lib/api/* — reemplazar por fetch real al
 * backend (contrato propuesto en el brief, sección 6.8):
 *   GET    /mailboxes/:id/templates
 *   POST   /mailboxes/:id/templates        { name, body }   (409 TEMPLATE_NAME_TAKEN)
 *   PATCH  /mailboxes/:id/templates/:tplId { name?, body? } (409 TEMPLATE_NAME_TAKEN)
 *   DELETE /mailboxes/:id/templates/:tplId
 *
 * Mientras tanto, las plantillas viven en memoria de esta pestaña: lo que se
 * crea, edita o borra en la pantalla "Plantillas" se ve también en el menú
 * "Insertar plantilla" de Redactar, y se pierde al recargar la página.
 * (Estas funciones se llaman desde componentes de cliente, por eso el
 * estado vive en el módulo y no en una server action.)
 */

export class TemplateNameTakenError extends Error {
  constructor() {
    super("TEMPLATE_NAME_TAKEN");
    this.name = "TemplateNameTakenError";
  }
}

const DAY = 24 * 60 * 60 * 1000;
const ago = (days: number) => new Date(Date.now() - days * DAY).toISOString();

const SEED: Record<string, MessageTemplate[]> = {
  mbx_1: [
    {
      id: "tpl_1",
      name: "Confirmación de reunión",
      preview: "Hola, confirmamos la reunión para…",
      body:
        "<p>Hola,</p><p>Confirmamos la reunión de comisión directiva para el <strong>[fecha]</strong> a las <strong>[hora]</strong>.</p><p>Saludos,<br>Secretaría Corebio</p>",
      updatedAt: ago(2),
      updatedByName: "Ana Ruiz",
    },
    {
      id: "tpl_2",
      name: "Convenio de práctica",
      preview: "Nos gustaría coordinar un convenio de práctica…",
      body:
        "<p>Buenas,</p><p>Nos gustaría coordinar un convenio de práctica para residentes con la comisión directiva de Corebio.</p><p>Quedamos atentos, saludos.</p>",
      updatedAt: ago(8),
      updatedByName: "Martín Iglesias",
    },
  ],
  mbx_2: [
    {
      id: "tpl_3",
      name: "Recordatorio de pago",
      preview: "Te recordamos que la cuota vence…",
      body:
        "<p>Hola,</p><p>Te recordamos que la cuota de este mes vence el <strong>[fecha]</strong>.</p><p>Saludos,<br>Tesorería Corebio</p>",
      updatedAt: ago(17),
      updatedByName: "Ana Ruiz",
    },
  ],
};

const store = new Map<string, MessageTemplate[]>();
let nextId = 100;

function listFor(mailboxId: string): MessageTemplate[] {
  let list = store.get(mailboxId);
  if (!list) {
    list = (SEED[mailboxId] ?? []).map((t) => ({ ...t }));
    store.set(mailboxId, list);
  }
  return list;
}

function delay<T>(value: T, ms = 300): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

function makePreview(body: string): string {
  const text = htmlToPlainText(body);
  return text.length > 48 ? `${text.slice(0, 48).trimEnd()}…` : text;
}

function sameName(a: string, b: string): boolean {
  return normalizeText(a.trim()) === normalizeText(b.trim());
}

function assertNameFree(list: MessageTemplate[], name: string, exceptId?: string) {
  if (list.some((t) => t.id !== exceptId && sameName(t.name, name))) {
    throw new TemplateNameTakenError();
  }
}

function sorted(list: MessageTemplate[]): MessageTemplate[] {
  return [...list]
    .sort((a, b) => a.name.localeCompare(b.name, "es"))
    .map((t) => ({ ...t }));
}

const CURRENT_USER_NAME = "Martín Iglesias";

export async function getTemplatesForMailbox(mailboxId: string): Promise<MessageTemplate[]> {
  return delay(sorted(listFor(mailboxId)));
}

export async function createTemplate(
  mailboxId: string,
  input: TemplateInput
): Promise<MessageTemplate> {
  const list = listFor(mailboxId);
  await delay(null, 500);
  assertNameFree(list, input.name);
  nextId += 1;
  const created: MessageTemplate = {
    id: `tpl_${nextId}`,
    name: input.name.trim(),
    body: input.body,
    preview: makePreview(input.body),
    updatedAt: new Date().toISOString(),
    updatedByName: CURRENT_USER_NAME,
  };
  list.push(created);
  return { ...created };
}

export async function updateTemplate(
  mailboxId: string,
  templateId: string,
  input: TemplateInput
): Promise<MessageTemplate> {
  const list = listFor(mailboxId);
  await delay(null, 500);
  const current = list.find((t) => t.id === templateId);
  if (!current) throw new Error("TEMPLATE_NOT_FOUND");
  assertNameFree(list, input.name, templateId);
  current.name = input.name.trim();
  current.body = input.body;
  current.preview = makePreview(input.body);
  current.updatedAt = new Date().toISOString();
  current.updatedByName = CURRENT_USER_NAME;
  return { ...current };
}

export async function deleteTemplate(mailboxId: string, templateId: string): Promise<void> {
  const list = listFor(mailboxId);
  await delay(null, 400);
  const index = list.findIndex((t) => t.id === templateId);
  if (index >= 0) list.splice(index, 1);
}

// "Copia de X", y si ya existe, "Copia de X (2)", "(3)"… — el backend no
// necesita saber nada de esto: es un POST común con el nombre ya resuelto.
export async function duplicateTemplate(
  mailboxId: string,
  templateId: string
): Promise<MessageTemplate> {
  const list = listFor(mailboxId);
  const source = list.find((t) => t.id === templateId);
  if (!source) throw new Error("TEMPLATE_NOT_FOUND");
  const base = `Copia de ${source.name}`;
  let name = base;
  for (let n = 2; list.some((t) => sameName(t.name, name)); n += 1) {
    name = `${base} (${n})`;
  }
  return createTemplate(mailboxId, { name, body: source.body });
}
