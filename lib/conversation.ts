/** Con más mensajes que esto, los del medio se juntan en "N mensajes más" (como Gmail). */
export const THREAD_COLLAPSE_AFTER = 5;

export type ThreadSegment = { kind: "message"; index: number } | { kind: "hidden"; indexes: number[] };

/**
 * Qué mensajes de la conversación se muestran y cuáles quedan juntados en
 * "N mensajes más". Siempre se ven el primero, el último y el abierto; con
 * hasta 5 mensajes, todos. Un solo oculto entre dos visibles se muestra (no
 * tiene sentido un "1 mensaje más").
 */
export function threadSegments(total: number, currentIndex: number): ThreadSegment[] {
  const indexes = Array.from({ length: total }, (_, i) => i);
  if (total <= THREAD_COLLAPSE_AFTER) return indexes.map((index) => ({ kind: "message", index }));

  const visible = new Set([0, total - 1, currentIndex]);
  const segments: ThreadSegment[] = [];
  let hidden: number[] = [];
  const flush = () => {
    if (hidden.length === 1) segments.push({ kind: "message", index: hidden[0]! });
    else if (hidden.length > 1) segments.push({ kind: "hidden", indexes: hidden });
    hidden = [];
  };
  for (const index of indexes) {
    if (visible.has(index)) {
      flush();
      segments.push({ kind: "message", index });
    } else {
      hidden.push(index);
    }
  }
  flush();
  return segments;
}
