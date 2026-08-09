import { and, asc, desc, eq, gt, ilike, lt, or } from "drizzle-orm";

import { requireAdminApiSession } from "@/lib/auth/admin";
import { getDb } from "@/lib/db/client";
import { jsonError, jsonOk } from "@/lib/utils/http";
import { teamMembers, teams, users } from "@drizzle/schema";

function getNumberParam(value: string | null) {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export async function GET(request: Request) {
  const auth = await requireAdminApiSession();

  if (!auth.ok) {
    return jsonError(auth.message, auth.status);
  }

  const db = getDb();
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();
  const teamId = searchParams.get("teamId");
  const scoreTotalGt = getNumberParam(searchParams.get("scoreTotalGt"));
  const scoreTotalLt = getNumberParam(searchParams.get("scoreTotalLt"));
  const scoreMonthlyGt = getNumberParam(searchParams.get("scoreMonthlyGt"));
  const scoreMonthlyLt = getNumberParam(searchParams.get("scoreMonthlyLt"));
  const scoreVigenteGt = getNumberParam(searchParams.get("scoreVigenteGt"));
  const scoreVigenteLt = getNumberParam(searchParams.get("scoreVigenteLt"));

  const conditions = [];

  if (q) {
    conditions.push(
      or(
        ilike(users.firstName, `%${q}%`),
        ilike(users.lastName, `%${q}%`),
        ilike(users.email, `%${q}%`),
        ilike(users.phone, `%${q}%`),
      ),
    );
  }

  if (teamId) conditions.push(eq(teams.id, teamId));
  if (scoreTotalGt !== null) conditions.push(gt(users.scoreTotal, scoreTotalGt));
  if (scoreTotalLt !== null) conditions.push(lt(users.scoreTotal, scoreTotalLt));
  if (scoreMonthlyGt !== null) conditions.push(gt(users.scoreMonthly, scoreMonthlyGt));
  if (scoreMonthlyLt !== null) conditions.push(lt(users.scoreMonthly, scoreMonthlyLt));
  if (scoreVigenteGt !== null) conditions.push(gt(users.scoreVigente, scoreVigenteGt));
  if (scoreVigenteLt !== null) conditions.push(lt(users.scoreVigente, scoreVigenteLt));

  const rows = await db
    .select({
      id: users.id,
      firstName: users.firstName,
      lastName: users.lastName,
      email: users.email,
      phone: users.phone,
      birthDate: users.birthDate,
      role: users.role,
      isActive: users.isActive,
      scoreTotal: users.scoreTotal,
      scoreMonthly: users.scoreMonthly,
      scoreVigente: users.scoreVigente,
      createdAt: users.createdAt,
      teamId: teams.id,
      teamName: teams.name,
    })
    .from(users)
    .leftJoin(teamMembers, and(eq(teamMembers.userId, users.id), eq(teamMembers.isActive, true)))
    .leftJoin(teams, and(eq(teamMembers.teamId, teams.id), eq(teams.isActive, true)))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(users.createdAt), asc(users.firstName));

  const teamOptions = await db.select({ id: teams.id, name: teams.name }).from(teams).where(eq(teams.isActive, true)).orderBy(asc(teams.name));

  return jsonOk({
    items: rows.map((row) => ({
      id: row.id,
      firstName: row.firstName,
      lastName: row.lastName,
      email: row.email,
      phone: row.phone,
      birthDate: row.birthDate,
      role: row.role,
      isActive: row.isActive,
      team: row.teamId ? { id: row.teamId, name: row.teamName } : null,
      scores: {
        total: row.scoreTotal,
        monthly: row.scoreMonthly,
        vigente: row.scoreVigente,
      },
    })),
    total: rows.length,
    teams: teamOptions,
  });
}
