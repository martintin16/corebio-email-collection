"use client";

import { useState } from "react";
import { PaperclipIcon } from "@/components/icons";
import { useToast } from "@/components/ui/toast/toast-context";
import { downloadMessageAttachment } from "@/lib/api/messages.browser";
import { downloadScheduledAttachment } from "@/lib/api/scheduled-messages.browser";
import { cn } from "@/lib/utils";
import { formatSize } from "@/lib/attachments";
import type { AttachmentInfo } from "@/lib/types/mail";


/** De dónde se bajan: un mensaje de Gmail (recibido o enviado) o un envío programado. */
type AttachmentSource =
  | { kind: "message"; mailboxId: string; messageId: string }
  | { kind: "scheduled"; scheduledId: string };

/** En una fila de lista (compact), con más de estos se muestra un resumen que se despliega. */
const COMPACT_MAX = 2;

/**
 * Los adjuntos de un recibido, un enviado o un programado, cada uno con su
 * botón de descarga. `compact`: versión chica para las filas de una lista;
 * con más de 2 adjuntos muestra "📎 10 adjuntos · 840 KB" y se despliega al tocarlo.
 */
export function AttachmentList({
  source,
  attachments,
  compact = false,
}: {
  source: AttachmentSource;
  attachments: AttachmentInfo[];
  compact?: boolean;
}) {
  const { showToast } = useToast();
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  if (attachments.length === 0) return null;

  if (compact && attachments.length > COMPACT_MAX && !expanded) {
    const total = attachments.reduce((sum, a) => sum + a.size, 0);
    return (
      <button
        type="button"
        onClick={() => setExpanded(true)}
        aria-expanded={false}
        className="mt-1.5 flex items-center gap-1.5 rounded-md border border-gray-200 px-2 py-1 text-[11px] text-gray-700 transition-colors hover:bg-gray-50"
        title="Ver los adjuntos"
      >
        <PaperclipIcon className="h-3 w-3 shrink-0 text-gray-400" />
        {attachments.length} adjuntos
        <span className="text-gray-400">· {formatSize(total)}</span>
      </button>
    );
  }

  async function download(attachment: AttachmentInfo) {
    setDownloadingId(attachment.id);
    const result =
      source.kind === "message"
        ? await downloadMessageAttachment(source.mailboxId, source.messageId, attachment.id)
        : await downloadScheduledAttachment(source.scheduledId, attachment.id);
    setDownloadingId(null);
    if (!result.ok) showToast("error", result.error.message);
  }

  return (
    <ul className={cn("flex flex-wrap", compact ? "mt-1.5 gap-1.5" : "mt-5 gap-2")} aria-label="Adjuntos">
      {attachments.map((attachment) => (
        <li key={attachment.id}>
          <button
            type="button"
            onClick={() => void download(attachment)}
            disabled={downloadingId === attachment.id}
            className={cn(
              "flex items-center rounded-md border border-gray-200 text-left text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-60",
              compact ? "max-w-[200px] gap-1.5 px-2 py-1 text-[11px]" : "max-w-[260px] gap-2 px-2.5 py-1.5 text-xs"
            )}
            title={`Descargar ${attachment.filename}`}
          >
            <PaperclipIcon className={cn("shrink-0 text-gray-400", compact ? "h-3 w-3" : "h-3.5 w-3.5")} />
            <span className="truncate">{attachment.filename}</span>
            <span className="shrink-0 text-gray-400">
              {downloadingId === attachment.id ? "Bajando…" : formatSize(attachment.size)}
            </span>
          </button>
        </li>
      ))}
      {compact && attachments.length > COMPACT_MAX && (
        <li>
          <button
            type="button"
            onClick={() => setExpanded(false)}
            aria-expanded={true}
            className="rounded-md px-1.5 py-1 text-[11px] text-primary-700 hover:underline"
          >
            ver menos
          </button>
        </li>
      )}
    </ul>
  );
}
