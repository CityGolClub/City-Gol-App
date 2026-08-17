import { and, eq } from "drizzle-orm";

import { getSessionUser } from "@/lib/auth/session";
import { getOwnedTeamRequests } from "@/lib/teams";
import { jsonError, jsonOk } from "@/lib/utils/http";
import { getDb } from "@/lib/db/client";
import { teams } from "@drizzle/schema";

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return jsonError("No hay una sesion activa", 401);

  const { id } = await context.params;
  const db = getDb();
  const [team] = await db.select({ ownerUserId: teams.ownerUserId }).from(teams).where(and(eq(teams.id, id), eq(teams.isActive, true))).limit(1);
  if (!team) return jsonError("No encontramos el equipo", 404);
  if (team.ownerUserId !== user.id) return jsonError("No tienes permisos para ver estas solicitudes", 403);

  const requests = await getOwnedTeamRequests(user.id);
  return jsonOk(requests.filter((request) => request.teamId === id));
}
