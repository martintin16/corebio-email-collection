"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ConnectMailboxDialog } from "@/components/admin/connect-mailbox-dialog";

export function ConnectMailboxButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button type="button" onClick={() => setOpen(true)}>
        Conectar casilla
      </Button>
      <ConnectMailboxDialog open={open} onClose={() => setOpen(false)} />
    </>
  );
}
