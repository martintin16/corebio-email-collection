"use client";

import { useState } from "react";
import { useForm, useWatch, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";
import { RichTextEditor } from "@/components/compose/rich-text-editor";
import { useToast } from "@/components/ui/toast/toast-context";
import { createTemplate, updateTemplate } from "@/lib/api/templates";
import {
  templateSchema,
  TEMPLATE_NAME_MAX,
  type TemplateFormValues,
} from "@/lib/validations/template";
import { normalizeText } from "@/lib/recipients";
import { cn } from "@/lib/utils";
import type { MessageTemplate } from "@/lib/types/template";

interface TemplateEditorDialogProps {
  mailboxId: string;
  // Sin `template` es "crear"; con `template`, "editar".
  template?: MessageTemplate;
  // Nombres de las demás plantillas de la casilla, para avisar de un nombre
  // repetido antes de ir al servidor (el backend igual lo confirma con 409).
  otherNames: string[];
  onClose: () => void;
  onSaved: (template: MessageTemplate) => void;
}

const NAME_TAKEN_MESSAGE = "Ya existe una plantilla con ese nombre";

// Se monta solo mientras está abierto (el padre lo renderiza condicionalmente),
// así cada apertura arranca con el formulario limpio, sin tener que resetearlo.
export function TemplateEditorDialog({
  mailboxId,
  template,
  otherNames,
  onClose,
  onSaved,
}: TemplateEditorDialogProps) {
  const { showToast } = useToast();
  const [formError, setFormError] = useState<string | null>(null);
  const [discardOpen, setDiscardOpen] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    setError,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<TemplateFormValues>({
    resolver: zodResolver(templateSchema),
    defaultValues: {
      name: template?.name ?? "",
      subject: template?.subject ?? "",
      body: template?.body ?? "",
    },
  });

  const nameValue = useWatch({ control, name: "name" }) ?? "";

  // Con cambios sin guardar, cualquier forma de cerrar (Cancelar, ✕, Escape,
  // clic afuera) pide confirmar. Sin cambios, cierra directo.
  function requestClose() {
    if (isSubmitting) return;
    if (isDirty) setDiscardOpen(true);
    else onClose();
  }

  async function onSubmit(values: TemplateFormValues) {
    setFormError(null);
    const name = values.name.trim();
    if (otherNames.some((other) => normalizeText(other.trim()) === normalizeText(name))) {
      setError("name", { message: NAME_TAKEN_MESSAGE });
      return;
    }
    const input = { name, subject: values.subject.trim() || null, body: values.body };
    try {
      const result = template
        ? await updateTemplate(mailboxId, template.id, input)
        : await createTemplate(mailboxId, input);
      if (!result.ok) {
        if (result.error.code === "TEMPLATE_NAME_TAKEN") {
          setError("name", { message: NAME_TAKEN_MESSAGE });
          return;
        }
        setFormError(result.error.message);
        return;
      }
      showToast("success", "Plantilla guardada.");
      onSaved(result.data);
    } catch {
      setFormError("No pudimos guardar la plantilla. Intentá de nuevo.");
    }
  }

  const overLimit = nameValue.length > TEMPLATE_NAME_MAX;

  return (
    <>
      <Dialog
        open
        title={template ? "Editar plantilla" : "Nueva plantilla"}
        onClose={requestClose}
        preventClose={isSubmitting}
        maxWidthClassName="max-w-[620px]"
      >
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          {formError && (
            <div
              role="alert"
              className="mb-3.5 rounded-md border border-red-200 bg-danger-bg px-3 py-2 text-xs text-danger-text"
            >
              {formError}
            </div>
          )}

          <FormField id="template-name" label="Nombre" error={errors.name?.message}>
            <Input
              id="template-name"
              placeholder="Confirmación de reunión"
              autoComplete="off"
              aria-invalid={!!errors.name}
              {...register("name")}
            />
            <p
              aria-hidden="true"
              className={cn(
                "mt-1 text-right text-[11px]",
                overLimit ? "text-danger" : "text-gray-400"
              )}
            >
              {nameValue.length} / {TEMPLATE_NAME_MAX}
            </p>
          </FormField>

          <FormField
            id="template-subject"
            label="Asunto (opcional)"
            error={errors.subject?.message}
          >
            <Input
              id="template-subject"
              placeholder="Se completa en Redactar si el asunto está vacío"
              autoComplete="off"
              aria-invalid={!!errors.subject}
              {...register("subject")}
            />
          </FormField>

          <div className="mb-1">
            <label htmlFor="template-body" className="mb-1.5 block text-xs font-medium text-gray-700">
              Contenido
            </label>
            <Controller
              control={control}
              name="body"
              render={({ field }) => (
                <RichTextEditor
                  id="template-body"
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Escribí el texto de la plantilla…"
                  invalid={!!errors.body}
                  describedBy={errors.body ? "template-body-error" : "template-body-hint"}
                />
              )}
            />
            {errors.body ? (
              <p id="template-body-error" role="alert" className="mt-1.5 text-xs text-danger">
                {errors.body.message}
              </p>
            ) : (
              <p id="template-body-hint" className="mt-1.5 text-[11px] leading-relaxed text-gray-500">
                Tip: escribí entre [corchetes] lo que hay que completar antes de enviar. Al insertar la
                plantilla en Redactar quedan a la vista para reemplazarlos.
              </p>
            )}
          </div>

          <div className="mt-4 flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={requestClose} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              {template ? "Guardar cambios" : "Crear plantilla"}
            </Button>
          </div>
        </form>
      </Dialog>

      <ConfirmDialog
        open={discardOpen}
        title="¿Descartar los cambios?"
        description="Lo que escribiste no se guardó y se va a perder."
        confirmLabel="Descartar"
        onConfirm={onClose}
        onCancel={() => setDiscardOpen(false)}
      />
    </>
  );
}
