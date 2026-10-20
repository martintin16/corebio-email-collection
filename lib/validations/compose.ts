import { z } from "zod";
import { htmlToPlainText } from "@/lib/utils";
import { isValidEmail, parseRecipients } from "@/lib/recipients";

export const composeSchema = z.object({
  mailboxId: z.string().min(1, "Elegí una casilla"),
  // Uno o varios destinatarios, separados por coma (ver lib/recipients.ts).
  to: z.string().superRefine((value, ctx) => {
    const emails = parseRecipients(value);
    if (emails.length === 0) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Ingresá un destinatario" });
      return;
    }
    const invalid = emails.find((email) => !isValidEmail(email));
    if (invalid !== undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          emails.length === 1 ? "Ingresá un email válido" : `"${invalid}" no es un email válido`,
      });
    }
  }),
  subject: z.string().min(1, "Ingresá un asunto"),
  // El editor enriquecido guarda HTML — un campo "vacío" sigue siendo un
  // string no-vacío como "<p></p>". Se valida contra el texto plano que
  // realmente ve la persona, no contra el markup.
  body: z
    .string()
    .refine((val) => htmlToPlainText(val).length > 0, "Escribí un mensaje"),
});

export type ComposeFormValues = z.infer<typeof composeSchema>;
