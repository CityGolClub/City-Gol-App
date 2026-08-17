import { and, eq } from "drizzle-orm";

import { getSessionUser } from "@/lib/auth/session";
import { getDb } from "@/lib/db/client";
import { getActiveTeamMembership, getPendingTeamJoinRequest } from "@/lib/teams";
import { jsonCreated, jsonError, jsonOk } from "@/lib/utils/http";
import { teamJoinRequests, teamMembers, teams } from "@drizzle/schema";

export async function POST(_: Request, context: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return jsonError("No hay una sesion activa", 401);

  const { id } = await context.params;
  const db = getDb();

  const [team] = await db.select({ id: teams.id, ownerUserId: teams.ownerUserId }).from(teams).where(and(eq(teams.id, id), eq(teams.isActive, true))).limit(1);
  if (!team) return jsonError("No encontramos el equipo", 404);

  const activeMembership = await getActiveTeamMembership(user.id);
  if (activeMembership) return jsonError("Ya perteneces a un equipo activo", 409);
  if (team.ownerUserId === user.id) return jsonError("Ya eres owner de ese equipo", 409);

  const [activeMember] = await db
    .select({ id: teamMembers.id })
    .from(teamMembers)
    .where(and(eq(teamMembers.teamId, id), eq(teamMembers.userId, user.id), eq(teamMembers.isActive, true)))
    .limit(1);
  if (activeMember) return jsonError("Ya perteneces a ese equipo", 409);

  const pending = await getPendingTeamJoinRequest(user.id, id);
  if (pending) return jsonError("Ya tienes una solicitud pendiente para ese equipo", 409);

  const [created] = await db
    .insert(teamJoinRequests)
    .values({
      teamId: id,
      userId: user.id,
      status: "pending",
    })
    .returning();

  return jsonCreated({ success: true, requestId: created.id, message: "Solicitud enviada" });
}
