import { and, asc, count, eq } from "drizzle-orm";

import { requireAdminApiSession } from "@/lib/auth/admin";
import { getDb } from "@/lib/db/client";
import { jsonOk, jsonError } from "@/lib/utils/http";
import { teamMembers, teams, users } from "@drizzle/schema";

export async function GET() {
  const auth = await requireAdminApiSession();

  if (!auth.ok) {
    return jsonError(auth.message, auth.status);
  }

  const db = getDb();

  const rows = await db
    .select({
      id: teams.id,
      name: teams.name,
      ownerUserId: teams.ownerUserId,
      ownerFirstName: users.firstName,
      ownerLastName: users.lastName,
      memberCount: count(teamMembers.id),
      isActive: teams.isActive,
    })
    .from(teams)
    .innerJoin(users, eq(teams.ownerUserId, users.id))
    .leftJoin(teamMembers, and(eq(teamMembers.teamId, teams.id), eq(teamMembers.isActive, true)))
    .where(eq(teams.isActive, true))
    .groupBy(teams.id, users.id)
    .orderBy(asc(teams.name));

  return jsonOk({
    items: rows.map((row) => ({
      id: row.id,
      name: row.name,
      isActive: row.isActive,
      owner: {
        id: row.ownerUserId,
        fullName: `${row.ownerFirstName} ${row.ownerLastName}`,
      },
      memberCount: row.memberCount,
    })),
    total: rows.length,
  });
}
