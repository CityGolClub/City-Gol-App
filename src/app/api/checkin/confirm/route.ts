import { getSessionUserId } from "@/lib/auth/session";
import { confirmCheckin, getBookingByQrToken } from "@/lib/checkin";
import { jsonError, jsonOk } from "@/lib/utils/http";
import { getUserPanelPayload } from "@/lib/users/panel";
import { checkinConfirmSchema } from "@/lib/validations/checkin";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = checkinConfirmSchema.safeParse(body);

  if (!parsed.success) {
    return jsonError("No pudimos validar el check-in", 400);
  }

  const userId = await getSessionUserId();

  if (!userId) {
    return jsonError("Necesitas iniciar sesion para hacer check-in", 401);
  }

  const booking = await getBookingByQrToken(parsed.data.qrToken);

  if (!booking) {
    return jsonError("QR no encontrado", 404);
  }

  const result = await confirmCheckin(userId, parsed.data.qrToken);

  if (!result.success) {
    return jsonError(result.message, result.status);
  }

  const panel = await getUserPanelPayload(userId);

  if (!panel) {
    return jsonError("No pudimos cargar el panel del usuario", 500);
  }

  return jsonOk({
    success: true,
    message: "Check-in confirmado",
    showConfirmationModal: true,
    booking: {
      id: booking.id,
      fieldName: booking.fieldName,
      startsAt: booking.startsAt,
      endsAt: booking.endsAt,
    },
    scores: panel.scores,
    panel,
  });
}
