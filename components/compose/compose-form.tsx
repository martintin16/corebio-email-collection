"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { composeSchema, type ComposeFormValues } from "@/lib/validations/compose";
import type { Mailbox } from "@/lib/types/mail";
import { Button } from "@/components/ui/button";
import { ClockIcon, PaperclipIcon, XIcon } from "@/components/icons";
import { useToast } from "@/components/ui/toast/toast-context";
import { LoadingOverlay } from "@/components/ui/loading-overlay";
import { useComposeBlocking } from "@/components/compose/compose-blocking-context";
import { RichTextEditor } from "@/components/compose/rich-text-editor";
import { RecipientInput, type RecipientInputHandle } from "@/components/compose/recipient-input";
import { TemplatePicker } from "@/components/compose/template-picker";
import { SendSplitButton } from "@/components/compose/send-split-button";
import { htmlToPlainText } from "@/lib/utils";
import { isValidEmail, parseRecipients } from "@/lib/recipients";
import type { PickedGroup } from "@/lib/types/contact";
import type { AttachmentInfo } from "@/lib/types/mail";
import type { ScheduledMessageStatus } from "@/lib/types/scheduled-message";
import { sendMessage } from "@/lib/api/messages.browser";
import { scheduleMessage, updateScheduledMessage } from "@/lib/api/scheduled-messages.browser";
import { formatScheduledAt } from "@/lib/schedule-options";
import { revalidateInbox } from "@/lib/api/revalidate";
import { fitAttachments, formatSize } from "@/lib/attachments";

interface ComposeFormProps {
  mailboxes: Mailbox[];
  // "modal": llegó vía navegación interna (intercepting route) → cierra con router.back().
  // "page": carga directa de /compose (refresh, link) → no hay "atrás" al que volver, va a la
  // casilla elegida en "De" (o a /inbox si esa casilla no se puede leer).
  mode: "modal" | "page";
  // Prellenado al editar un envío programado desde la vista "Programados"
  // (?edit=<id> → se resuelve en el Server Component de la página).
  initialValues?: {
    mailboxId: string;
    to: string;
    cc?: string;
    bcc?: string;
    subject: string;
    body: string;
  };
  // Si viene, se edita ese envío programado en vez de crear uno.
  editingScheduled?: EditingScheduled;
  carriedAttachments?: CarriedAttachments;
}

/**
 * Adjuntos que no se suben desde la compu: los del mensaje que se reenvía
 * (`forward`) o los que ya tiene el programado que se edita (`keep`). Se
 * muestran como chips y se pueden quitar.
 */
export type CarriedAttachments =
  | { kind: "forward"; messageId: string; attachments: AttachmentInfo[] }
  | { kind: "keep"; attachments: AttachmentInfo[] };

/** El programado que se está editando (?edit=<id>). */
export interface EditingScheduled {
  id: string;
  scheduledAt: string;
  status: ScheduledMessageStatus;
}

/** "Enviar ahora" un programado que se está editando: lo antes que acepta el backend (1 minuto). */
const SEND_NOW_DELAY_MS = 75_000;

const rowClass =
  "flex items-center gap-3 border-b border-gray-200 py-2 last:border-b-0";
// Para / Cc / Cco: con muchos chips el campo crece hacia abajo, así que la
// etiqueta va arriba (no centrada en medio de un bloque alto).
const recipientRowClass =
  "flex items-start gap-3 border-b border-gray-200 py-2 last:border-b-0";
const recipientLabelClass = "w-14 shrink-0 pt-1.5 text-xs text-gray-500";
const chipClass =
  "flex max-w-[240px] items-center gap-1.5 rounded-md bg-gray-100 py-1 pl-2.5 pr-1.5 text-xs text-gray-600";
const rowInputClass =
  "flex-1 border-none bg-transparent p-0 text-sm text-gray-900 outline-none placeholder:text-gray-400";

export function ComposeForm({
  mailboxes,
  mode,
  initialValues,
  editingScheduled,
  carriedAttachments,
}: ComposeFormProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [attachments, setAttachments] = useState<File[]>([]);
  const [carried, setCarried] = useState<AttachmentInfo[]>(carriedAttachments?.attachments ?? []);
  const [formError, setFormError] = useState<string | null>(null);
  // Adjuntos que no entraron (más de 10 o más de 20 MB), se avisa junto a la lista.
  const [attachError, setAttachError] = useState<string | null>(null);
  // Distingue "enviar ya" de "programar" solo para el texto del overlay —
  // ambos caminos comparten el mismo isSubmitting de react-hook-form.
  const [pendingAction, setPendingAction] = useState<"send" | "schedule">("send");

  const {
    register,
    handleSubmit,
    control,
    setValue,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<ComposeFormValues>({
    resolver: zodResolver(composeSchema),
    defaultValues: {
      mailboxId: initialValues?.mailboxId ?? mailboxes[0]?.id ?? "",
      to: initialValues?.to ?? "",
      cc: initialValues?.cc ?? "",
      bcc: initialValues?.bcc ?? "",
      subject: initialValues?.subject ?? "",
      body: initialValues?.body ?? "",
    },
  });

  // Para saber a qué casilla pedirle las plantillas, y si ya hay texto
  // escrito antes de insertar una (para poder confirmar el reemplazo).
  const selectedMailboxId = useWatch({ control, name: "mailboxId" });
  const bodyValue = useWatch({ control, name: "body" });
  const [toValue, ccValue, bccValue] = useWatch({ control, name: ["to", "cc", "bcc"] });
  // Solo los emails válidos: lo que se está escribiendo ("gru…") no suma.
  const recipientCount = [toValue, ccValue, bccValue]
    .flatMap((value) => parseRecipients(value ?? ""))
    .filter(isValidEmail).length;

  // Editando un programado: ¿se puede mantener su fecha? Solo si sigue
  // pendiente y falta más de lo que tarda "enviar ahora" (si no, guardar con
  // esa fecha lo mandaría igual en el próximo minuto, o el backend la rechaza).
  const scheduledDate = editingScheduled ? new Date(editingScheduled.scheduledAt) : undefined;
  const keepScheduledDate =
    editingScheduled?.status === "pending" &&
    scheduledDate !== undefined &&
    scheduledDate.getTime() > Date.now() + SEND_NOW_DELAY_MS;

  // Cc y Cco arrancan ocultos, como en Gmail. Los dos campos siguen montados
  // aunque estén ocultos, para poder mandarle grupos a Cco desde "Para".
  const [showCc, setShowCc] = useState(Boolean(initialValues?.cc));
  const [showBcc, setShowBcc] = useState(Boolean(initialValues?.bcc));
  const bccRef = useRef<RecipientInputHandle>(null);

  // Un grupo elegido en "Para" va a Cco: así sus miembros no ven los mails
  // de los demás. Es lo que pide la privacidad por defecto; si alguien
  // quiere el grupo a la vista, lo puede elegir directamente en Cc.
  function sendGroupsToBcc(groups: PickedGroup[]) {
    setShowBcc(true);
    const added = bccRef.current?.addGroups(groups) ?? groups.length;
    if (added === 0) {
      // Ya estaban: avisar igual, así elegirlo (con mouse o Enter) nunca parece no hacer nada.
      showToast(
        "success",
        groups.length === 1 ? `"${groups[0]?.name}" ya está en Cco.` : "Esos grupos ya están en Cco."
      );
      return;
    }
    showToast(
      "success",
      groups.length === 1
        ? `"${groups[0]?.name}" se agregó en Cco para que no se vean entre sí.`
        : "Los grupos se agregaron en Cco para que no se vean entre sí."
    );
  }
  const hasBodyContent = htmlToPlainText(bodyValue ?? "").length > 0;

  // Cuenta lo subido y lo que viene de Gmail (reenviados o los que ya tenía el programado).
  const attachmentCount = attachments.length + carried.length;
  const attachmentBytes =
    attachments.reduce((sum, file) => sum + file.size, 0) +
    carried.reduce((sum, a) => sum + a.size, 0);

  function handleAttach(e: ChangeEvent<HTMLInputElement>) {
    if (e.target.files) {
      const { accepted, error } = fitAttachments(
        { count: attachmentCount, bytes: attachmentBytes },
        Array.from(e.target.files)
      );
      setAttachments((prev) => [...prev, ...accepted]);
      setAttachError(error);
    }
    e.target.value = "";
  }

  function removeAttachment(index: number) {
    setAttachError(null);
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  }

  function removeCarried(id: string) {
    setAttachError(null);
    setCarried((prev) => prev.filter((a) => a.id !== id));
  }

  /**
   * Cierra Redactar. Después de enviar o programar (`changed`), primero
   * revalida las bandejas: si no, al volver se verían Enviados y Programados
   * como estaban antes (salen del caché del router).
   */
  async function goBack(changed = false) {
    if (changed) {
      try {
        await revalidateInbox();
      } catch {
        // Si falla, el envío ya salió igual: se ve al recargar.
      }
    }
    if (mode === "modal") {
      router.back();
      return;
    }
    const mailbox = mailboxes.find((m) => m.id === getValues("mailboxId"));
    router.push(mailbox?.canRead ? `/inbox/${mailbox.id}` : "/inbox");
  }

  /** Adjuntos del mensaje original que siguen en la lista (Reenviar). */
  function forwardedRefs() {
    if (carriedAttachments?.kind !== "forward") return undefined;
    const { messageId } = carriedAttachments;
    return carried.map((a) => ({ messageId, attachmentId: a.id }));
  }

  async function onSubmit(values: ComposeFormValues) {
    setFormError(null);
    setPendingAction("send");
    // Editando un programado, el botón principal guarda los cambios y deja la
    // fecha como estaba. Si ya no se puede mantener (falló, o su hora pasó o
    // está a menos de un minuto), lo manda en la próxima vuelta del envío
    // automático, y el botón lo dice ("Guardar y enviar ahora").
    if (editingScheduled) {
      if (keepScheduledDate) {
        await saveScheduled(
          values,
          null,
          `Cambios guardados. Se enviará ${formatScheduledAt(new Date(editingScheduled.scheduledAt))}.`
        );
      } else {
        await sendScheduledNow(values);
      }
      return;
    }
    try {
      const result = await sendMessage(
        {
          mailboxId: values.mailboxId,
          to: values.to,
          cc: values.cc,
          bcc: values.bcc,
          subject: values.subject,
          body: values.body,
          forwardedAttachments: forwardedRefs(),
        },
        attachments
      );
      if (!result.ok) {
        // El backend ya manda el motivo en español (ej. cupo diario: "quedan N").
        setFormError(result.error.message);
        return;
      }
      showToast("success", "Mensaje enviado.");
      await goBack(true);
    } catch {
      setFormError("No pudimos enviar el mensaje. Intentá de nuevo.");
    }
  }

  /** "Enviar ahora" un programado que se está editando: sale en un minuto, con sus adjuntos. */
  async function sendScheduledNow(values: ComposeFormValues) {
    await saveScheduled(values, new Date(Date.now() + SEND_NOW_DELAY_MS), "Se enviará en un minuto.");
  }

  /**
   * Crea o edita un programado. `date` null (solo al editar) = mantener la
   * fecha que ya tiene: no se manda scheduledAt y el backend la conserva.
   */
  async function saveScheduled(values: ComposeFormValues, date: Date | null, successMessage: string) {
    const fields = {
      to: values.to,
      cc: values.cc,
      bcc: values.bcc,
      subject: values.subject,
      body: values.body,
    };
    try {
      const result = editingScheduled
        ? await updateScheduledMessage(
            editingScheduled.id,
            {
              ...fields,
              ...(date ? { scheduledAt: date.toISOString() } : {}),
              keepAttachmentIds: carried.map((a) => a.id),
            },
            attachments
          )
        : await scheduleMessage(
            {
              ...fields,
              mailboxId: values.mailboxId,
              scheduledAt: (date ?? new Date()).toISOString(),
              forwardedAttachments: forwardedRefs(),
            },
            attachments
          );
      if (!result.ok) {
        setFormError(result.error.message);
        return;
      }
      showToast("success", successMessage);
      await goBack(true);
    } catch {
      setFormError("No pudimos programar el envío. Intentá de nuevo.");
    }
  }

  async function onSchedule(values: ComposeFormValues, date: Date) {
    setFormError(null);
    setPendingAction("schedule");
    await saveScheduled(values, date, `Se enviará ${formatScheduledAt(date)}.`);
  }

  // El botón "Programar" del menú dispara la misma validación que "Enviar"
  // (handleSubmit corre igual, sin necesidad de un evento de submit real) —
  // así un "Para" vacío se marca en rojo antes de programar, no después.
  function handleScheduleClick(date: Date) {
    void handleSubmit((values) => onSchedule(values, date))();
  }

  // El overlay bloqueante solo tiene sentido cuando hay algo pesado en
  // vuelo (adjuntos): para un mail de puro texto, el spinner del botón ya
  // alcanza y bloquear toda la pantalla sería una interrupción de más.
  const showBlockingOverlay = isSubmitting && attachments.length + carried.length > 0;

  // Si este form está dentro del modal de "Redactar", avisarle que no se
  // puede cerrar mientras el overlay de arriba está activo — si no,
  // Escape/backdrop lo cerrarían con el envío colgado a mitad de camino.
  // En mode="page" no hay modal ni Provider, así que esto no hace nada.
  const composeBlocking = useComposeBlocking();
  useEffect(() => {
    composeBlocking?.setBlocking(showBlockingOverlay);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showBlockingOverlay]);

  // ¿Hay algo sin enviar? Para que cerrar el modal (Escape, X, fondo,
  // Cancelar) pregunte antes de descartarlo. Se compara contra lo que había
  // al abrir (el cuerpo como texto: el editor normaliza el HTML al montarse).
  const subjectValue = useWatch({ control, name: "subject" });
  const hasChanges =
    (toValue ?? "") !== (initialValues?.to ?? "") ||
    (ccValue ?? "") !== (initialValues?.cc ?? "") ||
    (bccValue ?? "") !== (initialValues?.bcc ?? "") ||
    (subjectValue ?? "") !== (initialValues?.subject ?? "") ||
    htmlToPlainText(bodyValue ?? "") !== htmlToPlainText(initialValues?.body ?? "") ||
    attachments.length > 0 ||
    carried.length !== (carriedAttachments?.attachments.length ?? 0);
  useEffect(() => {
    composeBlocking?.setDirty(hasChanges);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasChanges]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="relative">
      <LoadingOverlay
        active={showBlockingOverlay}
        label={pendingAction === "schedule" ? "Programando envío…" : "Enviando mensaje…"}
      />

      {formError && (
        <div
          role="alert"
          className="mb-3 rounded-md border border-red-200 bg-danger-bg px-3 py-2 text-xs text-danger-text"
        >
          {formError}
        </div>
      )}

      {editingScheduled && (
        <p
          className={
            keepScheduledDate
              ? "mb-3 flex items-center gap-1.5 rounded-md bg-primary-100 px-3 py-2 text-xs text-primary-700"
              : "mb-3 flex items-center gap-1.5 rounded-md bg-warning-bg px-3 py-2 text-xs text-warning"
          }
        >
          <ClockIcon className="h-3.5 w-3.5 shrink-0" />
          {keepScheduledDate && scheduledDate
            ? `Programado para ${formatScheduledAt(scheduledDate)}. "Guardar cambios" mantiene la fecha.`
            : editingScheduled.status === "failed"
              ? "Este envío no salió. Al guardar se manda en un minuto, o elegí otra fecha en el menú."
              : "Su hora ya está por llegar. Al guardar se manda en un minuto, o elegí otra fecha en el menú."}
        </p>
      )}

      <div>
        {mailboxes.length > 1 ? (
          <div className={rowClass}>
            <label htmlFor="mailboxId" className="w-14 shrink-0 text-xs text-gray-500">
              De
            </label>
            <select id="mailboxId" className={rowInputClass} {...register("mailboxId")}>
              {mailboxes.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.email}
                </option>
              ))}
            </select>
          </div>
        ) : (
          // Con una sola casilla no hay nada que elegir, pero igual se muestra
          // desde cuál sale el mail.
          <div className={rowClass}>
            <span className="w-14 shrink-0 text-xs text-gray-500">De</span>
            <span className="flex-1 truncate text-sm text-gray-500">{mailboxes[0]?.email}</span>
            <input type="hidden" {...register("mailboxId")} />
          </div>
        )}

        <div className={recipientRowClass}>
          <label htmlFor="to" className={recipientLabelClass}>
            Para
          </label>
          <Controller
            control={control}
            name="to"
            render={({ field }) => (
              <RecipientInput
                id="to"
                onGroupsPicked={sendGroupsToBcc}
                mailboxId={selectedMailboxId}
                value={field.value}
                onChange={field.onChange}
                invalid={!!errors.to}
                describedBy={errors.to ? "to-error" : undefined}
              />
            )}
          />
          <div className="flex shrink-0 gap-2 pt-1.5 text-xs text-gray-500">
            {!showCc && (
              <button type="button" onClick={() => setShowCc(true)} className="hover:text-gray-800 hover:underline">
                Cc
              </button>
            )}
            {!showBcc && (
              <button type="button" onClick={() => setShowBcc(true)} className="hover:text-gray-800 hover:underline">
                Cco
              </button>
            )}
          </div>
        </div>
        {errors.to && (
          <p id="to-error" role="alert" className="pl-[68px] text-xs text-danger">
            {errors.to.message}
          </p>
        )}

        <div className={showCc ? undefined : "hidden"}>
          <div className={recipientRowClass}>
            <label htmlFor="cc" className={recipientLabelClass}>
              Cc
            </label>
            <Controller
              control={control}
              name="cc"
              render={({ field }) => (
                <RecipientInput
                  id="cc"
                  mailboxId={selectedMailboxId}
                  value={field.value}
                  onChange={field.onChange}
                  invalid={!!errors.cc}
                  describedBy={errors.cc ? "cc-error" : undefined}
                  placeholder="Con copia visible para todos"
                />
              )}
            />
          </div>
          {errors.cc && (
            <p id="cc-error" role="alert" className="pl-[68px] text-xs text-danger">
              {errors.cc.message}
            </p>
          )}
        </div>

        <div className={showBcc ? undefined : "hidden"}>
          <div className={recipientRowClass}>
            <label htmlFor="bcc" className={recipientLabelClass}>
              Cco
            </label>
            <Controller
              control={control}
              name="bcc"
              render={({ field }) => (
                <RecipientInput
                  ref={bccRef}
                  id="bcc"
                  mailboxId={selectedMailboxId}
                  value={field.value}
                  onChange={field.onChange}
                  invalid={!!errors.bcc}
                  describedBy={errors.bcc ? "bcc-error" : "bcc-hint"}
                  placeholder="Copia oculta"
                />
              )}
            />
          </div>
          {errors.bcc ? (
            <p id="bcc-error" role="alert" className="pl-[68px] text-xs text-danger">
              {errors.bcc.message}
            </p>
          ) : (
            <p id="bcc-hint" className="pb-1.5 pl-[68px] text-xs text-gray-400">
              Quienes estén en Cco no se ven entre sí ni aparecen para el resto.
            </p>
          )}
        </div>

        <div className={rowClass}>
          <label htmlFor="subject" className="w-14 shrink-0 text-xs text-gray-500">
            Asunto
          </label>
          <input
            id="subject"
            type="text"
            placeholder="Asunto del mensaje"
            className={rowInputClass}
            aria-invalid={!!errors.subject}
            aria-describedby={errors.subject ? "subject-error" : undefined}
            {...register("subject")}
          />
        </div>
        {errors.subject && (
          <p id="subject-error" role="alert" className="pl-[68px] text-xs text-danger">
            {errors.subject.message}
          </p>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between">
        <label htmlFor="body" className="text-xs text-gray-500">
          Mensaje
        </label>
        {selectedMailboxId && (
          <TemplatePicker
            mailboxId={selectedMailboxId}
            hasContent={hasBodyContent}
            onInsert={(html, subject) => {
              setValue("body", html, { shouldValidate: true, shouldDirty: true });
              // El asunto de la plantilla solo se usa si todavía no se escribió uno.
              if (subject && !getValues("subject").trim()) {
                setValue("subject", subject, { shouldValidate: true, shouldDirty: true });
              }
            }}
          />
        )}
      </div>
      <div className="mt-1">
        <Controller
          name="body"
          control={control}
          render={({ field }) => (
            <RichTextEditor
              id="body"
              value={field.value}
              onChange={field.onChange}
              disabled={isSubmitting}
              invalid={!!errors.body}
              describedBy={errors.body ? "body-error" : undefined}
            />
          )}
        />
      </div>
      {errors.body && (
        <p id="body-error" role="alert" className="text-xs text-danger">
          {errors.body.message}
        </p>
      )}

      {attachmentCount > 1 && (
        <p className="mt-2 text-xs text-gray-400" aria-live="polite">
          {attachmentCount} adjuntos · {formatSize(attachmentBytes)}
        </p>
      )}
      {attachError && (
        <p role="alert" className="mt-1 text-xs text-danger">
          {attachError}
        </p>
      )}
      {attachmentCount > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {carried.map((attachment) => (
            <span
              key={`carried-${attachment.id}`}
              className={chipClass}
              title={`${attachment.filename} · ${
                carriedAttachments?.kind === "forward"
                  ? "Adjunto del mensaje original"
                  : "Adjunto que ya tenía el envío"
              }`}
            >
              <PaperclipIcon className="h-3 w-3 shrink-0 text-gray-400" />
              <span className="truncate">{attachment.filename}</span>
              <span className="shrink-0 text-gray-400">{formatSize(attachment.size)}</span>
              <button
                type="button"
                onClick={() => removeCarried(attachment.id)}
                aria-label={`Quitar ${attachment.filename}`}
                className="shrink-0 text-gray-400 hover:text-gray-600"
              >
                <XIcon className="h-3 w-3" />
              </button>
            </span>
          ))}
          {attachments.map((file, i) => (
            <span key={`${file.name}-${i}`} className={chipClass} title={file.name}>
              <span className="truncate">{file.name}</span>
              <span className="shrink-0 text-gray-400">{formatSize(file.size)}</span>
              <button
                type="button"
                onClick={() => removeAttachment(i)}
                aria-label={`Quitar ${file.name}`}
                className="shrink-0 text-gray-400 hover:text-gray-600"
              >
                <XIcon className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Pie pegado abajo del área que scrollea (modal) o de la página (/compose):
          con muchos destinatarios o adjuntos, "Enviar" siempre queda a la vista. */}
      <div className="sticky bottom-0 z-10 mt-4 flex items-center justify-between border-t border-gray-200 bg-white pb-4 pt-3">
        <div className="flex items-center gap-3">
          <label className="cursor-pointer text-gray-400 transition-colors hover:text-gray-600">
            <PaperclipIcon className="h-4 w-4" />
            <span className="sr-only">Adjuntar archivo</span>
            <input type="file" multiple onChange={handleAttach} className="hidden" />
          </label>
          {/* Abajo, junto a los botones: así no lo tapan las sugerencias de contactos. */}
          <p className="text-xs text-gray-400" aria-live="polite">
            {recipientCount > 1 ? `${recipientCount} destinatarios` : ""}
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            type="button"
            variant="secondary"
            // En el modal, cerrar pregunta si hay algo sin enviar (ComposeBlockingProvider).
            onClick={() => (composeBlocking ? composeBlocking.requestClose() : void goBack())}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <SendSplitButton
            isLoading={isSubmitting}
            disabled={isSubmitting}
            onSchedule={handleScheduleClick}
            sendLabel={
              editingScheduled ? (keepScheduledDate ? "Guardar cambios" : "Guardar y enviar ahora") : "Enviar"
            }
            extraActions={
              editingScheduled && keepScheduledDate
                ? [
                    {
                      label: "Enviar ahora",
                      onSelect: () =>
                        void handleSubmit(async (values) => {
                          setFormError(null);
                          setPendingAction("send");
                          await sendScheduledNow(values);
                        })(),
                    },
                  ]
                : []
            }
            initialDate={scheduledDate}
          />
        </div>
      </div>
    </form>
  );
}
