"use client";

import {
  useCallback,
  forwardRef,
  useEffect,
  useId,
  useImperativeHandle,
  useRef,
  useState,
  type ClipboardEvent as ReactClipboardEvent,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import {
  useFloating,
  autoUpdate,
  offset,
  flip,
  size,
  FloatingPortal,
} from "@floating-ui/react";
import { ChevronDownIcon, FolderIcon, SearchIcon, XIcon } from "@/components/icons";
import { useToast } from "@/components/ui/toast/toast-context";
import { RecipientPickerDialog } from "@/components/compose/recipient-picker-dialog";
import { getContactGroupMembers, getContactGroups, searchContacts } from "@/lib/api/contacts";
import {
  isValidEmail,
  normalizeText,
  parseRecipients,
  serializeRecipients,
  uniqueEmails,
} from "@/lib/recipients";
import { pushDialogLayer, popDialogLayer, isTopDialogLayer } from "@/lib/dialog-stack";
import { cn } from "@/lib/utils";
import type {
  Contact,
  ContactGroup,
  ContactsDirectory,
  PickedGroup,
  PickedRecipients,
} from "@/lib/types/contact";

type RecipientEntry =
  | { kind: "person"; key: string; email: string; name?: string }
  | {
      kind: "group";
      key: string;
      groupId: string;
      name: string;
      members: Contact[];
      expanded: boolean;
    };

type SuggestionOption =
  | { type: "group"; group: ContactGroup }
  | { type: "contact"; contact: Contact };

export interface RecipientInputHandle {
  // Agrega grupos enteros como chips (lo usa el form para mandar a Cco los
  // grupos que se eligieron desde el campo "Para").
  // Devuelve cuántos eran nuevos (los que ya estaban no se repiten).
  addGroups: (groups: PickedGroup[]) => number;
}

interface RecipientInputProps {
  id: string;
  // Si se pasa, los grupos que se elijan en este campo (autocompletado o
  // diálogo) no se agregan acá: se entregan a esta función, y las personas
  // sueltas sí quedan. Así "Para" nunca expone a los miembros de un grupo.
  onGroupsPicked?: (groups: PickedGroup[]) => void;
  placeholder?: string;
  // Los contactos y grupos son de cada casilla (la de "De").
  mailboxId: string;
  // Direcciones separadas por coma — el mismo formato que guarda el form
  // (ver lib/recipients.ts). Solo se lee al montar: los cambios de acá para
  // afuera salen por onChange.
  value: string;
  onChange: (value: string) => void;
  invalid?: boolean;
  describedBy?: string;
  disabled?: boolean;
}

function emailsOf(list: RecipientEntry[]): string[] {
  return list.flatMap((entry) =>
    entry.kind === "person" ? [entry.email] : entry.members.map((m) => m.email)
  );
}

// Lo que va al form: los chips más lo que se esté escribiendo todavía — así
// una dirección tipeada y no confirmada no se pierde, y una a medias
// ("lucia") se marca como inválida en vez de ignorarse sin avisar.
function buildValue(list: RecipientEntry[], draft: string): string {
  const pending = draft.trim();
  const emails = emailsOf(list);
  return serializeRecipients(pending ? [...emails, pending] : emails);
}

const EMPTY_DIRECTORY: ContactsDirectory = { status: "idle", groups: [], contacts: [] };
/** Cuántos chips se ven antes de "y N más". */
const COLLAPSE_AFTER = 8;

// Campo "Para" de Redactar: un combobox de chips. Cada destinatario —persona
// o grupo— es un chip que se quita solo; se puede seguir escribiendo una
// dirección suelta (Enter o coma la confirma) o buscar entre los contactos y
// grupos de Google de la casilla, ya sea escribiendo (autocompletado) o con
// el botón de la lupa (diálogo con todos los grupos).
//
// Un grupo se agrega colapsado, como un solo chip con su cantidad de
// miembros: para el envío igual se arma la lista completa de direcciones,
// el colapso es solo visual.
export const RecipientInput = forwardRef<RecipientInputHandle, RecipientInputProps>(
  function RecipientInput(
    {
      id,
      mailboxId,
      value,
      onChange,
      invalid,
      describedBy,
      disabled,
      onGroupsPicked,
      placeholder,
    },
    handleRef
  ) {
  const { showToast } = useToast();
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const keyCounter = useRef(0);
  const makeKey = () => {
    keyCounter.current += 1;
    return `rcp_${keyCounter.current}`;
  };

  const [entries, setEntries] = useState<RecipientEntry[]>(() =>
    uniqueEmails(parseRecipients(value)).map((email) => ({
      kind: "person" as const,
      key: makeKey(),
      email,
    }))
  );
  // Copia síncrona de `entries` para las funciones async (agregar un grupo
  // espera una respuesta) — evita pisar chips agregados mientras tanto.
  const entriesRef = useRef(entries);
  const [draft, setDraft] = useState("");
  const [focused, setFocused] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [addingGroupId, setAddingGroupId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [directory, setDirectory] = useState<ContactsDirectory>(EMPTY_DIRECTORY);
  const directoryRequest = useRef(0);

  function apply(next: RecipientEntry[], nextDraft: string) {
    entriesRef.current = next;
    setEntries(next);
    setDraft(nextDraft);
    onChange(buildValue(next, nextDraft));
  }

  // --- Contactos y grupos de la casilla (se piden una sola vez) ----------

  const loadDirectory = useCallback(() => {
    const requestId = ++directoryRequest.current;
    setDirectory((prev) => ({ ...prev, status: "loading" }));
    Promise.all([getContactGroups(mailboxId), searchContacts(mailboxId)])
      .then(([groups, contacts]) => {
        if (requestId !== directoryRequest.current) return;
        setDirectory({ status: "loaded", groups, contacts });
      })
      .catch(() => {
        if (requestId !== directoryRequest.current) return;
        setDirectory({ status: "error", groups: [], contacts: [] });
      });
  }, [mailboxId]);

  // Otra casilla "De" = otros contactos: se descarta lo cargado (y cualquier
  // respuesta que todavía venga en camino) y se vuelve a pedir al usar el campo.
  useEffect(() => {
    directoryRequest.current += 1;
    setDirectory(EMPTY_DIRECTORY);
  }, [mailboxId]);

  function ensureDirectory() {
    if (directory.status === "idle" || directory.status === "error") loadDirectory();
  }

  // --- Autocompletado -------------------------------------------------------

  const needle = normalizeText(draft.trim());
  const taken = new Set(emailsOf(entries).map((email) => email.toLowerCase()));

  const options: SuggestionOption[] = [];
  if (needle) {
    for (const group of directory.groups) {
      if (options.length >= 3) break;
      const alreadyAdded = entries.some((e) => e.kind === "group" && e.groupId === group.id);
      if (group.memberCount > 0 && !alreadyAdded && normalizeText(group.name).includes(needle)) {
        options.push({ type: "group", group });
      }
    }
    let contactCount = 0;
    for (const contact of directory.contacts) {
      if (contactCount >= 6) break;
      if (taken.has(contact.email.toLowerCase())) continue;
      if (
        normalizeText(contact.name).includes(needle) ||
        normalizeText(contact.email).includes(needle)
      ) {
        options.push({ type: "contact", contact });
        contactCount += 1;
      }
    }
  }

  const directoryPending = directory.status === "idle" || directory.status === "loading";
  const showMenu =
    focused &&
    !dismissed &&
    needle.length > 0 &&
    (directoryPending || directory.status === "error" || options.length > 0);
  const safeIndex = Math.min(activeIndex, Math.max(options.length - 1, 0));

  const { refs, floatingStyles } = useFloating({
    open: showMenu,
    placement: "bottom-start",
    middleware: [
      offset(4),
      flip({ padding: 8 }),
      size({
        padding: 8,
        apply({ rects, elements }) {
          elements.floating.style.width = `${rects.reference.width}px`;
        },
      }),
    ],
    whileElementsMounted: autoUpdate,
  });

  useEffect(() => {
    setActiveIndex(0);
  }, [needle]);

  const layerId = useRef<symbol>();
  if (!layerId.current) layerId.current = Symbol("recipient-input");

  // Mismo motivo que TemplatePicker: mientras el menú está abierto, Escape
  // lo cierra a él solo y no al modal de Redactar entero (ver lib/dialog-stack.ts).
  useEffect(() => {
    if (!showMenu) return;
    const layer = layerId.current!;
    pushDialogLayer(layer);
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isTopDialogLayer(layer)) setDismissed(true);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      popDialogLayer(layer);
    };
  }, [showMenu]);

  // --- Acciones sobre los chips -------------------------------------------

  function addEmails(emails: string[]) {
    const current = entriesRef.current;
    const have = new Set(emailsOf(current).map((email) => email.toLowerCase()));
    const additions = uniqueEmails(emails).filter((email) => !have.has(email.toLowerCase()));
    const next: RecipientEntry[] = [
      ...current,
      ...additions.map((email) => ({ kind: "person" as const, key: makeKey(), email })),
    ];
    apply(next, "");
  }

  function commitDraft() {
    const emails = parseRecipients(draft);
    if (emails.length === 0) return;
    addEmails(emails);
  }

  function addContact(contact: Contact) {
    const current = entriesRef.current;
    const exists = emailsOf(current).some(
      (email) => email.toLowerCase() === contact.email.toLowerCase()
    );
    if (exists) {
      apply(current, "");
      return;
    }
    apply(
      [
        ...current,
        { kind: "person", key: makeKey(), email: contact.email, name: contact.name },
      ],
      ""
    );
  }

  async function addGroup(group: ContactGroup) {
    setAddingGroupId(group.id);
    try {
      const members = await getContactGroupMembers(mailboxId, group.id);
      if (members.length === 0) {
        showToast("error", `El grupo "${group.name}" no tiene contactos todavía.`);
        return;
      }
      const picked = { id: group.id, name: group.name, members };
      if (onGroupsPicked) {
        onGroupsPicked([picked]);
        setDraft("");
        onChange(buildValue(entriesRef.current, ""));
        return;
      }
      apply(mergeGroups(entriesRef.current, [picked]), "");
    } catch {
      showToast("error", "No pudimos agregar el grupo. Intentá de nuevo.");
    } finally {
      setAddingGroupId(null);
    }
  }

  function pickOption(option: SuggestionOption) {
    if (addingGroupId !== null) return;
    if (option.type === "contact") addContact(option.contact);
    else void addGroup(option.group);
    inputRef.current?.focus();
  }

  // Lo que devuelve el diálogo "Elegir desde contactos": grupos completos
  // (un chip cada uno) y contactos sueltos.
  function mergeGroups(base: RecipientEntry[], groups: PickedGroup[]): RecipientEntry[] {
    const next = [...base];
    for (const group of groups) {
      const index = next.findIndex((e) => e.kind === "group" && e.groupId === group.id);
      const existing = index >= 0 ? next[index] : undefined;
      const entry: RecipientEntry = {
        kind: "group",
        key: existing ? existing.key : makeKey(),
        groupId: group.id,
        name: group.name,
        members: group.members,
        expanded: existing?.kind === "group" ? existing.expanded : false,
      };
      if (index >= 0) next[index] = entry;
      else next.push(entry);
    }
    return next;
  }

  useImperativeHandle(handleRef, () => ({
    addGroups: (groups) => {
      const current = entriesRef.current;
      const added = groups.filter(
        (g) => !current.some((e) => e.kind === "group" && e.groupId === g.id)
      ).length;
      apply(mergeGroups(current, groups), draft);
      return added;
    },
  }));

  function handlePicked(picked: PickedRecipients) {
    let next = [...entriesRef.current];
    if (onGroupsPicked) {
      if (picked.groups.length > 0) onGroupsPicked(picked.groups);
    } else {
      next = mergeGroups(next, picked.groups);
    }
    const have = new Set(emailsOf(next).map((email) => email.toLowerCase()));
    for (const contact of picked.contacts) {
      const key = contact.email.toLowerCase();
      if (have.has(key)) continue;
      have.add(key);
      next.push({ kind: "person", key: makeKey(), email: contact.email, name: contact.name });
    }
    apply(next, "");
  }

  function removeEntry(key: string) {
    apply(
      entriesRef.current.filter((e) => e.key !== key),
      draft
    );
  }

  function removeMember(groupKey: string, contactId: string) {
    const next: RecipientEntry[] = [];
    for (const entry of entriesRef.current) {
      if (entry.key !== groupKey || entry.kind !== "group") {
        next.push(entry);
        continue;
      }
      const members = entry.members.filter((m) => m.id !== contactId);
      // Un grupo al que le sacaron a todos deja de tener sentido: se va.
      if (members.length > 0) next.push({ ...entry, members });
    }
    apply(next, draft);
  }

  function toggleExpanded(key: string) {
    const next = entriesRef.current.map((entry) =>
      entry.key === key && entry.kind === "group" ? { ...entry, expanded: !entry.expanded } : entry
    );
    // Solo cambia cómo se ve, no a quién se manda: no hay nada que avisarle al form.
    entriesRef.current = next;
    setEntries(next);
  }

  // --- Teclado / pegado ---------------------------------------------------

  function handleDraftChange(text: string) {
    setDraft(text);
    setDismissed(false);
    onChange(buildValue(entriesRef.current, text));
  }

  function handleKeyDown(e: ReactKeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      if (showMenu && options.length > 0) {
        e.preventDefault();
        const step = e.key === "ArrowDown" ? 1 : -1;
        setActiveIndex((safeIndex + step + options.length) % options.length);
      }
      return;
    }
    if (e.key === "Enter") {
      // Enter nunca envía el mensaje desde este campo: confirma lo que se
      // está escribiendo (o la sugerencia resaltada).
      e.preventDefault();
      const option = showMenu ? options[safeIndex] : undefined;
      if (option) pickOption(option);
      else commitDraft();
      return;
    }
    if (e.key === "," || e.key === ";") {
      e.preventDefault();
      commitDraft();
      return;
    }
    if (e.key === "Backspace" && draft === "") {
      // Con chips ocultos ("y N más"), el último no se ve: primero se despliegan.
      if (hiddenCount > 0) {
        setShowAll(true);
        return;
      }
      const last = entriesRef.current[entriesRef.current.length - 1];
      // Solo una persona: quitar de un Backspace un grupo entero (12
      // contactos) sería demasiado fácil de hacer sin querer.
      if (last && last.kind === "person") removeEntry(last.key);
    }
  }

  function handlePaste(e: ReactClipboardEvent<HTMLInputElement>) {
    const text = e.clipboardData.getData("text");
    // Una lista pegada (varias direcciones) se convierte en chips de una
    // vez; una sola palabra se deja pegar como texto normal, por si es una
    // búsqueda.
    if (/[,;\s]/.test(text.trim())) {
      e.preventDefault();
      addEmails(parseRecipients(text));
    }
  }

  function handleBlur() {
    setFocused(false);
    const pending = draft.trim();
    // Una dirección completa y válida se confirma sola al salir del campo;
    // un texto a medias queda escrito (y el form lo marca como inválido).
    if (pending && isValidEmail(pending)) commitDraft();
  }

  function openDialog() {
    ensureDirectory();
    setDialogOpen(true);
  }

  const hasEntries = entries.length > 0;
  // Con muchos destinatarios (por ejemplo, una lista pegada) se ven los
  // primeros y "y N más", como en Gmail; desplegados, el campo tiene alto
  // máximo y scrollea adentro.
  const hiddenCount = showAll ? 0 : Math.max(entries.length - COLLAPSE_AFTER, 0);
  const visibleEntries = hiddenCount > 0 ? entries.slice(0, COLLAPSE_AFTER) : entries;

  return (
    <>
      <div
        ref={refs.setReference}
        onClick={(e) => {
          if (e.target === e.currentTarget) inputRef.current?.focus();
        }}
        // min-w-0: sin esto, un grupo expandido (muchos chips) ensancha el campo
        // más allá del formulario en vez de bajar de línea.
        className="flex max-h-40 min-h-[28px] min-w-0 flex-1 flex-wrap items-center gap-1.5 overflow-y-auto"
      >
        {visibleEntries.map((entry) =>
          entry.kind === "person" ? (
            <PersonChip
              key={entry.key}
              email={entry.email}
              name={entry.name}
              disabled={disabled}
              onRemove={() => removeEntry(entry.key)}
            />
          ) : (
            <GroupChips
              key={entry.key}
              entry={entry}
              disabled={disabled}
              onToggle={() => toggleExpanded(entry.key)}
              onRemove={() => removeEntry(entry.key)}
              onRemoveMember={(contactId) => removeMember(entry.key, contactId)}
            />
          )
        )}
        {hiddenCount > 0 && (
          <button
            type="button"
            onClick={() => setShowAll(true)}
            className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600 hover:bg-gray-200"
          >
            y {hiddenCount} más
          </button>
        )}
        {showAll && entries.length > COLLAPSE_AFTER && (
          <button
            type="button"
            onClick={() => setShowAll(false)}
            className="rounded-full px-2 py-0.5 text-xs text-primary-700 hover:underline"
          >
            ver menos
          </button>
        )}

        <input
          ref={inputRef}
          id={id}
          type="text"
          inputMode="email"
          autoComplete="off"
          role="combobox"
          aria-expanded={showMenu}
          aria-controls={`${listId}-listbox`}
          aria-autocomplete="list"
          aria-activedescendant={
            showMenu && options.length > 0 ? `${listId}-opt-${safeIndex}` : undefined
          }
          aria-invalid={invalid}
          aria-describedby={describedBy}
          value={draft}
          disabled={disabled}
          placeholder={
            // Corto a propósito: en el celular el campo es angosto y uno largo se cortaba.
            hasEntries ? "Escribir o buscar…" : placeholder ?? "Email o contacto"
          }
          onChange={(e) => handleDraftChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          onFocus={() => {
            setFocused(true);
            ensureDirectory();
          }}
          onBlur={handleBlur}
          className="min-w-[8rem] flex-1 border-none bg-transparent p-0 text-sm text-gray-900 outline-none placeholder:text-gray-400 disabled:cursor-not-allowed"
        />

        <button
          type="button"
          onClick={openDialog}
          disabled={disabled}
          aria-label="Elegir de contactos"
          className="ml-auto shrink-0 rounded-md border border-gray-300 p-1.5 text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <SearchIcon className="h-3.5 w-3.5" />
        </button>
      </div>

      {showMenu && (
        <FloatingPortal>
          <div
            ref={refs.setFloating}
            style={floatingStyles}
            className="z-50 rounded-md border border-gray-200 bg-white p-1 shadow-md"
          >
            {directoryPending && (
              <div className="px-3 py-2 text-xs text-gray-400">Buscando contactos…</div>
            )}
            {directory.status === "error" && (
              <div className="px-3 py-2 text-xs leading-relaxed text-gray-500">
                No pudimos cargar tus contactos de Google. Igual podés escribir la dirección completa.
              </div>
            )}
            {options.length > 0 && (
              <ul id={`${listId}-listbox`} role="listbox" aria-label="Sugerencias de destinatarios">
                {options.map((option, index) => (
                  <li
                    key={option.type === "group" ? `g_${option.group.id}` : `c_${option.contact.id}`}
                    id={`${listId}-opt-${index}`}
                    role="option"
                    aria-selected={index === safeIndex}
                    // Sin esto, apretar una sugerencia le saca el foco al campo
                    // antes de que se registre el click.
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => pickOption(option)}
                    onMouseEnter={() => setActiveIndex(index)}
                    className={cn(
                      "flex cursor-pointer items-center gap-2 rounded-md px-2.5 py-1.5 text-sm",
                      index === safeIndex ? "bg-gray-100" : "bg-transparent",
                      addingGroupId !== null && "cursor-wait opacity-60"
                    )}
                  >
                    {option.type === "group" ? (
                      <>
                        <FolderIcon className="h-3.5 w-3.5 shrink-0 text-primary-700" />
                        <span className="min-w-0 flex-1 truncate text-gray-800">
                          {option.group.name}
                        </span>
                        <span className="shrink-0 text-[11px] text-gray-400">
                          grupo · {option.group.memberCount}
                        </span>
                      </>
                    ) : (
                      <span className="min-w-0 flex-1 truncate text-gray-800">
                        {option.contact.name}{" "}
                        <span className="text-gray-400">&lt;{option.contact.email}&gt;</span>
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </FloatingPortal>
      )}

      <RecipientPickerDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        mailboxId={mailboxId}
        directory={directory}
        onRetryDirectory={loadDirectory}
        onAdd={handlePicked}
        presentEmails={new Set(emailsOf(entries).map((email) => email.toLowerCase()))}
      />
    </>
  );
  }
);

function PersonChip({
  email,
  name,
  disabled,
  onRemove,
  subtle,
}: {
  email: string;
  name?: string;
  disabled?: boolean;
  onRemove: () => void;
  // Para los miembros de un grupo expandido: mismo chip, más liviano.
  subtle?: boolean;
}) {
  const valid = isValidEmail(email);
  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center gap-1 rounded-full py-0.5 pl-2.5 pr-1 text-xs",
        valid
          ? subtle
            ? "border border-gray-200 bg-white text-gray-800"
            : "bg-gray-100 text-gray-800"
          : "bg-danger-bg text-danger-text"
      )}
    >
      <span className="truncate">
        {name ? (
          <>
            {name} <span className={valid ? "text-gray-400" : "text-danger-text/70"}>&lt;{email}&gt;</span>
          </>
        ) : (
          email
        )}
      </span>
      {!valid && <span className="sr-only"> (no es un email válido)</span>}
      <button
        type="button"
        onClick={onRemove}
        disabled={disabled}
        aria-label={`Quitar ${email}`}
        className="shrink-0 rounded-full p-0.5 text-gray-400 transition-colors hover:text-gray-600 disabled:opacity-50"
      >
        <XIcon className="h-3 w-3" />
      </button>
    </span>
  );
}

function GroupChips({
  entry,
  disabled,
  onToggle,
  onRemove,
  onRemoveMember,
}: {
  entry: Extract<RecipientEntry, { kind: "group" }>;
  disabled?: boolean;
  onToggle: () => void;
  onRemove: () => void;
  onRemoveMember: (contactId: string) => void;
}) {
  return (
    <>
      <span className="inline-flex max-w-full items-center gap-1 rounded-full bg-primary-100 py-0.5 pl-2 pr-1 text-xs font-medium text-primary-700">
        <FolderIcon className="h-3 w-3 shrink-0" />
        <span className="truncate">
          {entry.name} ({entry.members.length})
        </span>
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={entry.expanded}
          aria-label={`${entry.expanded ? "Ocultar" : "Mostrar"} los contactos de ${entry.name}`}
          className="shrink-0 rounded-full p-0.5 transition-colors hover:bg-primary-300/40"
        >
          <ChevronDownIcon
            className={cn("h-3 w-3 transition-transform", entry.expanded && "rotate-180")}
          />
        </button>
        <button
          type="button"
          onClick={onRemove}
          disabled={disabled}
          aria-label={`Quitar el grupo ${entry.name}`}
          className="shrink-0 rounded-full p-0.5 transition-colors hover:bg-primary-300/40 disabled:opacity-50"
        >
          <XIcon className="h-3 w-3" />
        </button>
      </span>
      {entry.expanded &&
        entry.members.map((member) => (
          <PersonChip
            key={member.id}
            email={member.email}
            name={member.name}
            disabled={disabled}
            subtle
            onRemove={() => onRemoveMember(member.id)}
          />
        ))}
    </>
  );
}
