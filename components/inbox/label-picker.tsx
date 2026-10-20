"use client";

import { useEffect, useRef, useState } from "react";
import { useFloating, autoUpdate, offset, flip, shift, FloatingPortal } from "@floating-ui/react";
import { TagIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast/toast-context";
import { useMailboxLabels } from "@/components/inbox/mailbox-labels-provider";
import { updateMessageLabels } from "@/lib/actions/labels";
import { getLabelColors } from "@/lib/label-colors";
import { pushDialogLayer, popDialogLayer, isTopDialogLayer } from "@/lib/dialog-stack";
import { cn } from "@/lib/utils";

interface LabelPickerProps {
  mailboxId: string;
  messageId: string;
  // Etiquetas con las que llegó el mensaje del servidor — el estado local
  // del proveedor (si ya se tocó alguna) tiene prioridad sobre esto.
  initialLabelIds: string[];
}

// Botón de etiqueta en el header del detalle + popover con un checklist de
// las etiquetas de la casilla. Mismo patrón de popover que TemplatePicker
// y ActionsMenu (Floating UI + portal + pila de capas para Escape).
// Alcance de esta ronda: asignar y sacar etiquetas que ya existen en Gmail
// — crearlas o editarlas se hace desde Gmail.
export function LabelPicker({ mailboxId, messageId, initialLabelIds }: LabelPickerProps) {
  const { showToast } = useToast();
  const { labels, status, reload, getLabelIds, setLabelIds } = useMailboxLabels();
  const [open, setOpen] = useState(false);

  const currentIds = getLabelIds(messageId, initialLabelIds);

  const { refs, floatingStyles } = useFloating({
    open,
    onOpenChange: setOpen,
    placement: "bottom-end",
    middleware: [offset(4), flip({ padding: 8 }), shift({ padding: 8 })],
    whileElementsMounted: autoUpdate,
  });

  const layerId = useRef<symbol>();
  if (!layerId.current) layerId.current = Symbol("label-picker");

  useEffect(() => {
    if (!open) return;
    const id = layerId.current!;
    pushDialogLayer(id);
    return () => popDialogLayer(id);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      const reference = refs.reference.current;
      const floating = refs.floating.current;
      const clickedReference = reference instanceof HTMLElement && reference.contains(target);
      const clickedFloating = floating instanceof HTMLElement && floating.contains(target);
      if (!clickedReference && !clickedFloating) setOpen(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isTopDialogLayer(layerId.current!)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, refs.reference, refs.floating]);

  // Optimista: la etiqueta se marca/desmarca al instante y, si el servidor
  // falla, se vuelve atrás y se avisa — no se espera la respuesta para
  // mostrar el cambio, y tampoco se muestra un toast de éxito por cada tilde
  // (sería ruido: el checkbox ya muestra el resultado).
  async function toggle(labelId: string) {
    const previous = currentIds;
    const isOn = previous.includes(labelId);
    const next = isOn ? previous.filter((id) => id !== labelId) : [...previous, labelId];
    setLabelIds(messageId, next);
    try {
      await updateMessageLabels({
        mailboxId,
        messageId,
        add: isOn ? [] : [labelId],
        remove: isOn ? [labelId] : [],
      });
    } catch {
      setLabelIds(messageId, previous);
      showToast("error", "No pudimos actualizar las etiquetas. Intentá de nuevo.");
    }
  }

  return (
    <>
      <button
        ref={refs.setReference}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Etiquetas"
        aria-haspopup="dialog"
        aria-expanded={open}
        className={cn(
          "shrink-0 rounded-md border p-1.5 transition-colors",
          open
            ? "border-primary-300 bg-primary-100/50 text-primary-700"
            : "border-gray-300 text-gray-500 hover:bg-gray-50 hover:text-gray-700"
        )}
      >
        <TagIcon className="h-4 w-4" />
      </button>

      {open && (
        <FloatingPortal>
          <div
            ref={refs.setFloating}
            style={floatingStyles}
            role="dialog"
            aria-label="Etiquetas de esta conversación"
            className="z-50 w-60 rounded-md border border-gray-200 bg-white p-1.5 shadow-md"
          >
            <p className="px-2 pb-1.5 pt-1 text-[11px] font-medium uppercase tracking-wide text-gray-400">
              Etiquetas de esta casilla
            </p>

            {status === "loading" && (
              <div aria-busy="true" className="space-y-2 px-2 py-2">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="h-3 animate-pulse rounded bg-gray-100" />
                ))}
                <span className="sr-only">Cargando etiquetas…</span>
              </div>
            )}

            {status === "error" && (
              <div className="p-1.5">
                <div
                  role="alert"
                  className="mb-2 rounded-md border border-red-200 bg-danger-bg px-3 py-2 text-xs text-danger-text"
                >
                  No pudimos traer las etiquetas.
                </div>
                <Button type="button" variant="secondary" onClick={reload}>
                  Reintentar
                </Button>
              </div>
            )}

            {status === "loaded" && labels.length === 0 && (
              <p className="px-2 py-4 text-center text-xs leading-relaxed text-gray-500">
                Esta casilla todavía no tiene etiquetas creadas en Gmail. Se crean desde Gmail y
                después aparecen acá.
              </p>
            )}

            {status === "loaded" && labels.length > 0 && (
              <ul className="max-h-64 overflow-y-auto">
                {labels.map((label) => {
                  const checked = currentIds.includes(label.id);
                  const colors = getLabelColors(label);
                  return (
                    <li key={label.id}>
                      <label
                        className={cn(
                          "flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 text-sm text-gray-800 transition-colors hover:bg-gray-50",
                          checked && "bg-primary-100/40"
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => void toggle(label.id)}
                        />
                        <span
                          aria-hidden="true"
                          className="h-2 w-2 shrink-0 rounded-full"
                          style={{ backgroundColor: colors.dot }}
                        />
                        <span className="truncate">{label.name}</span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </FloatingPortal>
      )}
    </>
  );
}
