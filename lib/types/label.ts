export interface MailLabel {
  // Id de la etiqueta en Gmail — lo que viaja en MessageSummary.labelIds.
  id: string;
  name: string;
  // Hex "#RRGGBB" si la etiqueta tiene color definido en Gmail; null si no
  // (el frontend le asigna uno de una paleta fija — ver lib/label-colors.ts).
  color: string | null;
}
