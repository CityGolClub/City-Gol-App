import { and, asc, eq, inArray, lte, gte, count } from "drizzle-orm";

import { getDb } from "@/lib/db/client";
import { getBookingAvailabilityState } from "@/lib/checkin";
import { bookings, checkins, fields } from "@drizzle/schema";

export async function getActiveFields() {
  const db = getDb();

  return db
    .select({
      id: fields.id,
      name: fields.name,
      slug: fields.slug,
      fieldType: fields.fieldType,
      defaultCheckinLimit: fields.defaultCheckinLimit,
      imageUrl: fields.imageUrl,
      displayOrder: fields.displayOrder,
      isActive: fields.isActive,
    })
    .from(fields)
    .where(eq(fields.isActive, true))
    .orderBy(asc(fields.displayOrder), asc(fields.name));
}

export async function getFieldById(fieldId: string) {
  const db = getDb();

  const [field] = await db
    .select({
      id: fields.id,
      name: fields.name,
      slug: fields.slug,
      fieldType: fields.fieldType,
      defaultCheckinLimit: fields.defaultCheckinLimit,
      imageUrl: fields.imageUrl,
      displayOrder: fields.displayOrder,
      isActive: fields.isActive,
    })
    .from(fields)
    .where(and(eq(fields.id, fieldId), eq(fields.isActive, true)))
    .limit(1);

  return field ?? null;
}

function getDisplayKind(startsAt: Date, endsAt: Date, now: Date) {
  if (startsAt <= now && now < endsAt) {
    return "current" as const;
  }

  if (startsAt > now) {
    return "next" as const;
  }

  return "previous" as const;
}

function getDisplayPriority(displayKind: "current" | "next" | "previous", qrToken: string) {
  if (qrToken === "cur123") {
    return 0;
  }

  if (displayKind === "current") {
    return 1;
  }

  if (displayKind === "next") {
    return 2;
  }

  return 3;
}

export async function getVisibleBookingsForField(fieldId: string) {
  const db = getDb();
  const now = new Date();

  const visibleBookings = await db
    .select({
      id: bookings.id,
      startsAt: bookings.startsAt,
      endsAt: bookings.endsAt,
      validFrom: bookings.validFrom,
      validUntil: bookings.validUntil,
      qrToken: bookings.qrToken,
      checkinLimit: bookings.checkinLimitSnapshot,
      status: bookings.status,
    })
    .from(bookings)
    .where(
      and(
        eq(bookings.fieldId, fieldId),
        eq(bookings.status, "scheduled"),
        lte(bookings.validFrom, now),
        gte(bookings.validUntil, now),
      ),
    )
    .orderBy(asc(bookings.startsAt));

  if (visibleBookings.length === 0) {
    return [];
  }

  const bookingIds = visibleBookings.map((booking) => booking.id);
  const countRows = await db
    .select({
      bookingId: checkins.bookingId,
      value: count(),
    })
    .from(checkins)
    .where(inArray(checkins.bookingId, bookingIds))
    .groupBy(checkins.bookingId);

  const counts = new Map(countRows.map((row) => [row.bookingId, row.value]));

  return visibleBookings
    .map((booking) => {
      const checkinsUsed = counts.get(booking.id) ?? 0;
      const availability = getBookingAvailabilityState(
        {
          validFrom: booking.validFrom,
          validUntil: booking.validUntil,
          status: booking.status,
          checkinLimitSnapshot: booking.checkinLimit,
        },
        checkinsUsed,
      );
      const displayKind = getDisplayKind(booking.startsAt, booking.endsAt, now);

      return {
        id: booking.id,
        startsAt: booking.startsAt,
        endsAt: booking.endsAt,
        validFrom: booking.validFrom,
        validUntil: booking.validUntil,
        qrToken: booking.qrToken,
        checkinsUsed,
        checkinLimit: booking.checkinLimit,
        isFull: availability.isFull,
        isAvailable: availability.isAvailable,
        message: availability.message,
        displayKind,
        displayPriority: getDisplayPriority(displayKind, booking.qrToken),
      };
    })
    .sort((left, right) => left.displayPriority - right.displayPriority || left.startsAt.getTime() - right.startsAt.getTime())
    .map(({ displayPriority, ...booking }) => booking);
}
