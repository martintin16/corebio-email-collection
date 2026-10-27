import { loadComposePrefill, type ComposeSearchParams } from "@/lib/compose-prefill";
import { ComposeModalShell } from "@/components/compose/compose-modal-shell";
import { ComposeForm } from "@/components/compose/compose-form";

export default async function ComposeModalPage({
  searchParams,
}: {
  searchParams: ComposeSearchParams;
}) {
  const { mailboxes, title, initialValues, editingScheduledId, carriedAttachments } =
    await loadComposePrefill(searchParams);

  return (
    <ComposeModalShell title={title}>
      <ComposeForm
        mailboxes={mailboxes}
        mode="modal"
        initialValues={initialValues}
        editingScheduledId={editingScheduledId}
        carriedAttachments={carriedAttachments}
      />
    </ComposeModalShell>
  );
}
