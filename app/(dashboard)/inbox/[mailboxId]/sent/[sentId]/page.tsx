import Link from "next/link";
import { notFound } from "next/navigation";
import { getSentMessage, getThread } from "@/lib/api/messages";
import { getMailboxesForCurrentUser } from "@/lib/api/mailboxes";
import { ForwardButton } from "@/components/inbox/forward-button";
import { MessageMeta } from "@/components/inbox/message-meta";
import { Conversation } from "@/components/inbox/conversation";
import { AttachmentList } from "@/components/inbox/attachment-list";
import { ArrowLeftIcon } from "@/components/icons";

export default async function SentMessagePage({
  params,
}: {
  params: { mailboxId: string; sentId: string };
}) {
  const [message, mailboxes, thread] = await Promise.all([
    getSentMessage(params.mailboxId, params.sentId),
    getMailboxesForCurrentUser(),
    getThread(params.mailboxId, params.sentId),
  ]);
  if (!message) notFound();
  // Reenviar manda desde esta casilla: sin canSend no se muestra.
  const canSend = mailboxes.some((m) => m.id === params.mailboxId && m.canSend);

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

      <h1 className="mb-1 break-words text-lg font-medium text-gray-900 [overflow-wrap:anywhere]">
        {message.subject}
      </h1>
      <div className="mb-3" />

      {/* La conversación: los otros mensajes del hilo colapsados y este completo. */}
      <Conversation mailboxId={params.mailboxId} thread={thread} currentId={message.id}>
        <MessageMeta to={message.to} cc={message.cc} bcc={message.bcc} date={message.sentAt} />

        <div className="my-4 border-t border-gray-200" />

        {/* body es HTML ya sanitizado por el backend (quita scripts, iframes,
            formularios y `on*`): Enviados también tiene mails mandados desde Gmail. */}
        <div
          className="email-body text-sm leading-relaxed text-gray-800"
          dangerouslySetInnerHTML={{ __html: message.body }}
        />

        <AttachmentList
          source={{ kind: "message", mailboxId: params.mailboxId, messageId: message.id }}
          attachments={message.attachments}
        />

        {canSend && (
          <div className="mt-6">
            <ForwardButton messageId={message.id} />
          </div>
        )}
      </Conversation>
    </div>
  );
}
