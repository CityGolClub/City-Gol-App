import { and, eq } from "drizzle-orm";

import { getSessionUser } from "@/lib/auth/session";
import { getDb } from "@/lib/db/client";
import { jsonError, jsonOk } from "@/lib/utils/http";
import { teamJoinRequests, teamMembers, teams } from "@drizzle/schema";

export async function DELETE(_: Request, context: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return jsonError("No hay una sesion activa", 401);

  const { id } = await context.params;
  const db = getDb();
  const [team] = await db.select().from(teams).where(and(eq(teams.id, id), eq(teams.isActive, true))).limit(1);
  if (!team) return jsonError("No encontramos el equipo", 404);
  if (team.ownerUserId !== user.id) return jsonError("Solo el owner puede eliminar el equipo", 403);

  await db.transaction(async (tx) => {
    await tx.update(teams).set({ isActive: false, updatedAt: new Date() }).where(eq(teams.id, id));
    await tx.update(teamMembers).set({ isActive: false, leftAt: new Date() }).where(and(eq(teamMembers.teamId, id), eq(teamMembers.isActive, true)));
    await tx
      .update(teamJoinRequests)
      .set({ status: "cancelled", resolvedAt: new Date() })
      .where(and(eq(teamJoinRequests.teamId, id), eq(teamJoinRequests.status, "pending")));
  });

  return jsonOk({ success: true });
}
