import { PaperclipIcon } from "@/components/icons";

/** Clip chico en una fila de la lista: el mail trae adjuntos. */
export function AttachmentClip() {
  return (
    <>
      <PaperclipIcon className="h-2.5 w-2.5 shrink-0 text-gray-400" aria-hidden="true" />
      <span className="sr-only"> (con adjuntos)</span>
    </>
  );
}
