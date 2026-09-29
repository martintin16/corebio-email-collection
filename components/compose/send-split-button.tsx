"use client";

import { useEffect, useRef, useState } from "react";
import { useFloating, autoUpdate, offset, flip, shift, FloatingPortal } from "@floating-ui/react";
import { Button } from "@/components/ui/button";
import { ChevronDownIcon, ClockIcon } from "@/components/icons";
import { getQuickScheduleOptions, isValidScheduleTime } from "@/lib/schedule-options";
import { pushDialogLayer, popDialogLayer, isTopDialogLayer } from "@/lib/dialog-stack";

interface SendSplitButtonProps {
  isLoading: boolean;
  disabled?: boolean;
  onSchedule: (date: Date) => void;
  // Redactar usa react-hook-form: la mitad izquierda es el submit nativo
  // del <form> (no se pasa onSend, queda type="submit"). Responder no tiene
  // <form> ni RHF — arma su propio estado a mano — así que ahí sí se pasa
  // onSend y el botón se vuelve type="button" con su propio onClick.
  onSend?: () => void;
  sendLabel?: string;
}

// Botón dividido: la mitad izquierda manda ya, la mitad derecha abre este
// menú para programar el envío para más tarde. Usado en Redactar y, desde
// que se puede programar una respuesta también, en Responder.
export function SendSplitButton({
  isLoading,
  disabled,
  onSchedule,
  onSend,
  sendLabel = "Enviar",
}: SendSplitButtonProps) {
  const [open, setOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [dateValue, setDateValue] = useState("");
  const [timeValue, setTimeValue] = useState("");
  const [pickerError, setPickerError] = useState<string | null>(null);

  const { refs, floatingStyles } = useFloating({
    open,
    onOpenChange: (next) => {
      setOpen(next);
      if (!next) {
        setPickerOpen(false);
        setPickerError(null);
      }
    },
    placement: "top-end",
    middleware: [offset(4), flip({ padding: 8 }), shift({ padding: 8 })],
    whileElementsMounted: autoUpdate,
  });

  const quickOptions = getQuickScheduleOptions();

  const layerId = useRef<symbol>();
  if (!layerId.current) layerId.current = Symbol("send-split-button");

  // Mismo motivo que TemplatePicker: sin anotarse en la pila compartida,
  // Escape cerraría este menú Y el modal de Redactar/Responder de paso.
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
      if (!clickedReference && !clickedFloating) closeMenu();
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isTopDialogLayer(layerId.current!)) closeMenu();
    }
    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onKeyDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, refs.reference, refs.floating]);

  function closeMenu() {
    setOpen(false);
    setPickerOpen(false);
    setPickerError(null);
    setDateValue("");
    setTimeValue("");
  }

  function handleQuickOption(date: Date) {
    closeMenu();
    onSchedule(date);
  }

  function handleConfirmPicker() {
    if (!dateValue || !timeValue) {
      setPickerError("Elegí una fecha y una hora.");
      return;
    }
    const date = new Date(`${dateValue}T${timeValue}:00`);
    if (Number.isNaN(date.getTime()) || !isValidScheduleTime(date)) {
      setPickerError("Elegí un horario al menos 5 minutos más adelante.");
      return;
    }
    closeMenu();
    onSchedule(date);
  }

  const todayIso = new Date().toISOString().slice(0, 10);

  return (
    <div className="relative flex">
      <Button
        type={onSend ? "button" : "submit"}
        onClick={onSend}
        isLoading={isLoading}
        disabled={disabled}
        className="rounded-r-none"
      >
        {sendLabel}
      </Button>
      <button
        ref={refs.setReference}
        type="button"
        disabled={disabled || isLoading}
        onClick={() => setOpen((v) => !v)}
        aria-label="Más opciones de envío"
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex h-9 w-7 items-center justify-center rounded-r-md border-l border-primary-600 bg-primary-700 text-white transition-colors hover:bg-primary-600 disabled:cursor-not-allowed disabled:bg-primary-300"
      >
        <ChevronDownIcon className="h-3.5 w-3.5" />
      </button>

      {open && (
        <FloatingPortal>
          <div
            ref={refs.setFloating}
            style={floatingStyles}
            role="menu"
            aria-label="Programar envío"
            className="z-50 w-64 rounded-md border border-gray-200 bg-white p-1 shadow-md"
          >
            {!pickerOpen ? (
              <>
                {quickOptions.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    role="menuitem"
                    onClick={() => handleQuickOption(opt.getDate())}
                    className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50"
                  >
                    <ClockIcon className="h-3.5 w-3.5 text-gray-400" />
                    {opt.label}
                  </button>
                ))}
                <div className="my-1 border-t border-gray-100" />
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => setPickerOpen(true)}
                  className="block w-full rounded-md px-2.5 py-2 text-left text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50"
                >
                  Elegir fecha y hora…
                </button>
              </>
            ) : (
              <div className="p-2">
                <label className="mb-1 block text-[11px] font-medium text-gray-500" htmlFor="schedule-date">
                  Fecha
                </label>
                <input
                  id="schedule-date"
                  type="date"
                  min={todayIso}
                  value={dateValue}
                  onChange={(e) => {
                    setDateValue(e.target.value);
                    setPickerError(null);
                  }}
                  className="mb-2 w-full rounded-md border border-gray-300 px-2 py-1.5 text-xs text-gray-800"
                />
                <label className="mb-1 block text-[11px] font-medium text-gray-500" htmlFor="schedule-time">
                  Hora
                </label>
                <input
                  id="schedule-time"
                  type="time"
                  value={timeValue}
                  onChange={(e) => {
                    setTimeValue(e.target.value);
                    setPickerError(null);
                  }}
                  className="mb-2 w-full rounded-md border border-gray-300 px-2 py-1.5 text-xs text-gray-800"
                />
                {pickerError && (
                  <p role="alert" className="mb-2 text-[11px] text-danger">
                    {pickerError}
                  </p>
                )}
                <div className="flex justify-end gap-1.5">
                  <Button
                    type="button"
                    variant="secondary"
                    className="h-7 px-2.5 text-xs"
                    onClick={() => setPickerOpen(false)}
                  >
                    Volver
                  </Button>
                  <Button type="button" className="h-7 px-2.5 text-xs" onClick={handleConfirmPicker}>
                    Programar
                  </Button>
                </div>
              </div>
            )}
          </div>
        </FloatingPortal>
      )}
    </div>
  );
}
