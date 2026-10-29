"use client";

import { useEffect } from "react";

const PREFIX = /^\(\d+\)\s+/;

/**
 * "(3) Corebio Mail" en la pestaña del navegador mientras haya no leídos en
 * Recibidos: se ve aunque la pestaña no esté adelante.
 *
 * Next cambia el título al navegar (cada página tiene el suyo), así que se
 * vuelve a poner el prefijo cada vez que el título cambia. Al salir de la
 * bandeja se saca.
 */
export function useUnreadTitle(count: number | null) {
  useEffect(() => {
    const apply = () => {
      const base = document.title.replace(PREFIX, "");
      const next = count && count > 0 ? `(${count}) ${base}` : base;
      if (document.title !== next) document.title = next;
    };
    apply();
    const observer = new MutationObserver(apply);
    observer.observe(document.head, { childList: true, subtree: true, characterData: true });
    return () => {
      observer.disconnect();
      document.title = document.title.replace(PREFIX, "");
    };
  }, [count]);
}
