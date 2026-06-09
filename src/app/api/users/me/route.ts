import { getSessionUserId } from "@/lib/auth/session";
import { jsonError, jsonOk } from "@/lib/utils/http";
import { getUserPanelPayload } from "@/lib/users/panel";

export async function GET() {
  const userId = await getSessionUserId();

  if (!userId) {
    return jsonError("No hay una sesion activa", 401);
  }

  const panel = await getUserPanelPayload(userId);

  if (!panel) {
    return jsonError("No encontramos el usuario autenticado", 404);
  }

  return jsonOk(panel);
}
