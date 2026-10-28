"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast/toast-context";
import { SearchIcon } from "@/components/icons";
import { getContactGroupMembers } from "@/lib/api/contacts";
import { normalizeText } from "@/lib/recipients";
import { cn } from "@/lib/utils";
import type {
  Contact,
  ContactGroup,
  ContactsDirectory,
  PickedGroup,
  PickedRecipients,
} from "@/lib/types/contact";

// "Todos los contactos" no es un grupo de Google: es una entrada fija arriba
// de la lista para poder buscar/elegir entre todos sin pasar por un grupo.
const ALL_GROUP_ID = "__all__";
const EMPTY_SET: ReadonlySet<string> = new Set();

interface MembersEntry {
  status: "loading" | "loaded" | "error";
  contacts: Contact[];
}

type CheckState = "none" | "some" | "all";

interface RecipientPickerDialogProps {
  open: boolean;
  onClose: () => void;
  mailboxId: string;
  directory: ContactsDirectory;
  onRetryDirectory: () => void;
  onAdd: (picked: PickedRecipients) => void;
  /** Emails que ya están en el campo (en minúscula): se ven tildados y no se pueden destildar acá. */
  presentEmails?: ReadonlySet<string>;
}

// Mismo patrón de explorador de dos columnas que ManageDriveDialog (acá la
// columna izquierda son los grupos de Google Contacts, la derecha sus
// miembros). El checkbox de cada grupo selecciona sus N contactos de una
// sola vez; los de la derecha afinan la selección dentro de un grupo.
// Alcance de esta ronda: solo elegir — crear o editar contactos y grupos se
// hace desde Google Contacts.
export function RecipientPickerDialog({
  open,
  onClose,
  mailboxId,
  directory,
  onRetryDirectory,
  onAdd,
  presentEmails = EMPTY_SET,
}: RecipientPickerDialogProps) {
  const { showToast } = useToast();
  const [query, setQuery] = useState("");
  const [focusedId, setFocusedId] = useState(ALL_GROUP_ID);
  const [selected, setSelected] = useState<Record<string, Contact>>({});
  const [members, setMembers] = useState<Record<string, MembersEntry>>({});
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [retryToken, setRetryToken] = useState(0);

  // Espejo del estado `members` para poder leerlo dentro de funciones async
  // sin quedarse con una copia vieja del cierre.
  const membersRef = useRef(members);
  membersRef.current = members;

  // Cada vez que se abre (o cambia la casilla) se arranca de cero: sin
  // búsqueda, sin selección, sin miembros cacheados de otra vez.
  useEffect(() => {
    if (!open) return;
    setQuery("");
    setFocusedId(ALL_GROUP_ID);
    setSelected({});
    setMembers({});
    setTogglingId(null);
  }, [open, mailboxId]);

  async function loadMembers(groupId: string): Promise<Contact[]> {
    if (groupId === ALL_GROUP_ID) return directory.contacts;
    const cached = membersRef.current[groupId];
    if (cached?.status === "loaded") return cached.contacts;
    setMembers((prev) => ({ ...prev, [groupId]: { status: "loading", contacts: [] } }));
    try {
      const contacts = await getContactGroupMembers(mailboxId, groupId);
      setMembers((prev) => ({ ...prev, [groupId]: { status: "loaded", contacts } }));
      return contacts;
    } catch (error) {
      setMembers((prev) => ({ ...prev, [groupId]: { status: "error", contacts: [] } }));
      throw error;
    }
  }

  // Al enfocar un grupo (o al apretar "Reintentar") se piden sus miembros.
  // El error queda guardado en `members` y la columna derecha lo muestra.
  useEffect(() => {
    if (!open || focusedId === ALL_GROUP_ID) return;
    loadMembers(focusedId).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, focusedId, retryToken]);

  const allGroups: ContactGroup[] = useMemo(
    () => [
      { id: ALL_GROUP_ID, name: "Todos los contactos", memberCount: directory.contacts.length },
      ...directory.groups,
    ],
    [directory.groups, directory.contacts.length]
  );

  const needle = normalizeText(query.trim());
  const visibleGroups = needle
    ? allGroups.filter((g) => normalizeText(g.name).includes(needle))
    : allGroups;
  const searchResults = needle
    ? directory.contacts.filter(
        (c) => normalizeText(c.name).includes(needle) || normalizeText(c.email).includes(needle)
      )
    : [];

  function getLoadedMembers(groupId: string): Contact[] | null {
    if (groupId === ALL_GROUP_ID) return directory.contacts;
    const entry = members[groupId];
    return entry?.status === "loaded" ? entry.contacts : null;
  }

  function groupCheckState(groupId: string): CheckState {
    const list = getLoadedMembers(groupId);
    if (!list || list.length === 0) return "none";
    const count = list.filter((c) => selected[c.id] !== undefined).length;
    if (count === 0) return "none";
    return count === list.length ? "all" : "some";
  }

  function toggleContact(contact: Contact) {
    setSelected((prev) => {
      const next = { ...prev };
      if (next[contact.id] !== undefined) delete next[contact.id];
      else next[contact.id] = contact;
      return next;
    });
  }

  async function toggleGroup(group: ContactGroup) {
    setTogglingId(group.id);
    try {
      const list = await loadMembers(group.id);
      setSelected((prev) => {
        const allSelected = list.length > 0 && list.every((c) => prev[c.id] !== undefined);
        const next = { ...prev };
        for (const contact of list) {
          if (allSelected) delete next[contact.id];
          else next[contact.id] = contact;
        }
        return next;
      });
    } catch {
      showToast("error", "No pudimos cargar los contactos del grupo. Intentá de nuevo.");
    } finally {
      setTogglingId(null);
    }
  }

  function focusGroup(groupId: string) {
    setQuery("");
    setFocusedId(groupId);
  }

  // Un grupo cuenta como "elegido entero" si todos sus miembros están
  // tildados. Si dos grupos se pisan (o "Todos los contactos" está completo),
  // se prefiere el más grande y no se repite lo que ya cubre — lo que
  // sobra queda como contactos sueltos.
  const picked: PickedRecipients = useMemo(() => {
    const selectedList = Object.values(selected);
    const selectedIds = new Set(selectedList.map((c) => c.id));
    const candidates: PickedGroup[] = [];

    if (directory.contacts.length > 0 && directory.contacts.every((c) => selectedIds.has(c.id))) {
      candidates.push({ id: ALL_GROUP_ID, name: "Todos los contactos", members: directory.contacts });
    }
    for (const group of directory.groups) {
      const entry = members[group.id];
      if (
        entry?.status === "loaded" &&
        entry.contacts.length > 0 &&
        entry.contacts.every((c) => selectedIds.has(c.id))
      ) {
        candidates.push({ id: group.id, name: group.name, members: entry.contacts });
      }
    }
    candidates.sort((a, b) => b.members.length - a.members.length);

    const covered = new Set<string>();
    const groups: PickedGroup[] = [];
    for (const candidate of candidates) {
      if (candidate.members.some((c) => !covered.has(c.id))) {
        groups.push(candidate);
        for (const c of candidate.members) covered.add(c.id);
      }
    }
    return { groups, contacts: selectedList.filter((c) => !covered.has(c.id)) };
  }, [selected, members, directory.contacts, directory.groups]);

  const nothingPicked = picked.groups.length === 0 && picked.contacts.length === 0;

  function describePicked(): string {
    if (nothingPicked) return "Nada seleccionado";
    const parts: string[] = [];
    if (picked.groups.length > 0) {
      const unique = new Set(picked.groups.flatMap((g) => g.members.map((c) => c.id))).size;
      parts.push(
        `${picked.groups.length} ${picked.groups.length === 1 ? "grupo completo" : "grupos completos"} (${unique})`
      );
    }
    if (picked.contacts.length > 0) {
      parts.push(
        `${picked.contacts.length} ${picked.contacts.length === 1 ? "contacto suelto" : "contactos sueltos"}`
      );
    }
    return parts.join(" · ");
  }

  function handleAdd() {
    onAdd(picked);
    onClose();
  }

  const focusedGroup = allGroups.find((g) => g.id === focusedId);
  const focusedEntry = focusedId === ALL_GROUP_ID ? undefined : members[focusedId];
  const focusedMembers = getLoadedMembers(focusedId);

  return (
    <Dialog
      open={open}
      title="Elegir destinatarios"
      onClose={onClose}
      maxWidthClassName="max-w-[560px]"
    >
      {(directory.status === "idle" || directory.status === "loading") && (
        <div className="flex flex-col items-center gap-2 py-12 text-xs text-gray-500">
          <span
            aria-hidden="true"
            className="h-5 w-5 animate-spin rounded-full border-[2.5px] border-gray-200 border-t-primary-700"
          />
          Cargando contactos…
        </div>
      )}

      {directory.status === "error" && (
        <div className="py-2">
          <div
            role="alert"
            className="mb-2 rounded-md border border-red-200 bg-danger-bg px-3 py-2 text-xs text-danger-text"
          >
            No pudimos cargar tus contactos de Google.
          </div>
          <Button type="button" variant="secondary" onClick={onRetryDirectory}>
            Reintentar
          </Button>
        </div>
      )}

      {directory.status === "loaded" && (
        <>
          <div className="relative mb-3">
            <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              // Este diálogo vive adentro del <form> de Redactar: sin esto,
              // Enter en el buscador enviaría el mensaje.
              onKeyDown={(e) => {
                if (e.key === "Enter") e.preventDefault();
              }}
              placeholder="Buscar contacto o grupo…"
              aria-label="Buscar contacto o grupo"
              className="pl-8"
            />
          </div>

          <div className="flex min-h-[220px] flex-col overflow-hidden rounded-md border border-gray-200 sm:flex-row">
            {/* Columna izquierda: grupos */}
            <div className="max-h-40 overflow-y-auto border-b border-gray-200 p-2 sm:max-h-[280px] sm:w-[42%] sm:shrink-0 sm:border-b-0 sm:border-r">
              <p className="px-2 pb-1.5 pt-0.5 text-[11px] font-medium uppercase tracking-wide text-gray-400">
                Grupos
              </p>
              {visibleGroups.length === 0 ? (
                <p className="px-2 py-3 text-xs text-gray-400">Ningún grupo coincide.</p>
              ) : (
                <ul aria-label="Grupos">
                  {visibleGroups.map((group) => {
                    const state = groupCheckState(group.id);
                    const isFocused = !needle && focusedId === group.id;
                    return (
                      <li
                        key={group.id}
                        className={cn(
                          "flex items-center gap-2 rounded-md px-2 py-1.5",
                          isFocused && "bg-primary-100/40"
                        )}
                      >
                        <GroupCheckbox
                          state={state}
                          disabled={group.memberCount === 0 || togglingId === group.id}
                          label={`Seleccionar todos los contactos de ${group.name}`}
                          onChange={() => void toggleGroup(group)}
                        />
                        <button
                          type="button"
                          onClick={() => focusGroup(group.id)}
                          aria-current={isFocused ? "true" : undefined}
                          className={cn(
                            "min-w-0 flex-1 truncate text-left text-sm hover:underline",
                            isFocused ? "font-medium text-primary-700" : "text-gray-800"
                          )}
                        >
                          {group.name}
                        </button>
                        <span className="shrink-0 text-[11px] text-gray-400">{group.memberCount}</span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {/* Columna derecha: miembros del grupo, o resultados de la búsqueda */}
            <div className="min-w-0 flex-1 overflow-y-auto p-2 sm:max-h-[280px]">
              {needle ? (
                <>
                  <p className="px-2 pb-1.5 pt-0.5 text-[11px] font-medium uppercase tracking-wide text-gray-400">
                    Resultados · {searchResults.length}
                  </p>
                  {searchResults.length === 0 ? (
                    <p className="px-2 py-8 text-center text-xs text-gray-500">
                      No encontramos contactos que coincidan con tu búsqueda.
                    </p>
                  ) : (
                    <ContactRows
                      contacts={searchResults}
                      selected={selected}
                      present={presentEmails}
                      onToggle={toggleContact}
                    />
                  )}
                </>
              ) : (
                <>
                  <p className="px-2 pb-1.5 pt-0.5 text-[11px] font-medium uppercase tracking-wide text-gray-400">
                    {focusedGroup?.name ?? "Contactos"}
                    {focusedMembers ? ` · ${focusedMembers.length}` : ""}
                  </p>

                  {focusedEntry?.status === "error" && (
                    <div className="p-1">
                      <div
                        role="alert"
                        className="mb-2 rounded-md border border-red-200 bg-danger-bg px-3 py-2 text-xs text-danger-text"
                      >
                        No pudimos cargar los contactos de este grupo.
                      </div>
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => setRetryToken((n) => n + 1)}
                      >
                        Reintentar
                      </Button>
                    </div>
                  )}

                  {!focusedMembers && focusedEntry?.status !== "error" && (
                    <div className="flex flex-col items-center gap-2 py-8 text-xs text-gray-500">
                      <span
                        aria-hidden="true"
                        className="h-4 w-4 animate-spin rounded-full border-2 border-gray-200 border-t-primary-700"
                      />
                      Cargando contactos…
                    </div>
                  )}

                  {focusedMembers && focusedMembers.length === 0 && (
                    <p className="px-2 py-8 text-center text-xs text-gray-500">
                      Este grupo no tiene contactos todavía.
                    </p>
                  )}

                  {focusedMembers && focusedMembers.length > 0 && (
                    <ContactRows
                      contacts={focusedMembers}
                      selected={selected}
                      present={presentEmails}
                      onToggle={toggleContact}
                    />
                  )}
                </>
              )}
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between gap-3">
            <span className="text-xs text-gray-500">{describePicked()}</span>
            <div className="flex shrink-0 gap-2">
              <Button type="button" variant="secondary" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="button" onClick={handleAdd} disabled={nothingPicked}>
                Agregar
              </Button>
            </div>
          </div>
        </>
      )}
    </Dialog>
  );
}

function ContactRows({
  contacts,
  selected,
  present,
  onToggle,
}: {
  contacts: Contact[];
  selected: Record<string, Contact>;
  /** Ya están en el campo: tildados, sin poder tocarlos (para sacarlos, la ✕ del chip). */
  present: ReadonlySet<string>;
  onToggle: (contact: Contact) => void;
}) {
  return (
    <ul aria-label="Contactos">
      {contacts.map((contact) => {
        const alreadyIn = present.has(contact.email.toLowerCase());
        const checked = alreadyIn || selected[contact.id] !== undefined;
        return (
          <li key={contact.id}>
            <label
              className={cn(
                "flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition-colors",
                alreadyIn ? "cursor-default" : "cursor-pointer hover:bg-gray-50",
                checked && "bg-primary-100/40"
              )}
              title={alreadyIn ? "Ya está agregado" : undefined}
            >
              <input
                type="checkbox"
                checked={checked}
                disabled={alreadyIn}
                onChange={() => onToggle(contact)}
              />
              <span className="min-w-0 flex-1 truncate text-gray-800">
                {contact.name} <span className="text-gray-400">&lt;{contact.email}&gt;</span>
              </span>
              {alreadyIn && <span className="shrink-0 text-[11px] text-gray-400">ya agregado</span>}
            </label>
          </li>
        );
      })}
    </ul>
  );
}

// Checkbox con tres estados: ninguno, algunos (el guion de "indeterminate" —
// solo se puede poner por JS, no por atributo) o todos los contactos del
// grupo tildados.
function GroupCheckbox({
  state,
  disabled,
  label,
  onChange,
}: {
  state: CheckState;
  disabled: boolean;
  label: string;
  onChange: () => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = state === "some";
  }, [state]);
  return (
    <input
      ref={ref}
      type="checkbox"
      checked={state === "all"}
      disabled={disabled}
      onChange={onChange}
      aria-label={label}
    />
  );
}
