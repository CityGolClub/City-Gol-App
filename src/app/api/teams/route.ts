import { eq } from "drizzle-orm";

import { getSessionUser } from "@/lib/auth/session";
import { getDb } from "@/lib/db/client";
import { getActiveTeamMembership, searchTeams } from "@/lib/teams";
import { jsonCreated, jsonError, jsonOk } from "@/lib/utils/http";
import { teamMembers, teams } from "@drizzle/schema";
import { z } from "zod";

const createTeamSchema = z.object({
  name: z.string().trim().min(1),
});

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return jsonError("No hay una sesion activa", 401);

  const activeMembership = await getActiveTeamMembership(user.id);
  if (activeMembership) return jsonError("Ya perteneces a un equipo activo", 409);

  const body = await request.json().catch(() => null);
  const parsed = createTeamSchema.safeParse(body);
  if (!parsed.success) return jsonError("No pudimos validar el equipo", 400);

  const db = getDb();
  const [createdTeam] = await db
    .insert(teams)
    .values({
      name: parsed.data.name.trim(),
      ownerUserId: user.id,
    })
    .returning();

  await db.insert(teamMembers).values({
    teamId: createdTeam.id,
    userId: user.id,
  });

  return jsonCreated({
    id: createdTeam.id,
    name: createdTeam.name,
    ownerUserId: createdTeam.ownerUserId,
  });
}

export async function GET(request: Request) {
  const user = await getSessionUser();
  if (!user) return jsonError("No hay una sesion activa", 401);

  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") ?? "";

  const results = await searchTeams(query, user.id);
  return jsonOk(results);
}
