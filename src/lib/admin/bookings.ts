import { and, asc, desc, eq, ne } from "drizzle-orm";

import { getDb } from "@/lib/db/client";
import { bookings, fields, systemSettings, teams } from "@drizzle/schema";

export async function getLatestSystemSettings() {
  const db = getDb();
  const rows = await db.select().from(systemSettings).orderBy(desc(systemSettings.updatedAt)).limit(1);
  return rows[0] ?? null;
}

export function buildBookingWindow(startsAt: Date, durationMinutes: number, graceMinutes: number) {
  const endsAt = new Date(startsAt.getTime() + durationMinutes * 60 * 1000);
  const validFrom = new Date(startsAt.getTime() - graceMinutes * 60 * 1000);
  const validUntil = new Date(endsAt.getTime() + graceMinutes * 60 * 1000);

  return { endsAt, validFrom, validUntil };
}

export async function findBookingOverlap(fieldId: string, startsAt: Date, endsAt: Date, excludeId?: string) {
  const db = getDb();
  const rows = await db
    .select({
      id: bookings.id,
      startsAt: bookings.startsAt,
      endsAt: bookings.endsAt,
    })
    .from(bookings)
    .where(
      and(
        eq(bookings.fieldId, fieldId),
        ne(bookings.status, "cancelled"),
        excludeId ? ne(bookings.id, excludeId) : undefined,
      ),
    )
    .orderBy(asc(bookings.startsAt));

  return rows.find((row) => startsAt < row.endsAt && endsAt > row.startsAt) ?? null;
}

export async function getFieldLimitSnapshot(fieldId: string) {
  const db = getDb();
  const rows = await db.select({ limit: fields.defaultCheckinLimit }).from(fields).where(eq(fields.id, fieldId)).limit(1);
  return rows[0]?.limit ?? null;
}

export async function listAdminBookings(filters: {
  fieldId?: string | null;
  teamId?: string | null;
  status?: string | null;
  from?: Date | null;
  to?: Date | null;
}) {
  const db = getDb();

  const conditions = [
    filters.fieldId ? eq(bookings.fieldId, filters.fieldId) : undefined,
    filters.teamId ? eq(bookings.teamId, filters.teamId) : undefined,
    filters.status ? eq(bookings.status, filters.status as "scheduled" | "cancelled" | "closed") : undefined,
  ].filter(Boolean);

  const rows = await db
    .select({
      id: bookings.id,
      fieldId: bookings.fieldId,
      fieldName: fields.name,
      teamId: bookings.teamId,
      teamName: teams.name,
      clientName: bookings.clientName,
      clientPhone: bookings.clientPhone,
      startsAt: bookings.startsAt,
      endsAt: bookings.endsAt,
      validFrom: bookings.validFrom,
      validUntil: bookings.validUntil,
      qrToken: bookings.qrToken,
      checkinLimitSnapshot: bookings.checkinLimitSnapshot,
      status: bookings.status,
      createdAt: bookings.createdAt,
    })
    .from(bookings)
    .innerJoin(fields, eq(bookings.fieldId, fields.id))
    .leftJoin(teams, eq(bookings.teamId, teams.id))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(bookings.startsAt));

  return rows.filter((row) => {
    if (filters.from && row.startsAt < filters.from) return false;
    if (filters.to && row.startsAt > filters.to) return false;
    return true;
  });
}
