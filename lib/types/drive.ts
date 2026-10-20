// La raíz del explorador ("root" es el alias de Mi unidad en la Drive API).
export const DRIVE_ROOT = { id: "root", name: "Mi unidad" } as const;

export interface DriveItem {
  id: string;
  name: string;
  type: "folder" | "file";
  parentId: string | null;
  // Si ya tiene acceso compartido hoy (antes de cualquier cambio en esta
  // sesión) — separado de la selección en curso, que vive en el estado del
  // componente y puede no coincidir mientras se edita.
  shared: boolean;
  // La persona tiene acceso solo porque está dentro de una carpeta compartida:
  // se muestra "acceso por carpeta", sin casilla para tildar.
  inherited: boolean;
}

export interface DriveAccessFailure {
  id: string;
  name: string | null;
  reason: string;
}

// Resultado de guardar "Gestionar Drive".
export interface DriveAccessResult {
  added: string[];
  removed: string[];
  // No hacía falta compartirlos: ya los cubre una carpeta compartida.
  skipped: DriveAccessFailure[];
  // No se pudieron cambiar (el resto sí se aplicó).
  failed: DriveAccessFailure[];
}
