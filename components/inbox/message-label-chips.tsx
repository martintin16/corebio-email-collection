"use client";

import { LabelChip } from "@/components/inbox/label-chip";
import { useMailboxLabels } from "@/components/inbox/mailbox-labels-provider";

// Chips de las etiquetas de la conversación abierta, debajo del asunto. No
// ocupa lugar si no tiene ninguna (o mientras el catálogo de etiquetas de
// la casilla todavía no cargó, que es de donde sale el nombre y el color).
export function MessageLabelChips({
  messageId,
  initialLabelIds,
}: {
  messageId: string;
  initialLabelIds: string[];
}) {
  const { labelsById, getLabelIds } = useMailboxLabels();
  const labels = getLabelIds(messageId, initialLabelIds)
    .map((id) => labelsById.get(id))
    .filter((label): label is NonNullable<typeof label> => label !== undefined);

  if (labels.length === 0) return null;

  return (
    <ul aria-label="Etiquetas" className="mb-2 flex flex-wrap gap-1.5">
      {labels.map((label) => (
        <li key={label.id} className="max-w-full">
          <LabelChip label={label} />
        </li>
      ))}
    </ul>
  );
}
