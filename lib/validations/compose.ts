import { z } from "zod";
import { htmlToPlainText } from "@/lib/utils";
import { isValidEmail, parseRecipients } from "@/lib/recipients";

const recipientsField = z.string().superRefine((value, ctx) => {
  const emails = parseRecipients(value);
  const invalid = emails.find((email) => !isValidEmail(email));
  if (invalid !== undefined) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message:
        emails.length === 1 ? "Ingresá un email válido" : `"${invalid}" no es un email válido`,
    });
  }
});

export const composeSchema = z.object({
  mailboxId: z.string().min(1, "Elegí una casilla"),
  // Uno o varios destinatarios por campo, separados por coma (ver
  // lib/recipients.ts). Como en Gmail, alcanza con que haya al menos uno en
  // Para, Cc o Cco (ver el superRefine de abajo).
  to: recipientsField,
  cc: recipientsField,
  bcc: recipientsField,
  subject: z.string().min(1, "Ingresá un asunto"),
  // El editor enriquecido guarda HTML — un campo "vacío" sigue siendo un
  // string no-vacío como "<p></p>". Se valida contra el texto plano que
  // realmente ve la persona, no contra el markup.
  body: z
    .string()
    .refine((val) => htmlToPlainText(val).length > 0, "Escribí un mensaje"),
}).superRefine((values, ctx) => {
  const total =
    parseRecipients(values.to).length +
    parseRecipients(values.cc).length +
    parseRecipients(values.bcc).length;
  if (total === 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["to"],
      message: "Ingresá un destinatario",
    });
  }
});

export type ComposeFormValues = z.infer<typeof composeSchema>;
