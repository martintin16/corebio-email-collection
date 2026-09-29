"use client";

import {
  useEffect,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type ComponentType,
  type SVGProps,
} from "react";
import {
  useFloating,
  autoUpdate,
  offset,
  flip,
  shift,
  FloatingPortal,
} from "@floating-ui/react";
import { DotsIcon } from "@/components/icons";
import { cn } from "@/lib/utils";
import { pushDialogLayer, popDialogLayer, isTopDialogLayer } from "@/lib/dialog-stack";

// Antes esto se posicionaba con position:absolute fijo hacia abajo del
// botón (top-full), sin importar si había lugar. Con una fila cerca del
// borde inferior de la pantalla (o de un contenedor con scroll, como la
// tabla de Usuarios/Casillas), el menú se abría igual hacia abajo y
// quedaba tapado — había que scrollear para verlo entero.
//
// Floating UI resuelve las dos partes del problema:
// - flip(): si no hay espacio debajo, lo abre hacia arriba solo.
// - FloatingPortal: lo renderiza al final del <body> en vez de anidado
//   adentro de la tabla, así ningún overflow/scroll de un contenedor
//   padre lo puede recortar.
// La lógica de cerrar con click afuera y con Escape se mantiene igual
// que antes — no cambia el comportamiento, solo cómo se posiciona.
export function ActionsMenu({ label, children }: { label: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  const { refs, floatingStyles } = useFloating({
    open,
    onOpenChange: setOpen,
    placement: "bottom-end",
    middleware: [offset(4), flip({ padding: 8 }), shift({ padding: 8 })],
    whileElementsMounted: autoUpdate,
  });

  const layerId = useRef<symbol>();
  if (!layerId.current) layerId.current = Symbol("actions-menu");

  // Mismo motivo que TemplatePicker/SendSplitButton: si este menú se llega
  // a abrir con un modal ya abierto detrás (ej. un menú de fila mientras
  // "Editar permisos" está abierto), Escape sin coordinar cerraría los dos
  // juntos en vez de solo el de arriba (ver lib/dialog-stack.ts).
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, refs.reference, refs.floating]);

  return (
    <>
      <button
        ref={refs.setReference}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        className="rounded-md p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
      >
        <DotsIcon className="h-4 w-4" />
      </button>

      {open && (
        <FloatingPortal>
          <div
            ref={refs.setFloating}
            style={floatingStyles}
            role="menu"
            onClick={() => setOpen(false)}
            className="z-50 w-52 rounded-md border border-gray-200 bg-white p-1 shadow-md"
          >
            {children}
          </div>
        </FloatingPortal>
      )}
    </>
  );
}

interface ActionsMenuItemProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  danger?: boolean;
}

export function ActionsMenuItem({ icon: Icon, danger, className, children, ...props }: ActionsMenuItemProps) {
  return (
    <button
      role="menuitem"
      type="button"
      className={cn(
        "flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm transition-colors",
        "disabled:cursor-not-allowed disabled:opacity-50",
        danger ? "text-danger hover:bg-danger-bg" : "text-gray-600 hover:bg-gray-50",
        className
      )}
      {...props}
    >
      <Icon className="h-[15px] w-[15px]" />
      {children}
    </button>
  );
}
