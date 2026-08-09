import { and, eq, ne } from "drizzle-orm";

import { requireAdminApiSession } from "@/lib/auth/admin";
import { getDb } from "@/lib/db/client";
import { jsonError, jsonOk } from "@/lib/utils/http";
import { adminFieldSchema } from "@/lib/validations/admin";
import { fields } from "@drizzle/schema";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminApiSession();

  if (!auth.ok) return jsonError(auth.message, auth.status);

  const { id } = await context.params;
  const body = await request.json().catch(() => null);
  const parsed = adminFieldSchema.safeParse(body);

  if (!parsed.success) return jsonError("No pudimos validar la cancha", 400);

  const db = getDb();
  const [existing] = await db.select({ id: fields.id }).from(fields).where(and(ne(fields.id, id), eq(fields.slug, parsed.data.slug.trim()))).limit(1);
  if (existing) return jsonError("Ya existe una cancha con ese slug", 409);

  const [updated] = await db
    .update(fields)
    .set({
      name: parsed.data.name.trim(),
      slug: parsed.data.slug.trim(),
      fieldType: parsed.data.fieldType,
      defaultCheckinLimit: parsed.data.defaultCheckinLimit,
      imageUrl: parsed.data.imageUrl.trim() || null,
      displayOrder: parsed.data.displayOrder,
      isActive: parsed.data.isActive,
      updatedAt: new Date(),
    })
    .where(eq(fields.id, id))
    .returning();

  if (!updated) return jsonError("No encontramos la cancha", 404);
  return jsonOk({ success: true, item: updated });
}

export async function DELETE(_: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminApiSession();
  if (!auth.ok) return jsonError(auth.message, auth.status);

  const { id } = await context.params;
  const db = getDb();
  const [updated] = await db.update(fields).set({ isActive: false, updatedAt: new Date() }).where(eq(fields.id, id)).returning({ id: fields.id });

  if (!updated) return jsonError("No encontramos la cancha", 404);
  return jsonOk({ success: true });
}
