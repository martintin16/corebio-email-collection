export interface MessageTemplate {
  id: string;
  name: string;
  // Primera línea, para reconocer la plantilla en el menú sin tener que abrirla.
  preview: string;
  // HTML — mismo formato que guarda el editor de texto enriquecido.
  body: string;
  // Opcionales: si el backend no los informa, la fila de la pantalla
  // "Plantillas" simplemente no muestra "Editada por …".
  updatedAt?: string; // ISO 8601
  updatedByName?: string;
}

// Lo que se manda al crear o editar. La vista previa la calcula el backend
// a partir de `body`.
export interface TemplateInput {
  name: string;
  body: string;
}
