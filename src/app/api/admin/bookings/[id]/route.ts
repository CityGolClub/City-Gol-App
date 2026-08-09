import { eq } from "drizzle-orm";

import { requireAdminApiSession } from "@/lib/auth/admin";
import { buildBookingWindow, findBookingOverlap, getFieldLimitSnapshot, getLatestSystemSettings } from "@/lib/admin/bookings";
import { getDb } from "@/lib/db/client";
import { jsonError, jsonOk } from "@/lib/utils/http";
import { bookings } from "@drizzle/schema";
import { z } from "zod";

const bookingUpdateSchema = z.object({
  fieldId: z.string().trim().min(1),
  teamId: z.string().trim().optional().or(z.literal("")),
  startsAt: z.string().trim().min(1),
  status: z.enum(["scheduled", "cancelled", "closed"]),
});

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminApiSession();
  if (!auth.ok) return jsonError(auth.message, auth.status);

  const { id } = await context.params;
  const body = await request.json().catch(() => null);
  const parsed = bookingUpdateSchema.safeParse(body);
  if (!parsed.success) return jsonError("No pudimos validar el turno", 400);

  const settings = await getLatestSystemSettings();
  if (!settings) return jsonError("No encontramos la configuracion global", 404);

  const fieldLimit = await getFieldLimitSnapshot(parsed.data.fieldId);
  if (!fieldLimit) return jsonError("No encontramos la cancha del turno", 404);

  const startsAt = new Date(parsed.data.startsAt);
  if (Number.isNaN(startsAt.getTime())) return jsonError("La fecha del turno no es valida", 400);

  const { endsAt, validFrom, validUntil } = buildBookingWindow(startsAt, settings.bookingDurationMinutes, settings.graceMinutes);
  const overlap = await findBookingOverlap(parsed.data.fieldId, startsAt, endsAt, id);
  if (overlap) return jsonError("Ya existe un turno que se superpone en esa cancha", 409);

  const db = getDb();
  const [updated] = await db
    .update(bookings)
    .set({
      fieldId: parsed.data.fieldId,
      teamId: parsed.data.teamId || null,
      startsAt,
      endsAt,
      validFrom,
      validUntil,
      checkinLimitSnapshot: fieldLimit,
      status: parsed.data.status,
      updatedAt: new Date(),
    })
    .where(eq(bookings.id, id))
    .returning();

  if (!updated) return jsonError("No encontramos el turno", 404);
  return jsonOk({ success: true, item: updated });
}

export async function DELETE(_: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminApiSession();
  if (!auth.ok) return jsonError(auth.message, auth.status);

  const { id } = await context.params;
  const db = getDb();
  const [updated] = await db.update(bookings).set({ status: "cancelled", updatedAt: new Date() }).where(eq(bookings.id, id)).returning({ id: bookings.id });

  if (!updated) return jsonError("No encontramos el turno", 404);
  return jsonOk({ success: true });
}
