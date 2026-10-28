"use client";

import { useState } from "react";
import { SidebarContent } from "@/components/layout/sidebar-content";
import { MenuIcon, XIcon } from "@/components/icons";
import { ToastProvider } from "@/components/ui/toast/toast-context";
import type { AppRole } from "@/lib/auth/session";

interface DashboardShellProps {
  role: AppRole;
  userEmail: string;
  children: React.ReactNode;
  modal: React.ReactNode;
}

export function DashboardShell({ role, userEmail, children, modal }: DashboardShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <ToastProvider>
      {/* Alto fijo (h-dvh) y no mínimo: así cada columna scrollea por su cuenta
          (la lista de mails, el detalle, el menú) en vez de la página entera.
          Con min-h-screen la página crecía con la lista y se iban de la
          pantalla el menú, las pestañas y el detalle. */}
      <div className="flex h-dvh overflow-hidden bg-white">
        {/* Desktop: rail persistente */}
        <aside className="hidden w-56 shrink-0 overflow-y-auto border-r border-gray-200 bg-gray-50 md:flex">
          <SidebarContent role={role} userEmail={userEmail} />
        </aside>

        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          {/* Mobile: topbar con hamburguesa, no existe en desktop */}
          <div className="flex shrink-0 items-center gap-3 border-b border-gray-200 px-4 py-3 md:hidden">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label="Abrir menú"
              className="text-gray-600"
            >
              <MenuIcon className="h-5 w-5" />
            </button>
            <span className="text-sm font-medium text-gray-900">corebio mail</span>
          </div>

          <main className="min-h-0 flex-1 overflow-y-auto">{children}</main>
        </div>

        {/* Mobile: drawer, montado solo mientras está abierto */}
        {mobileOpen && (
          <div className="fixed inset-0 z-40 md:hidden">
            <div
              className="absolute inset-0 bg-gray-900/40"
              onClick={() => setMobileOpen(false)}
              aria-hidden="true"
            />
            <aside className="absolute inset-y-0 left-0 flex w-64 flex-col bg-gray-50 shadow-lg">
              <div className="flex justify-end p-2">
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  aria-label="Cerrar menú"
                  className="p-1 text-gray-500"
                >
                  <XIcon className="h-5 w-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">
                <SidebarContent
                  role={role}
                  userEmail={userEmail}
                  onNavigate={() => setMobileOpen(false)}
                />
              </div>
            </aside>
          </div>
        )}

        {modal}
      </div>
    </ToastProvider>
  );
}
