import type { Metadata } from "next";
import { loadComposePrefill, type ComposeSearchParams } from "@/lib/compose-prefill";
import { ComposeForm } from "@/components/compose/compose-form";

export const metadata: Metadata = {
  title: "Redactar",
};

export default async function ComposePage({
  searchParams,
}: {
  searchParams: ComposeSearchParams;
}) {
  const { mailboxes, title, initialValues, editingScheduled, carriedAttachments } =
    await loadComposePrefill(searchParams);

  return (
    <div className="mx-auto max-w-[480px] p-6">
      <p className="mb-4 text-sm font-medium text-gray-900">{title}</p>
      <ComposeForm
        mailboxes={mailboxes}
        mode="page"
        initialValues={initialValues}
        editingScheduled={editingScheduled}
        carriedAttachments={carriedAttachments}
      />
    </div>
  );
}
