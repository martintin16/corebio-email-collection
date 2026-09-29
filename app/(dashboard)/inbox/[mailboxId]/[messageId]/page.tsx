import Link from "next/link";
import { notFound } from "next/navigation";
import { getMessage } from "@/lib/api/mail";
import { ReplyBox } from "@/components/inbox/reply-box";
import { ArrowLeftIcon } from "@/components/icons";

export default async function MessagePage({
  params,
}: {
  params: { mailboxId: string; messageId: string };
}) {
  const message = await getMessage(params.mailboxId, params.messageId);
  if (!message) notFound();

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

      <h1 className="mb-1 text-lg font-medium text-gray-900">{message.subject}</h1>
      <p className="mb-4 text-xs text-gray-500">
        {message.from.name} &lt;{message.from.email}&gt; · para {message.to}
      </p>

      <div className="mb-5 border-t border-gray-200" />

      <p className="whitespace-pre-line text-sm leading-relaxed text-gray-800">
        {message.body}
      </p>

      <div className="mt-6">
        <ReplyBox
          mailboxId={params.mailboxId}
          messageId={message.id}
          replyToName={message.from.name}
          replyToEmail={message.from.email}
          subject={message.subject}
        />
      </div>
    </div>
  );
}
