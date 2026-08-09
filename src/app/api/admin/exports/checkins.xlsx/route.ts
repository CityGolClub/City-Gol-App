import { and, asc, eq } from "drizzle-orm";
import * as XLSX from "xlsx";

import { requireAdminApiSession } from "@/lib/auth/admin";
import { getDb } from "@/lib/db/client";
import { jsonError } from "@/lib/utils/http";
import { bookings, checkins, fields, teamMembers, teams, users } from "@drizzle/schema";

export async function GET(request: Request) {
  const auth = await requireAdminApiSession();
  if (!auth.ok) return jsonError(auth.message, auth.status);

  const db = getDb();
  const url = new URL(request.url);
  const fieldId = url.searchParams.get("fieldId");
  const teamId = url.searchParams.get("teamId");
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");

  const items = await db
    .select({
      checkinId: checkins.id,
      checkedInAt: checkins.checkedInAt,
      fieldName: fields.name,
      bookingStartsAt: bookings.startsAt,
      bookingEndsAt: bookings.endsAt,
      bookingTeamId: bookings.teamId,
      userId: users.id,
      firstName: users.firstName,
      lastName: users.lastName,
      email: users.email,
      phone: users.phone,
      scoreTotal: users.scoreTotal,
      scoreMonthly: users.scoreMonthly,
      scoreVigente: users.scoreVigente,
      membershipTeamName: teams.name,
    })
    .from(checkins)
    .innerJoin(bookings, eq(checkins.bookingId, bookings.id))
    .innerJoin(fields, eq(checkins.fieldId, fields.id))
    .innerJoin(users, eq(checkins.userId, users.id))
    .leftJoin(teamMembers, and(eq(teamMembers.userId, users.id), eq(teamMembers.isActive, true)))
    .leftJoin(teams, and(eq(teamMembers.teamId, teams.id), eq(teams.isActive, true)))
    .where(
      and(
        fieldId ? eq(checkins.fieldId, fieldId) : undefined,
        teamId ? eq(bookings.teamId, teamId) : undefined,
      ),
    )
    .orderBy(asc(checkins.checkedInAt));

  const filtered = items.filter((item) => {
    if (from && item.checkedInAt < new Date(from)) return false;
    if (to && item.checkedInAt > new Date(to)) return false;
    return true;
  });

  const rows = filtered.map((item) => ({
    "Fecha check-in": item.checkedInAt.toISOString(),
    Jugador: `${item.firstName} ${item.lastName}`,
    Email: item.email,
    Telefono: item.phone,
    Equipo: item.membershipTeamName ?? "Sin asignar",
    Cancha: item.fieldName,
    Turno: `${item.bookingStartsAt.toISOString()} - ${item.bookingEndsAt.toISOString()}`,
    "Score total": item.scoreTotal,
    "Score mensual": item.scoreMonthly,
    "Score vigente": item.scoreVigente,
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Checkins");
  const buffer = XLSX.write(workbook, { bookType: "xlsx", type: "buffer" });

  return new Response(buffer, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="citygol-checkins.xlsx"',
      "Cache-Control": "no-store",
    },
  });
}
