"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getNavItems } from "@/lib/nav-items";
import type { AppRole } from "@/lib/auth/session";
import { LogOutIcon, MailGlyph } from "@/components/icons";
import { cn } from "@/lib/utils";

interface SidebarContentProps {
  role: AppRole;
  userEmail: string;
  onNavigate?: () => void;
}

export function SidebarContent({ role, userEmail, onNavigate }: SidebarContentProps) {
  const pathname = usePathname();
  const items = getNavItems(role);

  return (
    <div className="flex h-full flex-col p-3">
      <div className="mb-4 flex items-center gap-2 px-2 py-1.5">
        <div className="flex h-[22px] w-[22px] items-center justify-center rounded-md bg-primary-700">
          <MailGlyph className="h-3 w-3 text-white" />
        </div>
        <span className="text-sm font-medium text-gray-900">corebio mail</span>
      </div>

      <nav className="flex flex-col gap-0.5" aria-label="Navegación principal">
        {items.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-2 rounded-md px-2.5 py-2 text-sm transition-colors",
                active
                  ? "bg-primary-100 font-medium text-primary-700"
                  : "text-gray-600 hover:bg-gray-100"
              )}
            >
              <item.icon className="h-[15px] w-[15px]" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="flex-1" />

      <AccountMenu userEmail={userEmail} />
    </div>
  );
}

// Antes era un botón que abría un popup con "Cerrar sesión" adentro — dos
// clicks para algo que se usa todo el tiempo, y encima escondido. Ahora las
// dos cosas quedan siempre visibles, una debajo de la otra: el mail primero
// (identifica la cuenta) y "Cerrar sesión" como una fila de acción aparte
// justo debajo, sin popup ni estado que coordinar.
function AccountMenu({ userEmail }: { userEmail: string }) {
  const router = useRouter();
  const initials = userEmail.slice(0, 2).toUpperCase();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="space-y-0.5 border-t border-gray-200 pt-2">
      <div className="flex items-center gap-2 rounded-md p-1.5">
        <div className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full bg-gray-200 text-[10px] font-medium text-gray-700">
          {initials}
        </div>
        <span className="truncate text-xs text-gray-700">{userEmail}</span>
      </div>

      <button
        type="button"
        onClick={handleSignOut}
        className="flex w-full items-center gap-2 rounded-md px-1.5 py-2 text-left text-sm text-gray-600 transition-colors hover:bg-gray-100"
      >
        <LogOutIcon className="h-[15px] w-[15px]" />
        Cerrar sesión
      </button>
    </div>
  );
}
