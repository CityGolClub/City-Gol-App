import { and, eq } from "drizzle-orm";

import { getDb } from "@/lib/db/client";
import { teamMembers, teams, users } from "@drizzle/schema";

export async function getUserPanelPayload(userId: string) {
  const db = getDb();

  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);

  if (!user) {
    return null;
  }

  const [membership] = await db
    .select({
      teamId: teams.id,
      teamName: teams.name,
      ownerUserId: teams.ownerUserId,
    })
    .from(teamMembers)
    .innerJoin(teams, eq(teamMembers.teamId, teams.id))
    .where(and(eq(teamMembers.userId, userId), eq(teamMembers.isActive, true), eq(teams.isActive, true)))
    .limit(1);

  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phone: user.phone,
    birthDate: user.birthDate,
    role: user.role,
    team: membership
      ? {
          id: membership.teamId,
          name: membership.teamName,
          isOwner: membership.ownerUserId === user.id,
        }
      : null,
    scores: {
      total: user.scoreTotal,
      monthly: user.scoreMonthly,
      vigente: user.scoreVigente,
    },
  };
}

export async function getUserPanelSummary(userId: string) {
  const panel = await getUserPanelPayload(userId);

  if (!panel) {
    return null;
  }

  return {
    user: {
      id: panel.id,
      firstName: panel.firstName,
      lastName: panel.lastName,
    },
    team: panel.team,
    scores: panel.scores,
  };
}
