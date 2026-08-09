import { and, eq, ne } from "drizzle-orm";

import { requireAdminApiSession } from "@/lib/auth/admin";
import { getDb } from "@/lib/db/client";
import { jsonError, jsonOk } from "@/lib/utils/http";
import { adminUserUpdateSchema } from "@/lib/validations/admin";
import { users } from "@drizzle/schema";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminApiSession();

  if (!auth.ok) {
    return jsonError(auth.message, auth.status);
  }

  const { id } = await context.params;
  const body = await request.json().catch(() => null);
  const parsed = adminUserUpdateSchema.safeParse(body);

  if (!parsed.success) {
    return jsonError("No pudimos validar los datos del usuario", 400);
  }

  const db = getDb();

  const [existingConflict] = await db
    .select({ id: users.id })
    .from(users)
    .where(
      and(
        ne(users.id, id),
        eq(users.email, parsed.data.email.trim().toLowerCase()),
      ),
    )
    .limit(1);

  if (existingConflict) {
    return jsonError("Ya existe otro usuario con ese email", 409);
  }

  const [phoneConflict] = await db
    .select({ id: users.id })
    .from(users)
    .where(and(ne(users.id, id), eq(users.phone, parsed.data.phone.trim())))
    .limit(1);

  if (phoneConflict) {
    return jsonError("Ya existe otro usuario con ese telefono", 409);
  }

  const [updated] = await db
    .update(users)
    .set({
      firstName: parsed.data.firstName.trim(),
      lastName: parsed.data.lastName.trim(),
      email: parsed.data.email.trim().toLowerCase(),
      phone: parsed.data.phone.trim(),
      birthDate: parsed.data.birthDate,
      role: parsed.data.role,
      isActive: parsed.data.isActive,
      updatedAt: new Date(),
    })
    .where(eq(users.id, id))
    .returning({ id: users.id });

  if (!updated) {
    return jsonError("No encontramos el usuario a editar", 404);
  }

  return jsonOk({ success: true });
}
