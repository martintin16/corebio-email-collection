import { z } from "zod";
import { htmlToPlainText } from "@/lib/utils";

export const composeSchema = z.object({
  mailboxId: z.string().min(1, "Elegí una casilla"),
  to: z
    .string()
    .min(1, "Ingresá un destinatario")
    .email("Ingresá un email válido"),
  subject: z.string().min(1, "Ingresá un asunto"),
  // El editor enriquecido guarda HTML — un campo "vacío" sigue siendo un
  // string no-vacío como "<p></p>". Se valida contra el texto plano que
  // realmente ve la persona, no contra el markup.
  body: z
    .string()
    .refine((val) => htmlToPlainText(val).length > 0, "Escribí un mensaje"),
});

export type ComposeFormValues = z.infer<typeof composeSchema>;
