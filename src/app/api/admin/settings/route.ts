import { jsonError, jsonOk } from "@/lib/utils/http";
import { requireAdminApiSession } from "@/lib/auth/admin";
import { getDb } from "@/lib/db/client";
import { adminSettingsSchema } from "@/lib/validations/admin";
import { systemSettings } from "@drizzle/schema";
import { desc, eq } from "drizzle-orm";

export async function GET() {
  const auth = await requireAdminApiSession();
  if (!auth.ok) return jsonError(auth.message, auth.status);

  const db = getDb();
  const [settings] = await db.select().from(systemSettings).orderBy(desc(systemSettings.updatedAt)).limit(1);
  if (!settings) return jsonError("No encontramos configuracion global", 404);
  return jsonOk(settings);
}

export async function PATCH(request: Request) {
  const auth = await requireAdminApiSession();
  if (!auth.ok) return jsonError(auth.message, auth.status);

  const body = await request.json().catch(() => null);
  const parsed = adminSettingsSchema.safeParse(body);
  if (!parsed.success) return jsonError("No pudimos validar la configuracion", 400);

  const db = getDb();
  const [settings] = await db.select().from(systemSettings).orderBy(desc(systemSettings.updatedAt)).limit(1);
  if (!settings) return jsonError("No encontramos configuracion global", 404);

  const [updated] = await db
    .update(systemSettings)
    .set({
      bookingDurationMinutes: parsed.data.bookingDurationMinutes,
      graceMinutes: parsed.data.graceMinutes,
      updatedByUserId: auth.user.id,
      updatedAt: new Date(),
    })
    .where(eq(systemSettings.id, settings.id))
    .returning();

  return jsonOk({ success: true, item: updated });
}
