import { and, eq } from "drizzle-orm";

import { getSessionUser } from "@/lib/auth/session";
import { getDb } from "@/lib/db/client";
import { jsonError, jsonOk } from "@/lib/utils/http";
import { teamJoinRequests, teams } from "@drizzle/schema";

export async function POST(_: Request, context: { params: Promise<{ id: string; requestId: string }> }) {
  const user = await getSessionUser();
  if (!user) return jsonError("No hay una sesion activa", 401);

  const { id, requestId } = await context.params;
  const db = getDb();

  const [team] = await db.select({ ownerUserId: teams.ownerUserId }).from(teams).where(and(eq(teams.id, id), eq(teams.isActive, true))).limit(1);
  if (!team) return jsonError("No encontramos el equipo", 404);
  if (team.ownerUserId !== user.id) return jsonError("No tienes permisos para rechazar solicitudes", 403);

  const [updated] = await db
    .update(teamJoinRequests)
    .set({
      status: "rejected",
      resolvedAt: new Date(),
    })
    .where(and(eq(teamJoinRequests.id, requestId), eq(teamJoinRequests.teamId, id), eq(teamJoinRequests.status, "pending")))
    .returning({ id: teamJoinRequests.id });

  if (!updated) return jsonError("No encontramos la solicitud pendiente", 404);
  return jsonOk({ success: true });
}
