import { redirect } from "next/navigation";

import { getSessionUser } from "@/lib/auth/session";

export async function requireAdminPageSession(redirectTo = "/admin/users") {
  const user = await getSessionUser();

  if (!user) {
    redirect(`/login?redirect=${encodeURIComponent(redirectTo)}`);
  }

  if (user.role !== "admin") {
    redirect("/panel");
  }

  return user;
}

export async function requireAdminApiSession() {
  const user = await getSessionUser();

  if (!user) {
    return { ok: false as const, status: 401, message: "No hay una sesion activa" };
  }

  if (user.role !== "admin") {
    return { ok: false as const, status: 403, message: "No tienes permisos de administrador" };
  }

  return { ok: true as const, user };
}
