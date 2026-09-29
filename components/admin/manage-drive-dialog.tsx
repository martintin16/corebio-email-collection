"use client";

import { useEffect, useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LoadingOverlay } from "@/components/ui/loading-overlay";
import { useToast } from "@/components/ui/toast/toast-context";
import { FolderIcon, FileTextIcon, ChevronDownIcon } from "@/components/icons";
import {
  getDriveRootFolder,
  getDriveFolderContents,
  getDriveSharedItemIds,
} from "@/lib/api/drive";
import { updateDriveAccess } from "@/lib/actions/drive";
import type { DriveItem } from "@/lib/types/drive";
import type { AdminMailbox, AdminUser } from "@/lib/types/admin";
import { cn } from "@/lib/utils";

interface ManageDriveDialogProps {
  open: boolean;
  onClose: () => void;
  mailbox: AdminMailbox;
  user: AdminUser;
}

interface Crumb {
  id: string;
  name: string;
}

// Explorador de carpetas/archivos para compartir con una persona, desde
// "Editar permisos" de esa persona. Alcance de esta ronda: elegir qué
// compartir (checkboxes + Guardar), no un Drive completo — no hay subir,
// renombrar ni eliminar acá, eso se sigue haciendo en Google Drive.
export function ManageDriveDialog({ open, onClose, mailbox, user }: ManageDriveDialogProps) {
  const { showToast } = useToast();
  const [path, setPath] = useState<Crumb[]>([getDriveRootFolder()]);
  const [state, setState] = useState<"loading" | "loaded" | "error">("loading");
  const [items, setItems] = useState<DriveItem[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  // "Reintentar" solo necesita disparar el mismo efecto de abajo de nuevo,
  // no una copia de su lógica — así no se le puede olvidar el guard de
  // "cancelled" y quedar pisado por una respuesta vieja si la persona ya
  // navegó a otra carpeta antes de que la reintentada responda.
  const [reloadToken, setReloadToken] = useState(0);

  const currentFolder = path[path.length - 1];

  // Al abrir (o cambiar de casilla/persona), arrancar de nuevo desde la
  // raíz y volver a pedir qué está compartido hoy — no tendría sentido
  // arrastrar la navegación de la última vez que se abrió para otra
  // persona u otra casilla.
  useEffect(() => {
    if (!open) return;
    setPath([getDriveRootFolder()]);
    getDriveSharedItemIds(mailbox.id).then((ids) => setSelected(new Set(ids)));
  }, [open, mailbox.id]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setState("loading");
    getDriveFolderContents(mailbox.id, currentFolder.id)
      .then((data) => {
        if (cancelled) return;
        setItems(data);
        setState("loaded");
      })
      .catch(() => {
        if (!cancelled) setState("error");
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mailbox.id, currentFolder.id, reloadToken]);

  function openFolder(item: DriveItem) {
    setPath((prev) => [...prev, { id: item.id, name: item.name }]);
  }

  function goToCrumb(index: number) {
    setPath((prev) => prev.slice(0, index + 1));
  }

  function toggleSelected(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function retry() {
    setReloadToken((n) => n + 1);
  }

  async function handleSave() {
    setSaving(true);
    try {
      await updateDriveAccess({
        mailboxId: mailbox.id,
        userId: user.id,
        itemIds: Array.from(selected),
      });
      showToast("success", `Acceso a Drive de ${user.name} actualizado.`);
      onClose();
    } catch {
      showToast("error", "No pudimos guardar los cambios de Drive. Intentá de nuevo.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog
      open={open}
      title={`Drive de ${mailbox.email}`}
      onClose={onClose}
      maxWidthClassName="max-w-[480px]"
      preventClose={saving}
    >
      <div className="relative">
        <LoadingOverlay active={saving} label="Guardando cambios…" />

        {/* Breadcrumb */}
        <div className="mb-3 flex flex-wrap items-center gap-1 text-xs text-gray-500">
          {path.map((crumb, i) => (
            <span key={crumb.id} className="flex items-center gap-1">
              {i > 0 && <span className="text-gray-300">/</span>}
              <button
                type="button"
                onClick={() => goToCrumb(i)}
                disabled={i === path.length - 1}
                className={cn(
                  "rounded px-1 transition-colors",
                  i === path.length - 1
                    ? "font-medium text-gray-800"
                    : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                )}
              >
                {crumb.name}
              </button>
            </span>
          ))}
        </div>

        <div className="min-h-[180px] rounded-md border border-gray-200">
          {state === "loading" && (
            <div className="flex flex-col items-center gap-2 py-10 text-xs text-gray-500">
              <span
                aria-hidden="true"
                className="h-5 w-5 animate-spin rounded-full border-[2.5px] border-gray-200 border-t-primary-700"
              />
              Cargando carpetas y archivos…
            </div>
          )}

          {state === "error" && (
            <div className="p-3">
              <div
                role="alert"
                className="mb-2 rounded-md border border-red-200 bg-danger-bg px-3 py-2 text-xs text-danger-text"
              >
                No pudimos cargar el contenido de esta carpeta.
              </div>
              <Button type="button" variant="secondary" onClick={retry}>
                Reintentar
              </Button>
            </div>
          )}

          {state === "loaded" && items.length === 0 && (
            <p className="py-10 text-center text-xs text-gray-500">Esta carpeta está vacía.</p>
          )}

          {state === "loaded" && items.length > 0 && (
            <ul className="divide-y divide-gray-100">
              {items.map((item) => {
                const isSelected = selected.has(item.id);
                return (
                  <li
                    key={item.id}
                    className={cn(
                      "flex items-center gap-2.5 px-3 py-2",
                      isSelected && "bg-primary-100/40"
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelected(item.id)}
                      aria-label={`Compartir ${item.name}`}
                    />
                    {item.type === "folder" ? (
                      <FolderIcon className="h-4 w-4 shrink-0 text-gray-400" />
                    ) : (
                      <FileTextIcon className="h-4 w-4 shrink-0 text-gray-400" />
                    )}
                    {item.type === "folder" ? (
                      <button
                        type="button"
                        onClick={() => openFolder(item)}
                        className="flex-1 truncate text-left text-sm text-gray-800 hover:underline"
                      >
                        {item.name}
                      </button>
                    ) : (
                      <span className="flex-1 truncate text-sm text-gray-800">{item.name}</span>
                    )}
                    {item.shared && (
                      <Badge tone="success">Compartido</Badge>
                    )}
                    {item.type === "folder" && (
                      <ChevronDownIcon className="h-3 w-3 shrink-0 -rotate-90 text-gray-300" />
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="mt-3 flex items-center justify-between">
          <span className="text-xs text-gray-500">
            {selected.size === 0
              ? "Nada seleccionado"
              : `${selected.size} elemento${selected.size === 1 ? "" : "s"} seleccionado${selected.size === 1 ? "" : "s"}`}
          </span>
          <div className="flex gap-2">
            <Button type="button" variant="secondary" onClick={onClose} disabled={saving}>
              Cancelar
            </Button>
            <Button type="button" onClick={handleSave} isLoading={saving}>
              Guardar cambios
            </Button>
          </div>
        </div>
      </div>
    </Dialog>
  );
}
