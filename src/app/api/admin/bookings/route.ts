import { asc, eq } from "drizzle-orm";

import { requireAdminApiSession } from "@/lib/auth/admin";
import { buildBookingWindow, findBookingOverlap, getFieldLimitSnapshot, getLatestSystemSettings, listAdminBookings } from "@/lib/admin/bookings";
import { getDb } from "@/lib/db/client";
import { parseArgentinaDateTimeLocal } from "@/lib/datetime";
import { jsonCreated, jsonError, jsonOk } from "@/lib/utils/http";
import { bookings, fields, teams } from "@drizzle/schema";
import { z } from "zod";

const bookingCreateSchema = z.object({
  fieldId: z.string().trim().min(1),
  teamId: z.string().trim().optional().or(z.literal("")),
  clientName: z.string().trim().optional().or(z.literal("")),
  clientPhone: z.string().trim().optional().or(z.literal("")),
  startsAt: z.string().trim().min(1),
});

export async function GET(request: Request) {
  const auth = await requireAdminApiSession();
  if (!auth.ok) return jsonError(auth.message, auth.status);

  const url = new URL(request.url);
  const fieldId = url.searchParams.get("fieldId");
  const teamId = url.searchParams.get("teamId");
  const status = url.searchParams.get("status");
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");

  const items = await listAdminBookings({
    fieldId,
    teamId,
    status,
    from: from ? new Date(from) : null,
    to: to ? new Date(to) : null,
  });

  const db = getDb();
  const fieldOptions = await db
    .select({ id: fields.id, name: fields.name, fieldType: fields.fieldType })
    .from(fields)
    .where(eq(fields.isActive, true))
    .orderBy(asc(fields.displayOrder), asc(fields.name));
  const teamOptions = await db.select({ id: teams.id, name: teams.name }).from(teams).where(eq(teams.isActive, true)).orderBy(asc(teams.name));
  const settings = await getLatestSystemSettings();

  return jsonOk({
    items,
    total: items.length,
    fields: fieldOptions,
    teams: teamOptions,
    settings,
  });
}

export async function POST(request: Request) {
  const auth = await requireAdminApiSession();
  if (!auth.ok) return jsonError(auth.message, auth.status);

  const body = await request.json().catch(() => null);
  const parsed = bookingCreateSchema.safeParse(body);
  if (!parsed.success) return jsonError("No pudimos validar el turno", 400);

  const settings = await getLatestSystemSettings();
  if (!settings) return jsonError("No encontramos la configuracion global", 404);

  const fieldLimit = await getFieldLimitSnapshot(parsed.data.fieldId);
  if (!fieldLimit) return jsonError("No encontramos la cancha del turno", 404);

  const startsAt = parseArgentinaDateTimeLocal(parsed.data.startsAt);
  if (!startsAt) return jsonError("La fecha del turno no es valida", 400);

  const { endsAt, validFrom, validUntil } = buildBookingWindow(startsAt, settings.bookingDurationMinutes, settings.graceMinutes);
  const overlap = await findBookingOverlap(parsed.data.fieldId, startsAt, endsAt);
  if (overlap) return jsonError("Ya existe un turno que se superpone en esa cancha", 409);

  const db = getDb();
  const qrToken = crypto.randomUUID();

  const [created] = await db
    .insert(bookings)
    .values({
      fieldId: parsed.data.fieldId,
      teamId: parsed.data.teamId || null,
      clientName: parsed.data.clientName?.trim() || null,
      clientPhone: parsed.data.clientPhone?.trim() || null,
      startsAt,
      endsAt,
      validFrom,
      validUntil,
      qrToken,
      checkinLimitSnapshot: fieldLimit,
      status: "scheduled",
    })
    .returning();

  return jsonCreated({ success: true, item: created });
}
