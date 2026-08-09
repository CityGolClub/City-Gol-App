import { AdminShell } from "@/modules/admin/ui/admin-shell";
import { requireAdminPageSession } from "@/lib/auth/admin";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdminPageSession();

  return <AdminShell>{children}</AdminShell>;
}
