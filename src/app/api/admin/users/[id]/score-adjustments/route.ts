import { eq, sql } from "drizzle-orm";

import { requireAdminApiSession } from "@/lib/auth/admin";
import { getDb } from "@/lib/db/client";
import { jsonCreated, jsonError } from "@/lib/utils/http";
import { scoreAdjustmentSchema } from "@/lib/validations/admin";
import { scoreAdjustments, users } from "@drizzle/schema";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminApiSession();

  if (!auth.ok) {
    return jsonError(auth.message, auth.status);
  }

  const { id } = await context.params;
  const body = await request.json().catch(() => null);
  const parsed = scoreAdjustmentSchema.safeParse(body);

  if (!parsed.success) {
    return jsonError("No pudimos validar el ajuste de score", 400);
  }

  const db = getDb();
  const now = new Date();

  const result = await db.transaction(async (tx) => {
    const [user] = await tx.select({ id: users.id }).from(users).where(eq(users.id, id)).limit(1);

    if (!user) {
      return { ok: false as const, status: 404, message: "No encontramos el usuario" };
    }

    const scoreColumn =
      parsed.data.scoreType === "total"
        ? users.scoreTotal
        : parsed.data.scoreType === "monthly"
          ? users.scoreMonthly
          : users.scoreVigente;

    await tx
      .update(users)
      .set({
        [parsed.data.scoreType === "total" ? "scoreTotal" : parsed.data.scoreType === "monthly" ? "scoreMonthly" : "scoreVigente"]:
          sql`${scoreColumn} + ${parsed.data.delta}`,
        updatedAt: now,
      })
      .where(eq(users.id, id));

    await tx.insert(scoreAdjustments).values({
      userId: id,
      adminUserId: auth.user.id,
      scoreType: parsed.data.scoreType,
      delta: parsed.data.delta,
      reason: parsed.data.reason.trim(),
      createdAt: now,
    });

    return { ok: true as const };
  });

  if (!result.ok) {
    return jsonError(result.message, result.status);
  }

  return jsonCreated({ success: true });
}
