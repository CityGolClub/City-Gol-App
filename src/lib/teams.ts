import { and, asc, count, desc, eq, ilike, inArray, notInArray } from "drizzle-orm";

import { getDb } from "@/lib/db/client";
import { teamJoinRequests, teamMembers, teams, users } from "@drizzle/schema";

export async function getActiveTeamMembership(userId: string) {
  const db = getDb();
  const [membership] = await db
    .select({
      teamId: teamMembers.teamId,
      teamName: teams.name,
      ownerUserId: teams.ownerUserId,
      membershipId: teamMembers.id,
    })
    .from(teamMembers)
    .innerJoin(teams, eq(teamMembers.teamId, teams.id))
    .where(and(eq(teamMembers.userId, userId), eq(teamMembers.isActive, true), eq(teams.isActive, true)))
    .limit(1);

  return membership ?? null;
}

export async function getPendingTeamJoinRequest(userId: string, teamId: string) {
  const db = getDb();
  const [request] = await db
    .select()
    .from(teamJoinRequests)
    .where(and(eq(teamJoinRequests.userId, userId), eq(teamJoinRequests.teamId, teamId), eq(teamJoinRequests.status, "pending")))
    .limit(1);

  return request ?? null;
}

export async function getOwnedTeamRequests(ownerUserId: string) {
  const db = getDb();

  const ownedTeams = await db
    .select({ id: teams.id, name: teams.name })
    .from(teams)
    .where(and(eq(teams.ownerUserId, ownerUserId), eq(teams.isActive, true)))
    .orderBy(asc(teams.name));

  if (ownedTeams.length === 0) {
    return [];
  }

  const teamIds = ownedTeams.map((team) => team.id);
  const ownedTeamMap = new Map(ownedTeams.map((team) => [team.id, team.name]));

  const requests = await db
    .select({
      id: teamJoinRequests.id,
      teamId: teamJoinRequests.teamId,
      userId: teamJoinRequests.userId,
      status: teamJoinRequests.status,
      createdAt: teamJoinRequests.createdAt,
      firstName: users.firstName,
      lastName: users.lastName,
      email: users.email,
      phone: users.phone,
    })
    .from(teamJoinRequests)
    .innerJoin(users, eq(teamJoinRequests.userId, users.id))
    .where(and(inArray(teamJoinRequests.teamId, teamIds), eq(teamJoinRequests.status, "pending")))
    .orderBy(desc(teamJoinRequests.createdAt));

  return requests.map((request) => ({
    id: request.id,
    teamId: request.teamId,
    teamName: ownedTeamMap.get(request.teamId) ?? "Equipo",
    user: {
      id: request.userId,
      firstName: request.firstName,
      lastName: request.lastName,
      email: request.email,
      phone: request.phone,
    },
    createdAt: request.createdAt,
  }));
}

export async function searchTeams(query: string, currentUserId: string) {
  const db = getDb();
  const normalized = query.trim();

  const currentMembership = await getActiveTeamMembership(currentUserId);
  const excludedIds = currentMembership ? [currentMembership.teamId] : [];

  const rows = await db
    .select({
      id: teams.id,
      name: teams.name,
      ownerUserId: teams.ownerUserId,
      ownerFirstName: users.firstName,
      ownerLastName: users.lastName,
      memberCount: count(teamMembers.id),
    })
    .from(teams)
    .innerJoin(users, eq(teams.ownerUserId, users.id))
    .leftJoin(teamMembers, and(eq(teamMembers.teamId, teams.id), eq(teamMembers.isActive, true)))
    .where(
      and(
        eq(teams.isActive, true),
        normalized ? ilike(teams.name, `%${normalized}%`) : undefined,
        excludedIds.length ? notInArray(teams.id, excludedIds) : undefined,
      ),
    )
    .groupBy(teams.id, users.id)
    .orderBy(asc(teams.name));

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    ownerName: `${row.ownerFirstName} ${row.ownerLastName}`,
    memberCount: row.memberCount,
  }));
}
