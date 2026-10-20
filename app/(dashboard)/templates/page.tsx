import type { Metadata } from "next";
import { getMailboxesForCurrentUser } from "@/lib/api/mailboxes";
import { TemplatesScreen } from "@/components/templates/templates-screen";

export const metadata: Metadata = {
  title: "Plantillas",
};

export default async function TemplatesPage() {
  // Las plantillas se usan en Redactar: solo las casillas desde las que la persona puede enviar.
  const mailboxes = (await getMailboxesForCurrentUser()).filter((m) => m.canSend);
  return <TemplatesScreen mailboxes={mailboxes} />;
}
