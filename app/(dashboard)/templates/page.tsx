import type { Metadata } from "next";
import { getMailboxesForCurrentUser } from "@/lib/api/mail";
import { TemplatesScreen } from "@/components/templates/templates-screen";

export const metadata: Metadata = {
  title: "Plantillas",
};

export default async function TemplatesPage() {
  const mailboxes = await getMailboxesForCurrentUser();
  return <TemplatesScreen mailboxes={mailboxes} />;
}
