import { and, eq } from "drizzle-orm";

import { getSessionUser } from "@/lib/auth/session";
import { getDb } from "@/lib/db/client";
import { getActiveTeamMembership } from "@/lib/teams";
import { jsonError, jsonOk } from "@/lib/utils/http";
import { teamJoinRequests, teamMembers, teams } from "@drizzle/schema";

export async function POST(_: Request, context: { params: Promise<{ id: string; requestId: string }> }) {
  const user = await getSessionUser();
  if (!user) return jsonError("No hay una sesion activa", 401);

  const { id, requestId } = await context.params;
  const db = getDb();

  const [team] = await db.select({ ownerUserId: teams.ownerUserId }).from(teams).where(and(eq(teams.id, id), eq(teams.isActive, true))).limit(1);
  if (!team) return jsonError("No encontramos el equipo", 404);
  if (team.ownerUserId !== user.id) return jsonError("No tienes permisos para aceptar solicitudes", 403);

  const [request] = await db
    .select()
    .from(teamJoinRequests)
    .where(and(eq(teamJoinRequests.id, requestId), eq(teamJoinRequests.teamId, id), eq(teamJoinRequests.status, "pending")))
    .limit(1);
  if (!request) return jsonError("No encontramos la solicitud pendiente", 404);

  const existingMembership = await getActiveTeamMembership(request.userId);
  if (existingMembership) return jsonError("El usuario ya pertenece a un equipo activo", 409);

  await db.transaction(async (tx) => {
    await tx.insert(teamMembers).values({
      teamId: id,
      userId: request.userId,
    });

    await tx
      .update(teamJoinRequests)
      .set({
        status: "accepted",
        resolvedAt: new Date(),
      })
      .where(eq(teamJoinRequests.id, requestId));
  });

  return jsonOk({ success: true });
}
