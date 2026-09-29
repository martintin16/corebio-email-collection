import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { DashboardShell } from "@/components/layout/dashboard-shell";

export default async function DashboardLayout({
  children,
  modal,
}: {
  children: React.ReactNode;
  modal: React.ReactNode;
}) {
  const user = await getCurrentUser();

  // Defensa en profundidad: el middleware ya debería redirigir antes de
  // llegar acá sin sesión, esto cubre igual el caso.
  if (!user) redirect("/login");

  return (
    <DashboardShell role={user.role} userEmail={user.email} modal={modal}>
      {children}
    </DashboardShell>
  );
}
