"use client";

import { useEffect, useRef, useState } from "react";
import { SearchIcon, XIcon } from "@/components/icons";
import { useListQuery } from "@/components/inbox/list-query-provider";

/** Espera después de la última tecla antes de buscar (cada búsqueda gasta cuota de Gmail). */
const DEBOUNCE_MS = 500;
const MIN_LENGTH = 2;

/**
 * Buscador de Recibidos y Enviados (debajo de las pestañas). Busca con la
 * búsqueda de Gmail: al apretar Enter o al dejar de escribir medio segundo,
 * desde 2 letras. La ✕ o Escape la sacan.
 */
export function MailboxSearch({ placeholder }: { placeholder: string }) {
  const { query, setQuery } = useListQuery();
  const [text, setText] = useState(query);
  const inputRef = useRef<HTMLInputElement>(null);

  // Si la búsqueda se limpia desde afuera ("Quitar búsqueda", otra pestaña), el campo también.
  useEffect(() => {
    if (query === "") setText("");
  }, [query]);

  useEffect(() => {
    const value = text.trim();
    if (value === query) return;
    if (value.length > 0 && value.length < MIN_LENGTH) return;
    const timer = setTimeout(() => setQuery(value), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [text, query, setQuery]);

  function clear() {
    setText("");
    setQuery("");
    inputRef.current?.focus();
  }

  return (
    <div className="shrink-0 border-b border-gray-200 px-4 py-2">
      <div className="flex items-center gap-2 rounded-md border border-gray-300 px-2.5 py-1.5 focus-within:border-primary-700">
        <SearchIcon className="h-3.5 w-3.5 shrink-0 text-gray-400" />
        <input
          ref={inputRef}
          type="search"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              setQuery(text.trim());
            } else if (e.key === "Escape" && text) {
              e.preventDefault();
              clear();
            }
          }}
          placeholder={placeholder}
          aria-label={placeholder}
          className="min-w-0 flex-1 border-none bg-transparent p-0 text-xs text-gray-900 outline-none placeholder:text-gray-400 [&::-webkit-search-cancel-button]:hidden"
        />
        {text && (
          <button
            type="button"
            onClick={clear}
            aria-label="Quitar búsqueda"
            className="shrink-0 text-gray-400 hover:text-gray-600"
          >
            <XIcon className="h-3 w-3" />
          </button>
        )}
      </div>
    </div>
  );
}
