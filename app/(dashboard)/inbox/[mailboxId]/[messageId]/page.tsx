import Link from "next/link";
import { notFound } from "next/navigation";
import { getMessage, getThread } from "@/lib/api/messages";
import { getMailboxesForCurrentUser } from "@/lib/api/mailboxes";
import { ForwardButton } from "@/components/inbox/forward-button";
import { MessageMeta } from "@/components/inbox/message-meta";
import { Conversation } from "@/components/inbox/conversation";
import { ReplyBox } from "@/components/inbox/reply-box";
import { LabelPicker } from "@/components/inbox/label-picker";
import { MessageLabelChips } from "@/components/inbox/message-label-chips";
import { AttachmentList } from "@/components/inbox/attachment-list";
import { ArrowLeftIcon } from "@/components/icons";

export default async function MessagePage({
  params,
}: {
  params: { mailboxId: string; messageId: string };
}) {
  const [message, mailboxes, thread] = await Promise.all([
    getMessage(params.mailboxId, params.messageId),
    getMailboxesForCurrentUser(),
    getThread(params.mailboxId, params.messageId),
  ]);
  if (!message) notFound();
  // Responder y Reenviar mandan desde esta casilla: sin canSend no se muestran.
  const canSend = mailboxes.some((m) => m.id === params.mailboxId && m.canSend);

  return (
    <div className="flex h-full flex-col overflow-y-auto p-6">
      {/* Solo en mobile/tablet: en desktop la lista ya está visible al lado,
          "volver" no aporta nada — ver MailboxSplitView. */}
      <Link
        href={`/inbox/${params.mailboxId}`}
        className="mb-4 inline-flex w-fit items-center gap-1.5 text-xs text-gray-500 transition-colors hover:text-gray-700 md:hidden"
      >
        <ArrowLeftIcon className="h-3.5 w-3.5" />
        Volver a la bandeja
      </Link>

      <div className="mb-1 flex items-start justify-between gap-3">
        <h1 className="min-w-0 break-words text-lg font-medium text-gray-900 [overflow-wrap:anywhere]">
          {message.subject}
        </h1>
        <LabelPicker
          mailboxId={params.mailboxId}
          messageId={message.id}
          initialLabelIds={message.labelIds}
        />
      </div>
      <MessageLabelChips messageId={message.id} initialLabelIds={message.labelIds} />
      <div className="mb-3" />

      {/* La conversación: los otros mensajes del hilo colapsados y este completo. */}
      <Conversation mailboxId={params.mailboxId} thread={thread} currentId={message.id}>
        <MessageMeta from={message.from} to={message.to} cc={message.cc} date={message.receivedAt} />

        <div className="my-4 border-t border-gray-200" />

        {/* overflow-wrap: un link o una dirección larga sin espacios no ensancha la columna. */}
        <p className="whitespace-pre-line text-sm leading-relaxed text-gray-800 [overflow-wrap:anywhere]">
          {message.body}
        </p>

        <AttachmentList
          source={{ kind: "message", mailboxId: params.mailboxId, messageId: message.id }}
          attachments={message.attachments}
        />

        {canSend && (
          <div className="mt-6">
            <ReplyBox
              mailboxId={params.mailboxId}
              messageId={message.id}
              replyToName={message.from.name}
              replyToEmail={message.from.email}
              subject={message.subject}
              secondaryAction={<ForwardButton messageId={message.id} mailboxId={params.mailboxId} />}
            />
          </div>
        )}
      </Conversation>
    </div>
  );
}
