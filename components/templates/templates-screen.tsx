"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast } from "@/components/ui/toast/toast-context";
import { AlertIcon, FileTextIcon, PlusIcon } from "@/components/icons";
import { TemplateRow } from "@/components/templates/template-row";
import { TemplateEditorDialog } from "@/components/templates/template-editor-dialog";
import {
  deleteTemplate,
  duplicateTemplate,
  getTemplatesForMailbox,
} from "@/lib/api/templates";
import type { Mailbox } from "@/lib/types/mail";
import type { MessageTemplate } from "@/lib/types/template";

type Editor = { mode: "create" } | { mode: "edit"; template: MessageTemplate };

const STORAGE_KEY = "corebio.templates.mailbox";

function byName(a: MessageTemplate, b: MessageTemplate) {
  return a.name.localeCompare(b.name, "es");
}

function SkeletonRows() {
  return (
    <ul aria-hidden="true" className="overflow-hidden rounded-md border border-gray-200">
      {Array.from({ length: 3 }).map((_, i) => (
        <li key={i} className="border-t border-gray-200 px-4 py-3 first:border-t-0">
          <div className="mb-1.5 h-3 w-40 animate-pulse rounded bg-gray-200" />
          <div className="mb-1.5 h-2.5 w-64 max-w-full animate-pulse rounded bg-gray-100" />
          <div className="h-2 w-28 animate-pulse rounded bg-gray-100" />
        </li>
      ))}
    </ul>
  );
}

export function TemplatesScreen({ mailboxes }: { mailboxes: Mailbox[] }) {
  const { showToast } = useToast();
  const [mailboxId, setMailboxId] = useState(mailboxes[0]?.id ?? "");
  const [status, setStatus] = useState<"loading" | "loaded" | "error">("loading");
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [reloadKey, setReloadKey] = useState(0);
  const [editor, setEditor] = useState<Editor | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MessageTemplate | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [busy, setBusy] = useState(false);

  const mailbox = mailboxes.find((m) => m.id === mailboxId);

  // La última casilla elegida se recuerda mientras dure la sesión del
  // navegador. Se lee después de montar (no en el estado inicial) para no
  // desfasar el HTML del servidor.
  useEffect(() => {
    try {
      const saved = window.sessionStorage.getItem(STORAGE_KEY);
      if (saved && mailboxes.some((m) => m.id === saved)) setMailboxId(saved);
    } catch {
      // Sin acceso a sessionStorage: se queda con la primera casilla.
    }
  }, [mailboxes]);

  useEffect(() => {
    if (!mailboxId) return;
    let cancelled = false;
    setStatus("loading");
    getTemplatesForMailbox(mailboxId)
      .then((data) => {
        if (cancelled) return;
        setTemplates(data);
        setStatus("loaded");
      })
      .catch(() => {
        if (cancelled) return;
        setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, [mailboxId, reloadKey]);

  function changeMailbox(id: string) {
    // Otra casilla = otras plantillas: se descarta cualquier edición abierta.
    setEditor(null);
    setDeleteTarget(null);
    setMailboxId(id);
    try {
      window.sessionStorage.setItem(STORAGE_KEY, id);
    } catch {
      // Opcional: si no se puede guardar, simplemente no se recuerda.
    }
  }

  const reload = useCallback(() => setReloadKey((k) => k + 1), []);

  function handleSaved(saved: MessageTemplate) {
    setEditor(null);
    setTemplates((prev) => {
      const next = prev.some((t) => t.id === saved.id)
        ? prev.map((t) => (t.id === saved.id ? saved : t))
        : [...prev, saved];
      return next.sort(byName);
    });
  }

  async function handleDuplicate(template: MessageTemplate) {
    setBusy(true);
    try {
      const result = await duplicateTemplate(mailboxId, template);
      if (!result.ok) throw new Error(result.error.message);
      const copy = result.data;
      setTemplates((prev) => [...prev, copy].sort(byName));
      showToast("success", "Plantilla duplicada.");
      // Se abre la copia para que lo primero sea ponerle su propio nombre.
      setEditor({ mode: "edit", template: copy });
    } catch {
      showToast("error", "No pudimos duplicar la plantilla. Intentá de nuevo.");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const result = await deleteTemplate(mailboxId, deleteTarget.id);
      if (!result.ok) throw new Error(result.error.message);
      setTemplates((prev) => prev.filter((t) => t.id !== deleteTarget.id));
      showToast("success", `"${deleteTarget.name}" fue eliminada.`);
      setDeleteTarget(null);
    } catch {
      showToast("error", "No pudimos eliminar la plantilla. Intentá de nuevo.");
    } finally {
      setDeleting(false);
    }
  }

  if (mailboxes.length === 0) {
    return (
      <div className="p-6">
        <EmptyState
          icon={FileTextIcon}
          title="No tenés casillas asignadas"
          description="Cuando un administrador te dé acceso a una casilla, vas a poder administrar sus plantillas acá."
        />
      </div>
    );
  }

  const count = templates.length;
  const loaded = status === "loaded";
  const editingId = editor?.mode === "edit" ? editor.template.id : null;

  return (
    <div className="p-6">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-lg font-medium text-gray-900">Plantillas</h1>
          <p className="text-xs text-gray-500" aria-live="polite">
            {loaded
              ? `${count} ${count === 1 ? "plantilla" : "plantillas"}${
                  mailbox ? ` · ${mailbox.displayName}` : ""
                }`
              : " "}
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          {mailboxes.length > 1 && (
            <>
              <label htmlFor="templates-mailbox" className="sr-only">
                Casilla
              </label>
              <select
                id="templates-mailbox"
                value={mailboxId}
                onChange={(e) => changeMailbox(e.target.value)}
                className="h-9 rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-800"
              >
                {mailboxes.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.displayName}
                  </option>
                ))}
              </select>
            </>
          )}
          <Button
            type="button"
            onClick={() => setEditor({ mode: "create" })}
            disabled={!loaded}
            className="justify-center"
          >
            <PlusIcon className="h-4 w-4" />
            Nueva plantilla
          </Button>
        </div>
      </div>

      {status === "loading" && <SkeletonRows />}

      {status === "error" && (
        <EmptyState
          icon={AlertIcon}
          title="No pudimos cargar las plantillas"
          description="Revisá tu conexión e intentá de nuevo. También podés probar con otra casilla."
          action={
            <Button type="button" variant="secondary" onClick={reload}>
              Reintentar
            </Button>
          }
        />
      )}

      {loaded && count === 0 && (
        <EmptyState
          icon={FileTextIcon}
          title="Esta casilla todavía no tiene plantillas"
          description="Las plantillas son textos listos para insertar en un mensaje nuevo, como una confirmación de reunión o un recordatorio."
          action={
            <Button type="button" onClick={() => setEditor({ mode: "create" })}>
              <PlusIcon className="h-4 w-4" />
              Crear la primera plantilla
            </Button>
          }
        />
      )}

      {loaded && count > 0 && (
        <ul className="overflow-hidden rounded-md border border-gray-200 bg-white">
          {templates.map((template) => (
            <TemplateRow
              key={template.id}
              template={template}
              disabled={busy}
              onEdit={() => setEditor({ mode: "edit", template })}
              onDuplicate={() => void handleDuplicate(template)}
              onDelete={() => setDeleteTarget(template)}
            />
          ))}
        </ul>
      )}

      {editor && (
        <TemplateEditorDialog
          key={editor.mode === "edit" ? editor.template.id : "new"}
          mailboxId={mailboxId}
          template={editor.mode === "edit" ? editor.template : undefined}
          otherNames={templates.filter((t) => t.id !== editingId).map((t) => t.name)}
          onClose={() => setEditor(null)}
          onSaved={handleSaved}
        />
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        title="¿Eliminar plantilla?"
        description={`"${deleteTarget?.name ?? ""}" dejará de estar disponible para todas las personas con acceso a esta casilla. No se puede deshacer.`}
        isLoading={deleting}
        onConfirm={() => void handleDelete()}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
