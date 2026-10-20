import type { Contact, ContactGroup } from "@/lib/types/contact";

/**
 * TODO: igual que el resto de lib/api/* — reemplazar por fetch real al
 * backend (que por detrás llama a la People API de Google, con los
 * contactos y grupos de cada casilla):
 *   - GET /mailboxes/:mailboxId/contact-groups
 *   - GET /mailboxes/:mailboxId/contact-groups/:groupId/members
 *   - GET /mailboxes/:mailboxId/contacts?q=
 * Alcance de esta ronda: solo lectura — crear/editar contactos o grupos se
 * hace desde Google Contacts, no desde esta app.
 */

// Datos de ejemplo generados a partir de dos listas cortas, para tener
// suficientes contactos como para que los grupos y la búsqueda se sientan
// reales sin tener que escribir 40 filas a mano.
const FIRST_NAMES = [
  "Lucía", "Pablo", "Noelia", "Martín", "Camila", "Sofía", "Julián", "Valentina",
  "Federico", "Agustina", "Matías", "Florencia", "Nicolás", "Carolina", "Diego",
  "Romina", "Gonzalo", "Paula", "Sebastián", "Mariana",
];
const LAST_NAMES = ["Fernández", "Ríos", "Castro", "Gómez", "Suárez", "Molina", "Acosta", "Benítez"];

function buildContacts(prefix: string, count: number): Contact[] {
  return Array.from({ length: count }, (_, i) => {
    const first = FIRST_NAMES[i % FIRST_NAMES.length]!;
    const last = LAST_NAMES[(i * 3) % LAST_NAMES.length]!;
    const handle = `${first}.${last}`
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "");
    return {
      id: `${prefix}_${i + 1}`,
      name: `${first} ${last}`,
      email: `${handle}${i + 1}@mail.com`,
    };
  });
}

const CONTACTS_MBX_1 = buildContacts("ct1", 40);
const CONTACTS_MBX_2 = buildContacts("ct2", 8);

function slice(contacts: Contact[], from: number, to: number): Contact[] {
  return contacts.slice(from, to);
}

// Un contacto puede estar en más de un grupo (acá, dos donantes también
// están en "Área Salud") — igual que en Google Contacts.
const MEMBERS: Record<string, Record<string, Contact[]>> = {
  mbx_1: {
    grp_donantes: slice(CONTACTS_MBX_1, 0, 12),
    grp_salud: [...slice(CONTACTS_MBX_1, 12, 16), ...slice(CONTACTS_MBX_1, 1, 2), ...slice(CONTACTS_MBX_1, 4, 5)],
    grp_voluntarios: slice(CONTACTS_MBX_1, 18, 39),
    // Grupo sin nadie adentro, para ver el estado "grupo vacío".
    grp_archivo: [],
  },
  mbx_2: {
    grp_proveedores: slice(CONTACTS_MBX_2, 0, 4),
  },
};

const GROUP_NAMES: Record<string, Record<string, string>> = {
  mbx_1: {
    grp_donantes: "Donantes 2024",
    grp_salud: "Área Salud",
    grp_voluntarios: "Voluntarios",
    grp_archivo: "Archivo 2019",
  },
  mbx_2: {
    grp_proveedores: "Proveedores",
  },
};

const ALL_CONTACTS: Record<string, Contact[]> = {
  mbx_1: CONTACTS_MBX_1,
  mbx_2: CONTACTS_MBX_2,
};

function delay<T>(value: T, ms = 350): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

export async function getContactGroups(mailboxId: string): Promise<ContactGroup[]> {
  const names = GROUP_NAMES[mailboxId] ?? {};
  const members = MEMBERS[mailboxId] ?? {};
  const groups = Object.entries(names).map(([id, name]) => ({
    id,
    name,
    memberCount: (members[id] ?? []).length,
  }));
  return delay(groups);
}

export async function getContactGroupMembers(
  mailboxId: string,
  groupId: string
): Promise<Contact[]> {
  return delay((MEMBERS[mailboxId] ?? {})[groupId] ?? []);
}

// Sin `q` (o vacío) devuelve todos los contactos de la casilla — lo usa el
// selector de destinatarios para armar "Todos los contactos" y el
// autocompletado del campo "Para".
export async function searchContacts(mailboxId: string, q = ""): Promise<Contact[]> {
  const all = ALL_CONTACTS[mailboxId] ?? [];
  const needle = q.trim().toLowerCase();
  if (!needle) return delay(all);
  return delay(
    all.filter(
      (c) => c.name.toLowerCase().includes(needle) || c.email.toLowerCase().includes(needle)
    )
  );
}
