"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { NewUserDialog } from "@/components/admin/new-user-dialog";
import type { AdminMailbox } from "@/lib/types/admin";

export function NewUserButton({ mailboxes }: { mailboxes: AdminMailbox[] }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button type="button" onClick={() => setOpen(true)}>
        Nuevo usuario
      </Button>
      <NewUserDialog open={open} onClose={() => setOpen(false)} mailboxes={mailboxes} />
    </>
  );
}
