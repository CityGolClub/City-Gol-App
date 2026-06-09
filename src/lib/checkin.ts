import { and, count, eq, sql } from "drizzle-orm";

import { getDb } from "@/lib/db/client";
import { bookings, checkins, fields, users } from "@drizzle/schema";

export function getBusinessMonthKey(date: Date) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Argentina/Buenos_Aires",
    year: "numeric",
    month: "2-digit",
  });

  return formatter.format(date);
}

export async function getBookingByQrToken(qrToken: string) {
  const db = getDb();

  const [booking] = await db
    .select({
      id: bookings.id,
      fieldId: bookings.fieldId,
      teamId: bookings.teamId,
      startsAt: bookings.startsAt,
      endsAt: bookings.endsAt,
      validFrom: bookings.validFrom,
      validUntil: bookings.validUntil,
      qrToken: bookings.qrToken,
      checkinLimitSnapshot: bookings.checkinLimitSnapshot,
      status: bookings.status,
      fieldName: fields.name,
      fieldType: fields.fieldType,
    })
    .from(bookings)
    .innerJoin(fields, eq(bookings.fieldId, fields.id))
    .where(eq(bookings.qrToken, qrToken))
    .limit(1);

  return booking ?? null;
}

export async function getBookingCheckinCount(bookingId: string) {
  const db = getDb();
  const [result] = await db.select({ value: count() }).from(checkins).where(eq(checkins.bookingId, bookingId));
  return result?.value ?? 0;
}

export function getBookingAvailabilityState(booking: {
  validFrom: Date;
  validUntil: Date;
  status: string;
  checkinLimitSnapshot: number;
}, checkinsUsed: number) {
  const now = new Date();

  if (booking.status !== "scheduled") {
    return {
      isAvailable: false,
      isFull: false,
      message: "Este QR no esta disponible en este momento",
    };
  }

  if (checkinsUsed >= booking.checkinLimitSnapshot) {
    return {
      isAvailable: false,
      isFull: true,
      message: "Este turno ya alcanzo el maximo de check-ins",
    };
  }

  if (now < booking.validFrom || now > booking.validUntil) {
    return {
      isAvailable: false,
      isFull: false,
      message: "Este QR no esta disponible en este momento",
    };
  }

  return {
    isAvailable: true,
    isFull: false,
    message: null,
  };
}

export async function confirmCheckin(userId: string, qrToken: string) {
  const db = getDb();
  const now = new Date();

  return db.transaction(async (tx) => {
    const [booking] = await tx
      .select({
        id: bookings.id,
        fieldId: bookings.fieldId,
        startsAt: bookings.startsAt,
        endsAt: bookings.endsAt,
        validFrom: bookings.validFrom,
        validUntil: bookings.validUntil,
        checkinLimitSnapshot: bookings.checkinLimitSnapshot,
        status: bookings.status,
      })
      .from(bookings)
      .where(eq(bookings.qrToken, qrToken))
      .limit(1);

    if (!booking) {
      return { success: false as const, status: 404, message: "QR no encontrado" };
    }

    if (booking.status !== "scheduled" || now < booking.validFrom || now > booking.validUntil) {
      return { success: false as const, status: 409, message: "Este QR no esta disponible en este momento" };
    }

    const [existingCheckin] = await tx
      .select({ id: checkins.id })
      .from(checkins)
      .where(and(eq(checkins.bookingId, booking.id), eq(checkins.userId, userId)))
      .limit(1);

    if (existingCheckin) {
      return { success: false as const, status: 409, message: "Ya registramos tu llegada para este turno" };
    }

    const [countRow] = await tx.select({ value: count() }).from(checkins).where(eq(checkins.bookingId, booking.id));
    const used = countRow?.value ?? 0;

    if (used >= booking.checkinLimitSnapshot) {
      return { success: false as const, status: 409, message: "Este turno ya alcanzo el maximo de check-ins" };
    }

    await tx.insert(checkins).values({
      bookingId: booking.id,
      userId,
      fieldId: booking.fieldId,
      checkedInAt: now,
    });

    await tx
      .update(users)
      .set({
        scoreTotal: sql`${users.scoreTotal} + 1`,
        scoreMonthly: sql`${users.scoreMonthly} + 1`,
        scoreVigente: sql`${users.scoreVigente} + 1`,
        updatedAt: now,
      })
      .where(eq(users.id, userId));

    return { success: true as const };
  });
}
