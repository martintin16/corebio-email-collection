import type { Metadata } from "next";
import { getMailboxConnections } from "@/lib/api/admin";
import { MailboxesTable } from "@/components/admin/mailboxes-table";
import { ConnectMailboxButton } from "@/components/admin/connect-mailbox-button";

export const metadata: Metadata = {
  title: "Casillas",
};

export default async function AdminMailboxesPage() {
  const mailboxes = await getMailboxConnections();

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-lg font-medium text-gray-900">Casillas</p>
          <p className="text-xs text-gray-500">{mailboxes.length} casillas conectadas</p>
        </div>
        <ConnectMailboxButton />
      </div>

      <MailboxesTable mailboxes={mailboxes} />
    </div>
  );
}
