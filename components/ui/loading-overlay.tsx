interface LoadingOverlayProps {
  active: boolean;
  label: string;
}

/**
 * Overlay que bloquea toda la interacción de su contenedor (necesita
 * position: relative en el padre). Reservado para acciones críticas en
 * curso — enviar un mail con adjunto grande, completar la conexión OAuth
 * de una casilla — donde no queremos que la persona pueda tocar nada
 * mientras se procesa. Distinto del skeleton (loading.tsx de las rutas),
 * que no bloquea nada y se usa para cargar listas.
 */
export function LoadingOverlay({ active, label }: LoadingOverlayProps) {
  if (!active) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-2 rounded-lg bg-gray-900/55"
    >
      <span
        aria-hidden="true"
        className="h-6 w-6 animate-spin rounded-full border-[2.5px] border-white/30 border-t-white"
      />
      <span className="text-xs text-white">{label}</span>
    </div>
  );
}
