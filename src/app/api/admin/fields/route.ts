import { asc, eq } from "drizzle-orm";

import { requireAdminApiSession } from "@/lib/auth/admin";
import { getDb } from "@/lib/db/client";
import { jsonCreated, jsonError, jsonOk } from "@/lib/utils/http";
import { adminFieldSchema } from "@/lib/validations/admin";
import { fields } from "@drizzle/schema";

export async function GET() {
  const auth = await requireAdminApiSession();

  if (!auth.ok) return jsonError(auth.message, auth.status);

  const db = getDb();
  const rows = await db.select().from(fields).orderBy(asc(fields.displayOrder), asc(fields.name));
  return jsonOk({ items: rows, total: rows.length });
}

export async function POST(request: Request) {
  const auth = await requireAdminApiSession();

  if (!auth.ok) return jsonError(auth.message, auth.status);

  const body = await request.json().catch(() => null);
  const parsed = adminFieldSchema.safeParse(body);

  if (!parsed.success) return jsonError("No pudimos validar la cancha", 400);

  const db = getDb();
  const [existing] = await db.select({ id: fields.id }).from(fields).where(eq(fields.slug, parsed.data.slug.trim())).limit(1);

  if (existing) return jsonError("Ya existe una cancha con ese slug", 409);

  const [created] = await db
    .insert(fields)
    .values({
      name: parsed.data.name.trim(),
      slug: parsed.data.slug.trim(),
      fieldType: parsed.data.fieldType,
      defaultCheckinLimit: parsed.data.defaultCheckinLimit,
      imageUrl: parsed.data.imageUrl.trim() || null,
      displayOrder: parsed.data.displayOrder,
      isActive: parsed.data.isActive,
    })
    .returning();

  return jsonCreated({ success: true, item: created });
}
