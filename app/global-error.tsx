"use client";

/**
 * Último recurso: un error en el layout raíz. Reemplaza toda la página, así
 * que lleva su propio <html> y estilos en línea (puede que el CSS no cargue).
 */
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="es">
      <body style={{ fontFamily: "system-ui, sans-serif", margin: 0 }}>
        <div
          style={{
            minHeight: "100dvh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 12,
            padding: 24,
            textAlign: "center",
          }}
        >
          <p style={{ fontSize: 14, fontWeight: 600, color: "#111827", margin: 0 }}>Algo salió mal</p>
          <p style={{ fontSize: 12, color: "#6B7280", margin: 0, maxWidth: 300 }}>
            Probá de nuevo en unos segundos.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              fontSize: 13,
              padding: "8px 14px",
              borderRadius: 6,
              border: "1px solid #D1D5DB",
              background: "#fff",
              cursor: "pointer",
            }}
          >
            Reintentar
          </button>
        </div>
      </body>
    </html>
  );
}
