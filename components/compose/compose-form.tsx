"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { composeSchema, type ComposeFormValues } from "@/lib/validations/compose";
import type { Mailbox } from "@/lib/types/mail";
import { Button } from "@/components/ui/button";
import { PaperclipIcon, XIcon } from "@/components/icons";
import { useToast } from "@/components/ui/toast/toast-context";
import { LoadingOverlay } from "@/components/ui/loading-overlay";
import { useComposeBlocking } from "@/components/compose/compose-blocking-context";
import { RichTextEditor } from "@/components/compose/rich-text-editor";
import { RecipientInput, type RecipientInputHandle } from "@/components/compose/recipient-input";
import { TemplatePicker } from "@/components/compose/template-picker";
import { SendSplitButton } from "@/components/compose/send-split-button";
import { htmlToPlainText } from "@/lib/utils";
import { parseRecipients } from "@/lib/recipients";
import type { PickedGroup } from "@/lib/types/contact";
import { scheduleMessage } from "@/lib/actions/schedule";
import { formatScheduledAt } from "@/lib/schedule-options";

interface ComposeFormProps {
  mailboxes: Mailbox[];
  // "modal": llegó vía navegación interna (intercepting route) → cierra con router.back().
  // "page": carga directa de /compose (refresh, link) → no hay "atrás" al que volver, va a /inbox.
  mode: "modal" | "page";
  // Prellenado al editar un envío programado desde la vista "Programados"
  // (?edit=<id> → se resuelve en el Server Component de la página).
  initialValues?: {
    mailboxId: string;
    to: string;
    subject: string;
    body: string;
  };
}

const rowClass =
  "flex items-center gap-3 border-b border-gray-200 py-2 last:border-b-0";
const rowInputClass =
  "flex-1 border-none bg-transparent p-0 text-sm text-gray-900 outline-none placeholder:text-gray-400";

export function ComposeForm({ mailboxes, mode, initialValues }: ComposeFormProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [attachments, setAttachments] = useState<File[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
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
      cc: "",
      bcc: "",
      subject: initialValues?.subject ?? "",
      body: initialValues?.body ?? "",
    },
  });

  // Para saber a qué casilla pedirle las plantillas, y si ya hay texto
  // escrito antes de insertar una (para poder confirmar el reemplazo).
  const selectedMailboxId = useWatch({ control, name: "mailboxId" });
  const bodyValue = useWatch({ control, name: "body" });
  const [toValue, ccValue, bccValue] = useWatch({ control, name: ["to", "cc", "bcc"] });
  const recipientCount =
    parseRecipients(toValue ?? "").length +
    parseRecipients(ccValue ?? "").length +
    parseRecipients(bccValue ?? "").length;

  // Cc y Cco arrancan ocultos, como en Gmail. Los dos campos siguen montados
  // aunque estén ocultos, para poder mandarle grupos a Cco desde "Para".
  const [showCc, setShowCc] = useState(false);
  const [showBcc, setShowBcc] = useState(false);
  const bccRef = useRef<RecipientInputHandle>(null);

  // Un grupo elegido en "Para" va a Cco: así sus miembros no ven los mails
  // de los demás. Es lo que pide la privacidad por defecto; si alguien
  // quiere el grupo a la vista, lo puede elegir directamente en Cc.
  function sendGroupsToBcc(groups: PickedGroup[]) {
    setShowBcc(true);
    bccRef.current?.addGroups(groups);
    showToast(
      "success",
      groups.length === 1
        ? `"${groups[0]?.name}" se agregó en Cco para que no se vean entre sí.`
        : "Los grupos se agregaron en Cco para que no se vean entre sí."
    );
  }
  const hasBodyContent = htmlToPlainText(bodyValue ?? "").length > 0;

  function handleAttach(e: ChangeEvent<HTMLInputElement>) {
    if (e.target.files) {
      setAttachments((prev) => [...prev, ...Array.from(e.target.files!)]);
    }
    e.target.value = "";
  }

  function removeAttachment(index: number) {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  }

  function goBack() {
    if (mode === "modal") router.back();
    else router.push("/inbox");
  }

  async function onSubmit(values: ComposeFormValues) {
    setFormError(null);
    setPendingAction("send");
    try {
      // TODO: reemplazar por POST real a /mailboxes/:mailboxId/messages en
      // el backend, mandando `values` + `attachments` como multipart/form-data.
      await new Promise((resolve) => setTimeout(resolve, 600));
      showToast("success", "Mensaje enviado.");
      goBack();
    } catch {
      setFormError("No pudimos enviar el mensaje. Intentá de nuevo.");
    }
  }

  async function onSchedule(values: ComposeFormValues, date: Date) {
    setFormError(null);
    setPendingAction("schedule");
    try {
      await scheduleMessage({
        mailboxId: values.mailboxId,
        to: values.to,
        cc: values.cc,
        bcc: values.bcc,
        subject: values.subject,
        body: values.body,
        scheduledAt: date.toISOString(),
      });
      showToast("success", `Se enviará ${formatScheduledAt(date)}.`);
      goBack();
    } catch {
      setFormError("No pudimos programar el envío. Intentá de nuevo.");
    }
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
  const showBlockingOverlay = isSubmitting && attachments.length > 0;

  // Si este form está dentro del modal de "Redactar", avisarle que no se
  // puede cerrar mientras el overlay de arriba está activo — si no,
  // Escape/backdrop lo cerrarían con el envío colgado a mitad de camino.
  // En mode="page" no hay modal ni Provider, así que esto no hace nada.
  const composeBlocking = useComposeBlocking();
  useEffect(() => {
    composeBlocking?.setBlocking(showBlockingOverlay);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showBlockingOverlay]);

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
          <input type="hidden" {...register("mailboxId")} />
        )}

        <div className={rowClass}>
          <label htmlFor="to" className="w-14 shrink-0 text-xs text-gray-500">
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
          <div className="flex shrink-0 gap-2 text-xs text-gray-500">
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
          <div className={rowClass}>
            <label htmlFor="cc" className="w-14 shrink-0 text-xs text-gray-500">
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
          <div className={rowClass}>
            <label htmlFor="bcc" className="w-14 shrink-0 text-xs text-gray-500">
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
        {recipientCount > 1 && (
          <p className="py-1 text-right text-xs text-gray-400" aria-live="polite">
            {recipientCount} destinatarios
          </p>
        )}

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

      {attachments.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
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

      <div className="mt-4 flex items-center justify-between border-t border-gray-200 pt-3">
        <label className="cursor-pointer text-gray-400 transition-colors hover:text-gray-600">
          <PaperclipIcon className="h-4 w-4" />
          <span className="sr-only">Adjuntar archivo</span>
          <input type="file" multiple onChange={handleAttach} className="hidden" />
        </label>

        <div className="flex gap-2">
          <Button type="button" variant="secondary" onClick={goBack} disabled={isSubmitting}>
            Cancelar
          </Button>
          <SendSplitButton
            isLoading={isSubmitting}
            disabled={isSubmitting}
            onSchedule={handleScheduleClick}
          />
        </div>
      </div>
    </form>
  );
}
