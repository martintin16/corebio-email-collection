"use client";

import { useEffect, useRef, useState } from "react";
import { useFloating, autoUpdate, offset, flip, shift, FloatingPortal } from "@floating-ui/react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileTextIcon } from "@/components/icons";
import { getTemplatesForMailbox } from "@/lib/api/templates";
import type { MessageTemplate } from "@/lib/types/template";
import { pushDialogLayer, popDialogLayer, isTopDialogLayer } from "@/lib/dialog-stack";

interface TemplatePickerProps {
  mailboxId: string;
  // Si ya hay texto escrito, insertar una plantilla lo reemplazaría sin
  // avisar — por eso hace falta saber si conviene confirmar antes.
  hasContent: boolean;
  onInsert: (html: string) => void;
}

// Solo en Redactar, no en Responder — una plantilla institucional tiene
// sentido para empezar un mensaje nuevo, no para contestar uno puntual.
// Alcance de esta ronda: elegir e insertar una plantilla existente, no
// crearlas ni editarlas (eso es otra funcionalidad, con su propia pantalla
// de administración, que queda para más adelante).
export function TemplatePicker({ mailboxId, hasContent, onInsert }: TemplatePickerProps) {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<"idle" | "loading" | "loaded">("idle");
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [pending, setPending] = useState<MessageTemplate | null>(null);

  const { refs, floatingStyles } = useFloating({
    open,
    onOpenChange: setOpen,
    placement: "bottom-end",
    middleware: [offset(4), flip({ padding: 8 }), shift({ padding: 8 })],
    whileElementsMounted: autoUpdate,
  });

  // Se recarga cada vez que se abre (y si cambió la casilla "De" mientras
  // tanto) — las plantillas son por casilla, no globales.
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setState("loading");
    getTemplatesForMailbox(mailboxId).then((data) => {
      if (cancelled) return;
      setTemplates(data);
      setState("loaded");
    });
    return () => {
      cancelled = true;
    };
  }, [open, mailboxId]);

  const layerId = useRef<symbol>();
  if (!layerId.current) layerId.current = Symbol("template-picker");

  // Se anota en la pila compartida con Dialog/ComposeModalShell mientras
  // está abierto — si no, Escape también cerraría el modal de Redactar
  // entero de paso (ver lib/dialog-stack.ts).
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

  function selectTemplate(tpl: MessageTemplate) {
    setOpen(false);
    if (hasContent) {
      setPending(tpl);
    } else {
      onInsert(tpl.body);
    }
  }

  function confirmReplace() {
    if (pending) onInsert(pending.body);
    setPending(null);
  }

  return (
    <>
      <button
        ref={refs.setReference}
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 rounded-md border border-gray-300 px-2.5 py-1 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50"
      >
        <FileTextIcon className="h-3.5 w-3.5" />
        Insertar plantilla
      </button>

      {open && (
        <FloatingPortal>
          <div
            ref={refs.setFloating}
            style={floatingStyles}
            role="menu"
            aria-label="Plantillas"
            className="z-50 w-64 rounded-md border border-gray-200 bg-white p-1 shadow-md"
          >
            {state === "loading" && (
              <div className="px-3 py-4 text-center text-xs text-gray-400">Cargando plantillas…</div>
            )}
            {state === "loaded" && templates.length === 0 && (
              <div className="px-3 py-4 text-center text-xs text-gray-400">
                No hay plantillas para esta casilla.
              </div>
            )}
            {state === "loaded" &&
              templates.map((tpl) => (
                <button
                  key={tpl.id}
                  type="button"
                  role="menuitem"
                  onClick={() => selectTemplate(tpl)}
                  className="block w-full rounded-md px-2.5 py-2 text-left transition-colors hover:bg-gray-50"
                >
                  <div className="text-xs font-medium text-gray-800">{tpl.name}</div>
                  <div className="truncate text-[11px] text-gray-400">{tpl.preview}</div>
                </button>
              ))}
          </div>
        </FloatingPortal>
      )}

      <Dialog
        open={pending !== null}
        title="¿Reemplazar el contenido actual?"
        onClose={() => setPending(null)}
        maxWidthClassName="max-w-[340px]"
      >
        <p className="mb-4 text-xs leading-relaxed text-gray-500">
          Ya escribiste texto en este mensaje. Insertar &quot;{pending?.name}&quot; va a reemplazarlo — no se
          puede deshacer.
        </p>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={() => setPending(null)}>
            Cancelar
          </Button>
          <Button type="button" onClick={confirmReplace}>
            Reemplazar
          </Button>
        </div>
      </Dialog>
    </>
  );
}
