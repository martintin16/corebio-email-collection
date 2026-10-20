import type { Metadata } from "next";
import { getMailboxConnections } from "@/lib/api/mailboxes";
import { ConnectionResultNotice } from "@/components/admin/connection-result-notice";
import { MailboxesTable } from "@/components/admin/mailboxes-table";
import { ConnectMailboxButton } from "@/components/admin/connect-mailbox-button";

export const metadata: Metadata = {
  title: "Casillas",
};

export default async function AdminMailboxesPage({
  searchParams,
}: {
  // Al volver de Google (ver connectMailbox / reconnectMailbox).
  searchParams: { connected?: string; connectionError?: string };
}) {
  const mailboxes = await getMailboxConnections();

  return (
    <div className="p-6">
      <ConnectionResultNotice
        connected={searchParams.connected}
        connectionError={searchParams.connectionError}
      />
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-lg font-medium text-gray-900">Casillas</p>
          <p className="text-xs text-gray-500">{mailboxes.length} {mailboxes.length === 1 ? "casilla" : "casillas"}</p>
        </div>
        <ConnectMailboxButton />
      </div>

      <MailboxesTable mailboxes={mailboxes} />
    </div>
  );
}
