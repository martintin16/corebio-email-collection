"use client";

import { useState } from "react";
import { PaperclipIcon } from "@/components/icons";
import { useToast } from "@/components/ui/toast/toast-context";
import { downloadMessageAttachment } from "@/lib/api/messages.browser";
import type { AttachmentInfo } from "@/lib/types/mail";

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1).replace(".", ",")} MB`;
}

/** Los adjuntos de un recibido o enviado, cada uno con su botón de descarga. */
export function AttachmentList({
  mailboxId,
  messageId,
  attachments,
}: {
  mailboxId: string;
  messageId: string;
  attachments: AttachmentInfo[];
}) {
  const { showToast } = useToast();
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  if (attachments.length === 0) return null;

  async function download(attachment: AttachmentInfo) {
    setDownloadingId(attachment.id);
    const result = await downloadMessageAttachment(
      mailboxId,
      messageId,
      attachment.id,
    );
    setDownloadingId(null);
    if (!result.ok) showToast("error", result.error.message);
  }

  return (
    <ul className="mt-5 flex flex-wrap gap-2" aria-label="Adjuntos">
      {attachments.map((attachment) => (
        <li key={attachment.id}>
          <button
            type="button"
            onClick={() => void download(attachment)}
            disabled={downloadingId === attachment.id}
            className="flex max-w-[260px] items-center gap-2 rounded-md border border-gray-200 px-2.5 py-1.5 text-left text-xs text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-60"
            title={`Descargar ${attachment.filename}`}
          >
            <PaperclipIcon className="h-3.5 w-3.5 shrink-0 text-gray-400" />
            <span className="truncate">{attachment.filename}</span>
            <span className="shrink-0 text-gray-400">
              {downloadingId === attachment.id
                ? "Bajando…"
                : formatSize(attachment.size)}
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}
