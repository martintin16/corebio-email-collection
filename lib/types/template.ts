export interface MessageTemplate {
  id: string;
  mailboxId: string;
  name: string;
  // Primera línea, para reconocer la plantilla en el menú sin tener que abrirla.
  preview: string;
  // HTML — mismo formato que guarda el editor de texto enriquecido.
  body: string;
  // Asunto a completar al elegirla en Redactar; null si la plantilla no tiene.
  subject: string | null;
  updatedAt: string; // ISO 8601
  // null si la persona que la editó ya no existe: la fila no muestra "Editada por".
  updatedByName: string | null;
}

// Lo que se manda al crear o editar. La vista previa la calcula el backend
// a partir de `body`.
export interface TemplateInput {
  name: string;
  body: string;
  // Vacío o null = sin asunto.
  subject?: string | null;
}
