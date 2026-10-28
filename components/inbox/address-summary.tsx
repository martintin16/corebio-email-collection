"use client";

import { useState } from "react";
import { splitAddressList } from "@/lib/recipients";

/** Cuántas direcciones se muestran antes de "y N más". */
const VISIBLE = 3;

/**
 * "para Ana, Beto, Carla y 37 más" en el encabezado de un mail: con muchos
 * destinatarios, la lista completa era un párrafo enorme arriba del mensaje.
 * "y N más" la despliega entera; "ver menos" la vuelve a acortar.
 */
export function AddressSummary({ prefix, value }: { prefix: string; value: string }) {
  const [expanded, setExpanded] = useState(false);
  const addresses = splitAddressList(value);
  if (addresses.length === 0) return null;
  const hidden = addresses.length - VISIBLE;
  const shown = expanded || hidden <= 0 ? addresses : addresses.slice(0, VISIBLE);

  return (
    <span className="break-words [overflow-wrap:anywhere]">
      {prefix} {shown.join(", ")}
      {hidden > 0 && (
        <>
          {" "}
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
            className="text-primary-700 hover:underline"
          >
            {expanded ? "ver menos" : `y ${hidden} más`}
          </button>
        </>
      )}
    </span>
  );
}
