import { z } from "zod";

export const newUserSchema = z.object({
  name: z.string().min(1, "Ingresá un nombre"),
  email: z
    .string()
    .min(1, "Ingresá un email personal")
    .email("Ingresá un email válido"),
  role: z.enum(["user", "admin"]),
  // Un registro por casilla: mailboxId -> { canSend, canRead }. No exigimos
  // mínimo de casillas marcadas acá — es una decisión de negocio que el
  // backend puede terminar de validar (ej. todo usuario necesita al menos
  // una casilla con algún permiso).
  access: z.record(
    z.object({
      canSend: z.boolean(),
      canRead: z.boolean(),
    })
  ),
});

export type NewUserFormValues = z.infer<typeof newUserSchema>;

// Mismo shape de "access" que newUserSchema, pero sin nombre/email: acá se
// edita a alguien que ya existe, esos dos campos no se tocan desde este form.
export const editPermissionsSchema = z.object({
  role: z.enum(["user", "admin"]),
  access: z.record(
    z.object({
      canSend: z.boolean(),
      canRead: z.boolean(),
    })
  ),
});

export type EditPermissionsFormValues = z.infer<typeof editPermissionsSchema>;

export const connectMailboxSchema = z.object({
  email: z
    .string()
    .min(1, "Ingresá la dirección de la casilla")
    .email("Ingresá un email válido"),
  displayName: z.string().min(1, "Ingresá un nombre visible"),
});

export type ConnectMailboxFormValues = z.infer<typeof connectMailboxSchema>;

export const editMailboxNameSchema = z.object({
  displayName: z.string().min(1, "Ingresá un nombre visible"),
});

export type EditMailboxNameFormValues = z.infer<typeof editMailboxNameSchema>;
