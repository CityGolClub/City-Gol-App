import { asc, desc, eq, sql } from "drizzle-orm";

import { requireAdminApiSession } from "@/lib/auth/admin";
import { getDb } from "@/lib/db/client";
import { jsonCreated, jsonError, jsonOk } from "@/lib/utils/http";
import { redemptions, users } from "@drizzle/schema";
import { z } from "zod";

const redemptionSchema = z.object({
  userId: z.string().trim().min(1),
  pointsSpent: z.coerce.number().int().positive(),
  description: z.string().trim().min(1),
});

export async function GET() {
  const auth = await requireAdminApiSession();
  if (!auth.ok) return jsonError(auth.message, auth.status);

  const db = getDb();
  const items = await db
    .select({
      id: redemptions.id,
      userId: redemptions.userId,
      adminUserId: redemptions.adminUserId,
      pointsSpent: redemptions.pointsSpent,
      description: redemptions.description,
      createdAt: redemptions.createdAt,
      userFirstName: users.firstName,
      userLastName: users.lastName,
    })
    .from(redemptions)
    .innerJoin(users, eq(redemptions.userId, users.id))
    .orderBy(desc(redemptions.createdAt));

  const userOptions = await db.select({ id: users.id, firstName: users.firstName, lastName: users.lastName, scoreVigente: users.scoreVigente }).from(users).where(eq(users.isActive, true)).orderBy(asc(users.firstName));

  return jsonOk({
    items: items.map((item) => ({
      id: item.id,
      userId: item.userId,
      userName: `${item.userFirstName} ${item.userLastName}`,
      pointsSpent: item.pointsSpent,
      description: item.description,
      createdAt: item.createdAt,
    })),
    total: items.length,
    users: userOptions.map((user) => ({
      id: user.id,
      label: `${user.firstName} ${user.lastName}`,
      scoreVigente: user.scoreVigente,
    })),
  });
}

export async function POST(request: Request) {
  const auth = await requireAdminApiSession();
  if (!auth.ok) return jsonError(auth.message, auth.status);

  const body = await request.json().catch(() => null);
  const parsed = redemptionSchema.safeParse(body);
  if (!parsed.success) return jsonError("No pudimos validar el canje", 400);

  const db = getDb();
  const result = await db.transaction(async (tx) => {
    const [user] = await tx.select().from(users).where(eq(users.id, parsed.data.userId)).limit(1);
    if (!user) return { ok: false as const, status: 404, message: "No encontramos el usuario" };
    if (user.scoreVigente < parsed.data.pointsSpent) {
      return { ok: false as const, status: 409, message: "El usuario no tiene score vigente suficiente" };
    }

    await tx
      .update(users)
      .set({
        scoreVigente: sql`${users.scoreVigente} - ${parsed.data.pointsSpent}`,
        updatedAt: new Date(),
      })
      .where(eq(users.id, parsed.data.userId));

    const [created] = await tx
      .insert(redemptions)
      .values({
        userId: parsed.data.userId,
        adminUserId: auth.user.id,
        pointsSpent: parsed.data.pointsSpent,
        description: parsed.data.description.trim(),
      })
      .returning();

    return { ok: true as const, item: created };
  });

  if (!result.ok) return jsonError(result.message, result.status);
  return jsonCreated({ success: true, item: result.item });
}
