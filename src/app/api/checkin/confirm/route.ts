import { createSession } from "@/lib/auth/session";
import { confirmCheckin, getBookingByQrToken } from "@/lib/checkin";
import { jsonError, jsonOk } from "@/lib/utils/http";
import { resolveCheckinUser } from "@/lib/users/identity";
import { getUserPanelPayload } from "@/lib/users/panel";
import { checkinConfirmSchema } from "@/lib/validations/checkin";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = checkinConfirmSchema.safeParse(body);

  if (!parsed.success) {
    return jsonError("Completa todos los datos para confirmar el check-in", 400);
  }

  const identity = await resolveCheckinUser(parsed.data);

  if (!identity.ok) {
    if (identity.reason === "mismatch") {
      return jsonError("Los datos ingresados no coinciden con una cuenta valida", 409);
    }

    return jsonError("La cuenta no se encuentra disponible", 403);
  }

  const booking = await getBookingByQrToken(parsed.data.qrToken);

  if (!booking) {
    return jsonError("QR no encontrado", 404);
  }

  const result = await confirmCheckin(identity.user.id, parsed.data.qrToken);

  if (!result.success) {
    return jsonError(result.message, result.status);
  }

  await createSession(identity.user.id);

  const panel = await getUserPanelPayload(identity.user.id);

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
    createdUser: identity.created,
  });
}
