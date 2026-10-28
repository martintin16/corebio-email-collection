// Límites de adjuntos: los mismos que el backend (src/messages/attachments.ts).
// Se validan al elegir los archivos para avisar enseguida, no recién al enviar.

export const MAX_ATTACHMENTS = 10;
export const MAX_ATTACHMENTS_TOTAL_BYTES = 20 * 1024 * 1024;

export function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1).replace(".", ",")} MB`;
}

/**
 * De los archivos elegidos, los que entran sin pasarse de los límites
 * (contando los que ya hay, también los reenviados o los que ya tenía un
 * programado). Los que no entran no se agregan y se avisa por qué.
 */
export function fitAttachments(
  current: { count: number; bytes: number },
  files: File[]
): { accepted: File[]; error: string | null } {
  const accepted: File[] = [];
  let count = current.count;
  let bytes = current.bytes;
  let error: string | null = null;
  for (const file of files) {
    if (count >= MAX_ATTACHMENTS) {
      error = `Máximo ${MAX_ATTACHMENTS} adjuntos: no se agregaron todos.`;
      break;
    }
    if (bytes + file.size > MAX_ATTACHMENTS_TOTAL_BYTES) {
      error = `Los adjuntos no pueden superar los 20 MB en total: "${file.name}" no se agregó.`;
      continue;
    }
    accepted.push(file);
    count += 1;
    bytes += file.size;
  }
  return { accepted, error };
}
