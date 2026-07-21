import { getSessionUserId } from "@/lib/auth/session";
import { getBookingAvailabilityState, getBookingByQrToken, getBookingCheckinCount, hasUserCheckedIn } from "@/lib/checkin";
import { jsonError, jsonOk } from "@/lib/utils/http";

export async function GET(_: Request, context: { params: Promise<{ token: string }> }) {
  const { token } = await context.params;
  const booking = await getBookingByQrToken(token);

  if (!booking) {
    return jsonError("QR no encontrado", 404);
  }

  const checkinsUsed = await getBookingCheckinCount(booking.id);
  const availability = getBookingAvailabilityState(booking, checkinsUsed);
  const userId = await getSessionUserId();
  const alreadyCheckedIn = userId ? await hasUserCheckedIn(booking.id, userId) : false;

  return jsonOk({
    booking: {
      id: booking.id,
      fieldId: booking.fieldId,
      fieldName: booking.fieldName,
      fieldType: booking.fieldType,
      startsAt: booking.startsAt,
      endsAt: booking.endsAt,
      validFrom: booking.validFrom,
      validUntil: booking.validUntil,
      qrToken: booking.qrToken,
      checkinLimit: booking.checkinLimitSnapshot,
      checkinsUsed,
      isFull: availability.isFull,
      isAvailable: availability.isAvailable,
      status: booking.status,
      message: availability.message,
    },
    viewer: {
      authenticated: Boolean(userId),
      alreadyCheckedIn,
    },
  });
}
