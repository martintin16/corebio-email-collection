import { z } from "zod";
import { htmlToPlainText } from "@/lib/utils";

export const TEMPLATE_NAME_MAX = 60;

export const templateSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Ingresá un nombre")
    .max(TEMPLATE_NAME_MAX, `Máximo ${TEMPLATE_NAME_MAX} caracteres`),
  // Opcional: si tiene, se completa en Redactar cuando el asunto está vacío.
  subject: z.string().max(500, "Máximo 500 caracteres"),
  // El editor enriquecido guarda HTML — un campo "vacío" sigue siendo un
  // string no-vacío como "<p></p>". Se valida contra el texto plano, igual
  // que el cuerpo en Redactar.
  body: z
    .string()
    .refine((val) => htmlToPlainText(val).length > 0, "Escribí el contenido de la plantilla"),
});

export type TemplateFormValues = z.infer<typeof templateSchema>;
