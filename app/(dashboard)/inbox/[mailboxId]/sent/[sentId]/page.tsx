import Link from "next/link";
import { notFound } from "next/navigation";
import { getSentMessage } from "@/lib/api/mail";
import { ForwardButton } from "@/components/inbox/forward-button";
import { ArrowLeftIcon } from "@/components/icons";

export default async function SentMessagePage({
  params,
}: {
  params: { mailboxId: string; sentId: string };
}) {
  const message = await getSentMessage(params.mailboxId, params.sentId);
  if (!message) notFound();

  return (
    <div className="flex h-full flex-col overflow-y-auto p-6">
      {/* Solo en mobile/tablet — en desktop la lista ya está visible al lado. */}
      <Link
        href={`/inbox/${params.mailboxId}/sent`}
        className="mb-4 inline-flex w-fit items-center gap-1.5 text-xs text-gray-500 transition-colors hover:text-gray-700 md:hidden"
      >
        <ArrowLeftIcon className="h-3.5 w-3.5" />
        Volver a enviados
      </Link>

      <h1 className="mb-1 text-lg font-medium text-gray-900">{message.subject}</h1>
      <p className="mb-4 text-xs text-gray-500">Para {message.to}</p>

      <div className="mb-5 border-t border-gray-200" />

      {/* body es el HTML que guardó el editor enriquecido al mandarlo —
          contenido propio (Redactar/Responder), no de un tercero. */}
      <div
        className="email-body text-sm leading-relaxed text-gray-800"
        dangerouslySetInnerHTML={{ __html: message.body }}
      />

      <div className="mt-6">
        <ForwardButton sentId={message.id} />
      </div>
    </div>
  );
}
