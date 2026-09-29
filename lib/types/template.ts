export interface MessageTemplate {
  id: string;
  name: string;
  // Primera línea, para reconocer la plantilla en el menú sin tener que abrirla.
  preview: string;
  // HTML — mismo formato que guarda el editor de texto enriquecido.
  body: string;
}
