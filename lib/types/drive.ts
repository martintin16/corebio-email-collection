export interface DriveItem {
  id: string;
  name: string;
  type: "folder" | "file";
  parentId: string | null;
  // Si ya tiene acceso compartido hoy (antes de cualquier cambio en esta
  // sesión) — separado de la selección en curso, que vive en el estado del
  // componente y puede no coincidir mientras se edita.
  shared: boolean;
}
