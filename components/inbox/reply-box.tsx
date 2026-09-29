"use client";

import { useState, type ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { PaperclipIcon, XIcon } from "@/components/icons";
import { RichTextEditor } from "@/components/compose/rich-text-editor";
import { SendSplitButton } from "@/components/compose/send-split-button";
import { useToast } from "@/components/ui/toast/toast-context";
import { LoadingOverlay } from "@/components/ui/loading-overlay";
import { htmlToPlainText } from "@/lib/utils";
import { scheduleMessage } from "@/lib/actions/schedule";
import { formatScheduledAt } from "@/lib/schedule-options";

interface ReplyBoxProps {
  mailboxId: string;
  messageId: string;
  replyToName: string;
  replyToEmail: string;
  subject: string;
}

export function ReplyBox({ mailboxId, messageId, replyToName, replyToEmail, subject }: ReplyBoxProps) {
  const { showToast } = useToast();
  const [open, setOpen] = useState(false);
  const [body, setBody] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [sending, setSending] = useState(false);
  const [bodyError, setBodyError] = useState(false);
  // Ídem ComposeForm: distingue "enviar ya" de "programar" solo para el
  // texto del overlay bloqueante.
  const [pendingAction, setPendingAction] = useState<"send" | "schedule">("send");

  if (!open) {
    return (
      <Button variant="secondary" onClick={() => setOpen(true)}>
        Responder
      </Button>
    );
  }

  function handleAttach(e: ChangeEvent<HTMLInputElement>) {
    if (e.target.files) {
      setAttachments((prev) => [...prev, ...Array.from(e.target.files!)]);
    }
    e.target.value = "";
  }

  function removeAttachment(index: number) {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSend() {
    setPendingAction("send");
    if (isEmpty) {
      setBodyError(true);
      return;
    }
    setBodyError(false);
    setSending(true);
    // TODO: POST real a `/mailboxes/${mailboxId}/messages/${messageId}/reply`
    // en el backend, mandando `body` (HTML) + `attachments` como multipart/form-data.
    await new Promise((resolve) => setTimeout(resolve, 500));
    setSending(false);
    setOpen(false);
    setBody("");
    setAttachments([]);
    showToast("success", "Respuesta enviada.");
  }

  async function handleSchedule(date: Date) {
    setPendingAction("schedule");
    if (isEmpty) {
      setBodyError(true);
      return;
    }
    setBodyError(false);
    setSending(true);
    try {
      await scheduleMessage({
        mailboxId,
        to: replyToEmail,
        subject: subject.startsWith("Re:") ? subject : `Re: ${subject}`,
        body,
        scheduledAt: date.toISOString(),
      });
      setOpen(false);
      setBody("");
      setAttachments([]);
      showToast("success", `Se enviará ${formatScheduledAt(date)}.`);
    } finally {
      setSending(false);
    }
  }

  const isEmpty = htmlToPlainText(body).length === 0;

  // El overlay bloqueante solo tiene sentido con adjuntos pesados en vuelo —
  // mismo criterio que ComposeForm.
  const showBlockingOverlay = sending && attachments.length > 0;

  return (
    <div className="relative rounded-md border border-gray-200">
      <LoadingOverlay
        active={showBlockingOverlay}
        label={pendingAction === "schedule" ? "Programando envío…" : "Enviando respuesta…"}
      />

      <div className="border-b border-gray-200 px-3.5 py-2 text-xs text-gray-500">
        Respondiendo a <span className="font-medium text-gray-900">{replyToName}</span>
      </div>

      <label htmlFor="reply-body" className="sr-only">
        Respuesta
      </label>
      <div className="px-3.5 pt-2">
        <RichTextEditor
          id="reply-body"
          value={body}
          onChange={(html) => {
            setBody(html);
            if (bodyError) setBodyError(false);
          }}
          placeholder="Escribí tu respuesta..."
          disabled={sending}
          invalid={bodyError}
          describedBy={bodyError ? "reply-body-error" : undefined}
        />
      </div>
      {bodyError && (
        <p id="reply-body-error" role="alert" className="px-3.5 pb-1 text-xs text-danger">
          Escribí una respuesta antes de {pendingAction === "schedule" ? "programar el envío" : "enviar"}.
        </p>
      )}

      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-1.5 px-3.5 pb-2">
          {attachments.map((file, i) => (
            <span
              key={`${file.name}-${i}`}
              className="flex items-center gap-1.5 rounded-md bg-gray-100 py-1 pl-2.5 pr-1.5 text-xs text-gray-600"
            >
              {file.name}
              <button
                type="button"
                onClick={() => removeAttachment(i)}
                aria-label={`Quitar ${file.name}`}
                className="text-gray-400 hover:text-gray-600"
              >
                <XIcon className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between border-t border-gray-200 px-3.5 py-2">
        <label className="cursor-pointer text-gray-400 transition-colors hover:text-gray-600">
          <PaperclipIcon className="h-4 w-4" />
          <span className="sr-only">Adjuntar archivo</span>
          <input type="file" multiple onChange={handleAttach} className="hidden" disabled={sending} />
        </label>
        <div className="flex gap-2">
          <Button type="button" variant="secondary" onClick={() => setOpen(false)} disabled={sending}>
            Cancelar
          </Button>
          <SendSplitButton
            isLoading={sending}
            onSend={handleSend}
            onSchedule={handleSchedule}
            sendLabel="Enviar respuesta"
          />
        </div>
      </div>
    </div>
  );
}
