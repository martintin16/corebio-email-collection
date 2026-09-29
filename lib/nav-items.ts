import type { ComponentType, SVGProps } from "react";
import { InboxIcon, EditIcon, ShieldIcon, PlugIcon } from "@/components/icons";
import type { AppRole } from "@/lib/auth/session";

export interface NavItem {
  href: string;
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
}

const BASE_ITEMS: NavItem[] = [
  { href: "/inbox", label: "Bandeja", icon: InboxIcon },
  { href: "/compose", label: "Redactar", icon: EditIcon },
];

const ADMIN_ITEMS: NavItem[] = [
  { href: "/admin/users", label: "Usuarios", icon: ShieldIcon },
  { href: "/admin/mailboxes", label: "Casillas", icon: PlugIcon },
];

export function getNavItems(role: AppRole): NavItem[] {
  return role === "admin" ? [...BASE_ITEMS, ...ADMIN_ITEMS] : BASE_ITEMS;
}
