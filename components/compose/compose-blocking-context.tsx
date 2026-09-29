"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

interface ComposeBlockingContextValue {
  blocking: boolean;
  setBlocking: (value: boolean) => void;
}

const ComposeBlockingContext = createContext<ComposeBlockingContextValue | null>(null);

// Le permite a ComposeForm avisarle a su contenedor (ComposeModalShell,
// cuando mode="modal") que hay un envío con adjuntos en curso — el mismo
// momento en que se muestra el LoadingOverlay bloqueante — para que
// Escape/click en el backdrop no puedan cerrar el modal y dejar ese envío
// colgado sin ninguna UI. En mode="page" no hay Provider (no hay modal que
// cerrar), así que el hook devuelve null y ComposeForm simplemente no
// llama a nada — no necesita saber en qué contexto está.
export function ComposeBlockingProvider({ children }: { children: ReactNode }) {
  const [blocking, setBlocking] = useState(false);
  return (
    <ComposeBlockingContext.Provider value={{ blocking, setBlocking }}>
      {children}
    </ComposeBlockingContext.Provider>
  );
}

export function useComposeBlocking() {
  return useContext(ComposeBlockingContext);
}
